import { NextResponse } from 'next/server'

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

export async function POST(request: Request) {
  try {
    console.log('🔧 API unlock-cell called')
    const { lockerId, cellNumber, action } = await request.json()
    console.log('📥 Request data:', { lockerId, cellNumber, action })

    if (!lockerId || !cellNumber || !action) {
      console.log('❌ Missing required parameters')
      return NextResponse.json(
        { success: false, message: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    // קבלת חיבור למסד הנתונים לקבלת פרטי הלוקר האמיתי
    const db = await getPrisma()
    console.log('🔗 Database connection:', db ? 'Connected' : 'Using fallback')

    let lockerIP = '192.168.1.100' // ברירת מחדל
    let lockerPort = 80

    if (db) {
      try {
    // מציאת הלוקר במסד הנתונים
        const locker = await db.locker.findUnique({
          where: { id: lockerId }
        })
        
        if (locker && locker.ip) {
          lockerIP = locker.ip
          lockerPort = locker.port || 80
          console.log(`🔍 מצא לוקר: ${locker.deviceId} ב-${lockerIP}:${lockerPort}`)
        } else {
          console.log('⚠️ לא נמצא לוקר במסד הנתונים, משתמש ברירת מחדל')
    }
      } catch (dbError) {
        console.error('❌ Database query error:', dbError)
        console.log('⚠️ נכשל בחיפוש לוקר, משתמש ברירת מחדל')
    }
    }
    
    console.log(`🔧 מנסה לפתוח תא ${cellNumber} בלוקר ${lockerId} דרך Railway Server`)

    let deviceId = 'LOC632' // ברירת מחדל
    
    if (db) {
      try {
        // מציאת הלוקר במסד הנתונים לקבלת deviceId
        const locker = await db.locker.findUnique({
          where: { id: lockerId }
        })
        
        if (locker && locker.deviceId) {
          deviceId = locker.deviceId
          console.log(`🔍 מצא לוקר: ${locker.deviceId}`)
        } else {
          console.log('⚠️ לא נמצא deviceId במסד הנתונים, משתמש ברירת מחדל')
        }
      } catch (dbError) {
        console.error('❌ Database query error:', dbError)
        console.log('⚠️ נכשל בחיפוש deviceId, משתמש ברירת מחדל')
      }
    }

    // שליחת פקודה ל-Railway Server שיעביר ל-ESP32
    const railwayResponse = await sendCommandToESP32(null, null, {
      action: action,
      cellId: cellNumber.toString(),
      deviceId: deviceId,
      packageId: `TEMP_${Date.now()}`
    })

    console.log('📡 ESP32 Response:', railwayResponse)

      // יצירת לוג אודיט
    try {
      console.log('נוצר לוג: פתיחת תא', {
          action: 'UNLOCK_CELL',
          entityType: 'CELL',
        entityId: cellNumber.toString(),
            lockerId: lockerId,
            cellNumber: cellNumber,
            esp32Response: railwayResponse
      })
    } catch (logError) {
      console.error('שגיאה ביצירת לוג:', logError)
    }

      return NextResponse.json({
        success: true,
        message: railwayResponse.simulated ? 
          'לוקר לא זמין כרגע, נסה שוב מאוחר יותר' : 
          'התא נפתח בהצלחה',
        cellId: cellNumber,
        lockerId: lockerId,
        esp32Response: railwayResponse,
        simulated: railwayResponse.simulated || false
      })

  } catch (error) {
    console.error('שגיאה בפתיחת תא:', error)
    
    // גם במקרה של שגיאה, נחזיר הודעה ברורה
    return NextResponse.json({
      success: false,
      message: 'לוקר לא זמין כרגע, נסה שוב מאוחר יותר',
      cellId: 'לא ידוע',
      lockerId: 'לא ידוע',
      simulated: true,
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    })
  } finally {
    // Prisma cleanup אם צריך
    if (prisma) {
      try {
    await prisma.$disconnect()
      } catch (disconnectError) {
        console.error('Error disconnecting Prisma:', disconnectError)
      }
    }
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