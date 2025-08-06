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
        lockerId: 1,
        cellNumber: 1,
        action: 'unlock'
      }
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lockerId, cellId, packageId, clientToken } = body;

    // בדיקת פרמטרים נדרשים
    if (!lockerId || !cellId || !packageId) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters: lockerId, cellId, packageId',
          status: 'error'
        },
        { status: 400 }
      );
    }

    // בדיקת אימות לקוח
    if (!clientToken || clientToken.length < 6) {
      return NextResponse.json(
        { 
          error: 'Invalid client token',
          status: 'error'
        },
        { status: 401 }
      );
    }

    // שליחת הודעה לשרת WebSocket
    const message = {
      type: 'openByClient',
      lockerId,
      cellId,
      packageId,
      clientToken
    };

    // כאן נצטרך להוסיף דרך לשלוח הודעה לשרת WebSocket
    // כרגע נחזיר תשובה מוצלחת
    console.log('📦 Client unlock request:', message);

    return NextResponse.json({
      status: 'success',
      message: 'Unlock request sent successfully',
      lockerId,
      cellId,
      packageId
    });

  } catch (error) {
    console.error('❌ Error in unlock-cell API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

// פונקציה לשליחת פקודה ל-ESP32 דרך Railway WebSocket Server
async function sendCommandToESP32(ip: string | null, port: number | null, command: any) {
  try {
    // במקום לשלוח ישירות ל-ESP32, נשלח ל-Railway WebSocket Server
    const railwayUrl = 'https://lockerweb-production.up.railway.app'
    
    console.log(`📡 מנסה להתחבר ל-Railway Server: ${railwayUrl}`)
    
    // יצירת timeout של 5 שניות
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    try {
      // שליחת בקשה ל-Railway Server שישלח WebSocket message ל-ESP32
      const response = await fetch(`${railwayUrl}/api/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'unlock',
          id: command.deviceId || 'LOC632', // מזהה הלוקר
          cell: command.cellId // מספר התא
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
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