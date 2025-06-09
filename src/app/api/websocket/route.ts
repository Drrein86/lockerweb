import { NextResponse } from 'next/server'

// מדמה זיכרון לוקרים מחוברים (ב-production צריך Redis או דטאבייס)
const connectedLockers = new Map<number, { status: string, lastSeen: Date }>()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, lockerId, cellCode } = body

    switch (action) {
      case 'connect':
        // רישום לוקר
        connectedLockers.set(lockerId, { 
          status: 'connected', 
          lastSeen: new Date() 
        })
        
        console.log(`🔗 לוקר ${lockerId} התחבר (סימולציה)`)
        
        return NextResponse.json({
          success: true,
          message: `לוקר ${lockerId} נרשם בהצלחה`,
          lockerId
        })

      case 'openCell':
        // פתיחת תא
        const locker = connectedLockers.get(lockerId)
        
        if (!locker) {
          return NextResponse.json({
            success: false,
            error: `לוקר ${lockerId} לא מחובר`
          }, { status: 404 })
        }

        // עדכון זמן אחרון
        locker.lastSeen = new Date()
        
        console.log(`🔓 פקודת פתיחה נשלחה ללוקר ${lockerId}, תא ${cellCode}`)
        
        // סימולציה של פתיחה מוצלחת
        return NextResponse.json({
          success: true,
          message: `תא ${cellCode} נפתח בלוקר ${lockerId}`,
          lockerId,
          cellCode,
          timestamp: new Date().toISOString()
        })

      case 'status':
        // בדיקת סטטוס לוקרים
        const lockers = Array.from(connectedLockers.entries()).map(([id, info]) => ({
          lockerId: id,
          status: info.status,
          lastSeen: info.lastSeen,
          isOnline: (Date.now() - info.lastSeen.getTime()) < 30000 // 30 שניות
        }))
        
        return NextResponse.json({
          success: true,
          connectedLockers: lockers.length,
          lockers
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'פעולה לא מזוהה'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ שגיאה ב-WebSocket API:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בשרת'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  // בדיקת סטטוס כללי
  const lockers = Array.from(connectedLockers.entries()).map(([id, info]) => ({
    lockerId: id,
    status: info.status,
    lastSeen: info.lastSeen,
    isOnline: (Date.now() - info.lastSeen.getTime()) < 30000
  }))
  
  return NextResponse.json({
    success: true,
    message: 'WebSocket API פעיל',
    connectedLockers: lockers.length,
    lockers,
    serverTime: new Date().toISOString()
  })
} 