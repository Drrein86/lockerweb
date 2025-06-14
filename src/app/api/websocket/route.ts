import { NextResponse } from 'next/server'
import esp32Controller from '@/lib/esp32-controller'

// מדמה זיכרון לוקרים מחוברים (ב-production צריך Redis או דטאבייס)
const connectedLockers = new Map<number, { status: string, lastSeen: Date }>()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, lockerId, cellId, packageId } = body

    // וידוא שכל הפרמטרים הנדרשים קיימים
    if (!action) {
      return NextResponse.json({ error: 'חסר פרמטר action' }, { status: 400 })
    }

    if (!lockerId) {
      return NextResponse.json({ error: 'חסר מזהה לוקר' }, { status: 400 })
    }

    if (!cellId && ['openCell', 'lockCell'].includes(action)) {
      return NextResponse.json({ error: 'חסר מזהה תא' }, { status: 400 })
    }

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
        const unlockSuccess = await esp32Controller.unlockCell(lockerId, cellId)
        if (!unlockSuccess) {
          return NextResponse.json({ error: 'פתיחת התא נכשלה' }, { status: 500 })
        }
        return NextResponse.json({ success: true })

      case 'lockCell':
        const lockSuccess = await esp32Controller.lockCell(lockerId, cellId, packageId)
        if (!lockSuccess) {
          return NextResponse.json({ error: 'נעילת התא נכשלה' }, { status: 500 })
        }
        return NextResponse.json({ success: true })

      case 'status':
        const status = esp32Controller.getAllStatus()
        return NextResponse.json({ success: true, data: status })

      default:
        return NextResponse.json({ error: 'פעולה לא נתמכת' }, { status: 400 })
    }

  } catch (error) {
    console.error('שגיאה בטיפול בבקשת WebSocket:', error)
    return NextResponse.json({ error: 'שגיאה בטיפול בבקשה' }, { status: 500 })
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