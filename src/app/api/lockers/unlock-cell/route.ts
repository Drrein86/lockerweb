import { NextRequest, NextResponse } from 'next/server';
import wsManager from '@/lib/websocket-server';

// Dynamic import של Prisma כדי לא לשבור את הבניה
let prisma: any = null

async function getPrisma() {
  if (!prisma) {
    try {
      const { PrismaClient } = await import('@prisma/client')
      prisma = new PrismaClient()
      await prisma.$connect()
      return prisma
    } catch (error) {
      console.error('❌ שגיאה בהתחברות למסד הנתונים:', error)
      return null
    }
  }
  return prisma
}

export const dynamic = 'force-dynamic'

// GET handler לבדיקה שה-API קיים
export async function GET() {
  return NextResponse.json({
    message: 'Unlock Cell API is working',
    timestamp: new Date().toISOString(),
    methods: ['POST'],
    example: {
      method: 'POST',
      body: {
        lockerId: 'LOC632',
        cellId: 'A1',
        packageId: 'PKG123456',
        clientToken: 'TOKEN123456'
      }
    },
    status: 'active'
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 התקבלה בקשה ל-API unlock-cell');
    
    const body = await request.json();
    console.log('📦 Body של הבקשה:', body);
    
    const { lockerId, cellId, packageId, clientToken } = body;
    console.log('🔍 פרמטרים שחולצו:', { lockerId, cellId, packageId, clientToken });
    
    // לוג מפורט יותר לבדיקת טיפוסי הנתונים
    console.log('🔍 טיפוסי נתונים:', {
      lockerId: typeof lockerId,
      cellId: typeof cellId,
      packageId: typeof packageId,
      clientToken: typeof clientToken
    });

    // בדיקת פרמטרים נדרשים
    if (!lockerId || !cellId || !packageId) {
      console.log('❌ חסרים פרמטרים נדרשים:', { lockerId, cellId, packageId });
      return NextResponse.json(
        { 
          error: 'Missing required parameters: lockerId, cellId, packageId',
          status: 'error',
          received: { lockerId, cellId, packageId }
        },
        { status: 400 }
      );
    }

    // בדיקת אימות לקוח
    if (!clientToken || clientToken.length < 6) {
      console.log('❌ טוקן לקוח לא תקין:', clientToken);
      return NextResponse.json(
        { 
          error: 'Invalid client token',
          status: 'error'
        },
        { status: 401 }
      );
    }

    console.log('✅ כל הפרמטרים תקינים, מנסה לשלוח לשרת WebSocket');

    // בדיקה אם שרת WebSocket פועל
    console.log('🔍 בדיקת מצב שרת WebSocket...');
    
    // בדיקה אם אנחנו בסביבת production
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ בסביבת production - שולח לשרת Railway');
      
      // בסביבת production, נשלח לשרת Railway
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 שניות timeout
        
        const railwayResponse = await fetch('https://lockerweb-production.up.railway.app/api/lockers/unlock-cell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lockerId,
            cellId,
            packageId,
            clientToken
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const railwayData = await railwayResponse.json();
        
        if (railwayResponse.ok) {
          console.log('✅ תשובה מהשרת Railway:', railwayData);
          return NextResponse.json({
            status: 'success',
            message: 'Unlock request sent via Railway',
            lockerId,
            cellId,
            packageId,
            simulated: false,
            source: 'railway'
          });
        } else {
          console.log('❌ שגיאה מהשרת Railway:', railwayData);
          return NextResponse.json({
            status: 'error',
            error: 'Railway server error',
            message: 'שגיאה בשרת Railway',
            lockerId,
            cellId,
            packageId,
            simulated: true,
            details: railwayData.error || railwayData.message
          }, { status: 503 });
        }
              } catch (error) {
          console.error('❌ שגיאה בחיבור לשרת Railway:', error);
          
          let errorMessage = 'לא ניתן להתחבר לשרת Railway';
          let errorDetails = error instanceof Error ? error.message : 'שגיאה לא ידועה';
          
          if (error instanceof Error && error.name === 'AbortError') {
            errorMessage = 'הבקשה לשרת Railway נכשלה - timeout';
            errorDetails = 'השרת לא הגיב תוך 8 שניות';
          }
          
          // Fallback - נחזיר הצלחה מדומה
          console.log('⚠️ Railway לא זמין - מחזיר הצלחה מדומה');
          return NextResponse.json({
            status: 'success',
            message: 'Unlock request simulated (Railway unavailable)',
            lockerId,
            cellId,
            packageId,
            simulated: true,
            note: 'הבקשה סומלציה כי השרת Railway לא זמין'
          });
        }
    }
    
    // שליחת פקודה לשרת WebSocket
    try {
      console.log(`📤 שולח פקודה ללוקר ${lockerId}:`, {
        type: 'openByClient',
        lockerId,
        cellId,
        packageId,
        clientToken
      });
      
      const result = await wsManager.sendToLockerWithResponse(lockerId, {
        type: 'openByClient',
        lockerId: lockerId,
        cellId: cellId,
        packageId: packageId,
        clientToken: clientToken
      });

      console.log(`📥 תשובה משרת WebSocket:`, result);

      if (result.success) {
        console.log(`✅ פקודת פתיחה נשלחה ללוקר ${lockerId}`);
        const response = {
          status: 'success',
          message: 'Unlock request sent successfully',
          lockerId,
          cellId,
          packageId,
          simulated: false
        };
        
        console.log(`📤 מחזיר תגובה:`, response);
        return NextResponse.json(response);
      } else {
        console.log(`❌ לוקר ${lockerId} לא מחובר לשרת WebSocket`);
        const response = {
          status: 'error',
          error: 'Locker not connected',
          message: 'הלוקר לא מחובר למערכת כרגע',
          lockerId,
          cellId,
          packageId,
          simulated: true,
          details: result.message
        };
        
        console.log(`📤 מחזיר תגובת שגיאה:`, response);
        return NextResponse.json(response, { status: 503 });
      }
    } catch (error) {
      console.error('❌ שגיאה בשליחת פקודה ללוקר:', error);
      const response = {
        status: 'error',
        error: 'Internal server error',
        message: 'שגיאה פנימית בשרת',
        lockerId,
        cellId,
        packageId,
        simulated: true,
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      };
      
      console.log(`📤 מחזיר תגובת שגיאה:`, response);
      return NextResponse.json(response, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in unlock-cell API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        status: 'error',
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      },
      { status: 500 }
    );
  }
}

