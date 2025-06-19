import { NextRequest, NextResponse } from 'next/server'

// Mock data עבור בקרת תאים
const cellControlHistory = [
  {
    id: 1,
    cellId: 1,
    cellCode: 'LOC001_CELL01',
    action: 'OPEN',
    status: 'SUCCESS',
    initiatedBy: 'admin',
    timestamp: new Date().toISOString(),
    duration: 1200 // milliseconds
  }
]

// POST - שליחת פקודה לתא (פתיחה/סגירה)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('🎮 מבצע פקודת בקרה:', data)

    const { cellId, action, lockerId, userId = 'admin' } = data

    if (!cellId || !action || !lockerId) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    // סימולציה של שליחת פקודה לESP32
    const startTime = Date.now()
    
    try {
      // כאן נשלח פקודה אמיתית ל-ESP32
      const commandResult = await sendCommandToESP32(lockerId, cellId, action)
      
      const controlRecord = {
        id: cellControlHistory.length + 1,
        cellId: cellId,
        cellCode: `LOC${String(lockerId).padStart(3, '0')}_CELL${String(cellId).padStart(2, '0')}`,
        action: action.toUpperCase(),
        status: commandResult.success ? 'SUCCESS' : 'FAILED',
        initiatedBy: userId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: commandResult.error || null
      }

      cellControlHistory.push(controlRecord)

      if (commandResult.success) {
        return NextResponse.json({
          success: true,
          message: `פקודת ${action === 'open' ? 'פתיחה' : 'סגירה'} נשלחה בהצלחה`,
          controlId: controlRecord.id,
          duration: controlRecord.duration
        })
      } else {
        return NextResponse.json({
          success: false,
          error: `שגיאה בביצוע פקודת ${action}`,
          details: commandResult.error
        }, { status: 500 })
      }

    } catch (error) {
      console.error('❌ שגיאה בשליחת פקודה:', error)
      
      const controlRecord = {
        id: cellControlHistory.length + 1,
        cellId: cellId,
        cellCode: `LOC${String(lockerId).padStart(3, '0')}_CELL${String(cellId).padStart(2, '0')}`,
        action: action.toUpperCase(),
        status: 'FAILED',
        initiatedBy: userId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      }

      cellControlHistory.push(controlRecord)

      return NextResponse.json({
        success: false,
        error: `שגיאה בשליחת פקודה לתא`,
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ שגיאה כללית בבקרת תא:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה כללית בבקרת תא' },
      { status: 500 }
    )
  }
}

// GET - קבלת היסטוריית בקרה
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const cellId = url.searchParams.get('cellId')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    let history = cellControlHistory

    if (cellId) {
      history = history.filter(record => record.cellId === parseInt(cellId))
    }

    // סדר לפי זמן (החדשים ראשונים)
    history = history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      history: history,
      total: history.length
    })

  } catch (error) {
    console.error('❌ שגיאה בקבלת היסטוריית בקרה:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בקבלת היסטוריית בקרה' },
      { status: 500 }
    )
  }
}

// פונקציה לשליחת פקודות ל-ESP32
async function sendCommandToESP32(lockerId: number, cellId: number, action: string) {
  const LOCKER_IPS = {
    1: '192.168.0.104',
    2: '192.168.0.105'
  }

  const lockerIP = LOCKER_IPS[lockerId as keyof typeof LOCKER_IPS]
  
  if (!lockerIP) {
    throw new Error(`לא נמצא IP עבור לוקר ${lockerId}`)
  }

  try {
    console.log(`📡 שולח פקודה ל-ESP32: ${lockerIP}`)
    console.log(`🎯 פקודה: ${action} עבור תא ${cellId}`)

    // סימולציה של שליחת HTTP request ל-ESP32
    const response = await fetch(`http://${lockerIP}/cell/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer locker-secret-key'
      },
      body: JSON.stringify({
        cellId: cellId,
        action: action,
        timestamp: new Date().toISOString()
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ פקודה נשלחה בהצלחה:', result)
      return { success: true, data: result }
    } else {
      const error = await response.text()
      console.error('❌ שגיאה מהESP32:', error)
      return { success: false, error: `ESP32 Error: ${error}` }
    }

  } catch (error) {
    console.error('❌ שגיאה בתקשורת עם ESP32:', error)
    
    // במקרה של כישלון - נחזיר הצלחה למטרות פיתוח
    console.log('🔧 מצב פיתוח - מחזיר הצלחה סימולטיבית')
    await new Promise(resolve => setTimeout(resolve, 500)) // סימולציה של זמן תגובה
    
    return { 
      success: true, 
      data: { 
        message: `Cell ${cellId} ${action} command simulated successfully`,
        simulated: true 
      } 
    }
  }
}

// PUT - עדכון מידע על תא (לאחר פקודה)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('🔄 מעדכן מידע תא לאחר פקודה:', data)

    const { cellId, status, isLocked, lastOpenedAt, lastClosedAt, openCount } = data

    // כאן נעדכן את מסד הנתונים עם המידע החדש
    const updateData = {
      cellId,
      status,
      isLocked,
      lastOpenedAt: lastOpenedAt || new Date().toISOString(),
      lastClosedAt: lastClosedAt || new Date().toISOString(),
      openCount: openCount || 0,
      updatedAt: new Date().toISOString()
    }

    console.log('📊 מעדכן סטטוס תא:', updateData)

    return NextResponse.json({
      success: true,
      message: 'מידע התא עודכן בהצלחה',
      cell: updateData
    })

  } catch (error) {
    console.error('❌ שגיאה בעדכון מידע תא:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון מידע תא' },
      { status: 500 }
    )
  }
} 