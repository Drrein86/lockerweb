import { NextRequest } from 'next/server'
import { WebSocketServer, WebSocket } from 'ws'
import CellController from '@/lib/websocket-cell-control'

// WebSocket Server לחיבור לוקרים בלבד
let wss: WebSocketServer | null = null

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lockerId = searchParams.get('lockerId')
  const secret = searchParams.get('secret')

  // אימות
  if (!lockerId || secret !== process.env.ADMIN_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // יצירת WebSocket Server אם לא קיים
  if (!wss) {
    wss = new WebSocketServer({ 
      port: 3003,
      path: '/locker-ws'
    })
    console.log('🚀 WebSocket Server for Lockers started on port 3003')
  }

  // התחברות לוקר חדש
  const ws = new WebSocket('ws://localhost:3003/locker-ws')
  
  ws.on('open', () => {
    console.log(`🔐 לוקר ${lockerId} מתחבר למערכת`)
    
    // רישום בקונטרולר
    const cellController = CellController.getInstance()
    cellController.registerLocker(lockerId, ws)
    
    // שליחת אישור הרשמה
    ws.send(JSON.stringify({
      type: 'registration_success',
      lockerId: lockerId,
      message: 'לוקר נרשם בהצלחה במערכת',
      timestamp: new Date().toISOString()
    }))
  })

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log(`📥 הודעה מלוקר ${lockerId}:`, message)
      
      // טיפול בהודעות מהלוקר
      switch (message.type) {
        case 'heartbeat':
          // heartbeat מהלוקר
          ws.send(JSON.stringify({
            type: 'heartbeat_ack',
            timestamp: new Date().toISOString()
          }))
          break
          
        case 'cell_status':
          // עדכון סטטוס תא
          console.log(`🔄 עדכון סטטוס תא ${message.cellId} בלוקר ${lockerId}:`, message.status)
          break
          
        case 'error':
          // שגיאה מהלוקר
          console.error(`❌ שגיאה מלוקר ${lockerId}:`, message.error)
          break
          
        default:
          console.log(`⚠️ הודעה לא מוכרת מלוקר ${lockerId}:`, message.type)
      }
    } catch (error) {
      console.error(`❌ שגיאה בפענוח הודעה מלוקר ${lockerId}:`, error)
    }
  })

  ws.on('close', () => {
    console.log(`🔌 לוקר ${lockerId} התנתק`)
  })

  ws.on('error', (error) => {
    console.error(`❌ שגיאה בחיבור לוקר ${lockerId}:`, error)
  })

  return new Response('WebSocket connection established', { 
    status: 200,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade'
    }
  })
}

// POST - שליחת פקודות ללוקרים
export async function POST(request: NextRequest) {
  try {
    const { action, lockerId, cellId, userId } = await request.json()

    if (!action || !lockerId || !userId) {
      return Response.json({
        success: false,
        error: 'חסרים פרמטרים נדרשים'
      }, { status: 400 })
    }

    const cellController = CellController.getInstance()

    switch (action) {
      case 'unlock_cell':
        if (!cellId) {
          return Response.json({
            success: false,
            error: 'חסר מזהה תא'
          }, { status: 400 })
        }

        const result = await cellController.unlockCell(lockerId, cellId, userId)
        
        return Response.json({
          success: result.success,
          message: result.success 
            ? `תא ${cellId} נפתח בהצלחה`
            : `שגיאה בפתיחת תא: ${result.error}`,
          data: result
        })

      case 'check_status':
        const isOnline = cellController.isLockerOnline(lockerId)
        return Response.json({
          success: true,
          lockerId,
          isOnline,
          message: isOnline ? 'לוקר מחובר' : 'לוקר לא מחובר'
        })

      case 'list_online':
        const onlineLockers = cellController.getOnlineLockers()
        return Response.json({
          success: true,
          onlineLockers,
          count: onlineLockers.length
        })

      default:
        return Response.json({
          success: false,
          error: 'פעולה לא מוכרת'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ שגיאה בטיפול בבקשה:', error)
    return Response.json({
      success: false,
      error: 'שגיאה פנימית בשרת'
    }, { status: 500 })
  }
} 