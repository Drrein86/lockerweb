import { NextResponse } from 'next/server'
import esp32Controller from '@/lib/esp32-controller'

// מדמה זיכרון לוקרים מחוברים (ב-production צריך Redis או דטאבייס)
const connectedLockers = new Map<number, { status: string, lastSeen: Date }>()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, lockerId, cellId, packageId } = body

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
        return NextResponse.json({ success: unlockSuccess })

      case 'lockCell':
        const lockSuccess = await esp32Controller.lockCell(lockerId, cellId, packageId)
        return NextResponse.json({ success: lockSuccess })

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