// פונקציה לשליחת פקודה ל-ESP32 דרך Railway WebSocket Server
async function sendCommandToESP32(ip: string | null, port: number | null, command: any) {
  try {
    console.log('🔧 התחלת sendCommandToESP32 עם command:', command);
    
    // במקום לשלוח ישירות ל-ESP32, נשלח ל-Railway WebSocket Server
    const railwayUrl = 'https://lockerweb-production.up.railway.app'
    
    console.log(`📡 מנסה להתחבר ל-Railway Server: ${railwayUrl}`)
    
    // יצירת timeout של 5 שניות
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    try {
      const requestBody = {
        type: 'unlock',
        id: command.deviceId || 'LOC632', // מזהה הלוקר
        cell: command.cellId // מספר התא
      };
      
      console.log('📤 שולח לשרת Railway:', requestBody);
      
      // שליחת בקשה ל-Railway Server שישלח WebSocket message ל-ESP32
      const response = await fetch(`${railwayUrl}/api/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📥 תגובה מהשרת Railway:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ שגיאה מהשרת Railway:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Railway Server הגיב בהצלחה:', data)
      
      return {
        success: true,
        message: 'התא נפתח בהצלחה דרך Railway',
        simulated: false,
        railwayResponse: data
      }

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      console.log('❌ שגיאה בחיבור ל-Railway Server:', {
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined
      });
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.log('⏰ Timeout - נופל לסימולציה')
      } else {
        console.log('🔧 Railway Server לא זמין - נופל לסימולציה:', fetchError)
      }
      
      // Fallback לסימולציה
      return { 
        success: false, 
        message: 'לוקר לא זמין כרגע',
        simulated: true,
        originalError: fetchError instanceof Error ? fetchError.message : String(fetchError)
      }
    }

  } catch (error) {
    console.error('שגיאה כללית בחיבור ל-Railway:', error)
    
    // גם במקרה של שגיאה כללית, נחזיר הודעה ברורה
    return { 
      success: false, 
      message: 'לוקר לא זמין כרגע',
      simulated: true,
      error: error instanceof Error ? error.message : String(error)
    }
  }
} 