import { NextRequest, NextResponse } from 'next/server'
import wsManager from '@/lib/websocket-server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('🔓 התקבלה בקשה לפתיחת תא:', data)

    const { type, id, cell } = data

    if (!type || !id || !cell) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    if (type !== 'unlock') {
      return NextResponse.json(
        { success: false, error: 'סוג פעולה לא נתמך' },
        { status: 400 }
      )
    }

    // שליחת הודעה דרך WebSocket ל-ESP32
    const message = {
      type: 'unlock',
      cellId: cell,
      timestamp: new Date().toISOString()
    }

    console.log(`📡 שולח הודעה ללוקר ${id}:`, message)

    // שליחה דרך WebSocket Manager
    const result = await wsManager.sendMessageToLocker(id, message)

    if (result.success) {
      console.log('✅ הודעה נשלחה בהצלחה ללוקר:', id)
      return NextResponse.json({
        success: true,
        message: `תא ${cell} נפתח בהצלחה בלוקר ${id}`,
        lockerId: id,
        cellId: cell
      })
    } else {
      console.log('❌ שגיאה בשליחת הודעה ללוקר:', result.error)
      return NextResponse.json({
        success: false,
        error: 'הלוקר לא מחובר או לא זמין',
        details: result.error
      }, { status: 503 })
    }

  } catch (error) {
    console.error('❌ שגיאה כללית בפתיחת תא:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה כללית בפתיחת תא' },
      { status: 500 }
    )
  }
}
