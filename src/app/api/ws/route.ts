import { NextRequest } from 'next/server'
import { registerLocker, updateLockerStatus, markLockerOffline } from '@/lib/locker-connections'
import { handleESP32Response } from '@/lib/pending-requests'

// פונקציה ליצירת תאים מנתוני Arduino
async function createCellsFromArduino(deviceId: string, cells: any, ip?: string) {
  try {
    // קודם נמצא את הלוקר במסד הנתונים
    const { prisma } = await import('@/lib/prisma')
    
    let locker = await prisma.locker.findUnique({
      where: { deviceId: deviceId },
      include: { cells: true }
    })
    
    if (!locker) {
      console.log(`⚠️ לא נמצא לוקר עם deviceId: ${deviceId}`)
      // אולי זה לוקר שנוצר בלי deviceId? בואו נחפש לוקר ללא deviceId
      const emptyDeviceIdLocker = await prisma.locker.findFirst({
        where: { deviceId: null },
        include: { cells: true }
      })
      
      if (emptyDeviceIdLocker) {
        console.log(`🔗 מוצא לוקר ריק, מקצה אותו ל-${deviceId}`)
        locker = await prisma.locker.update({
          where: { id: emptyDeviceIdLocker.id },
          data: { 
            deviceId: deviceId,
            ip: ip || null,
            status: 'ONLINE'
          },
          include: { cells: true }
        })
      } else {
        return
      }
    } else if (ip) {
      // עדכון IP אם סופק
      await prisma.locker.update({
        where: { id: locker.id },
        data: { 
          ip: ip,
          status: 'ONLINE'
        }
      })
    }
    
    // בדיקה אילו תאים כבר קיימים
    const existingCells = locker.cells.map(c => c.cellNumber)
    
    // יצירת תאים חדשים שלא קיימים
    for (const [cellName, cellData] of Object.entries(cells) as [string, any][]) {
      // המרת שם תא למספר (A1 -> 1, A2 -> 2, וכו')
      const cellNumber = convertCellNameToNumber(cellName)
      
      if (!existingCells.includes(cellNumber)) {
        console.log(`➕ יוצר תא חדש: ${cellName} (מספר: ${cellNumber})`)
        
        await prisma.cell.create({
          data: {
            lockerId: locker.id,
            cellNumber: cellNumber,
            code: `${deviceId}_CELL${String(cellNumber).padStart(2, '0')}`,
            name: `תא ${cellName}`,
            size: 'MEDIUM', // ברירת מחדל
            status: 'AVAILABLE',
            isLocked: cellData.locked ?? true,
            isActive: true, // תאים מהArduino פעילים
            openCount: 0
          }
        })
      } else {
        console.log(`✅ תא ${cellName} כבר קיים`)
      }
    }
    
    console.log(`✅ סיום יצירת תאים עבור לוקר ${deviceId}`)
    
  } catch (error) {
    console.error(`❌ שגיאה ביצירת תאים עבור ${deviceId}:`, error)
    throw error
  }
}

// פונקציה להמרת שם תא למספר
function convertCellNameToNumber(cellName: string): number {
  // A1 -> 1, A2 -> 2, B1 -> 27, וכו'
  if (cellName.length < 2) return 1
  
  const letter = cellName.charAt(0).toUpperCase()
  const number = parseInt(cellName.slice(1)) || 1
  
  const letterIndex = letter.charCodeAt(0) - 65 // A=0, B=1, וכו'
  return (letterIndex * 26) + number
}

// WebSocket upgrade לא נתמך ב-Next.js API routes
// במקום זה, נשתמש ב-Server-Sent Events (SSE) או polling

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const client = searchParams.get('client')
  
  // בדיקה אם זו בקשת WebSocket upgrade
  const upgrade = request.headers.get('upgrade')
  if (upgrade === 'websocket') {
    // Next.js API routes לא תומכים ב-WebSocket upgrades
    return new Response('WebSocket upgrade not supported in Next.js API routes', {
      status: 426, // Upgrade Required
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'upgrade'
      }
    })
  }
  
  // במקום WebSocket, נחזיר Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // שליחת הודעת התחברות
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to lockerweb SSE',
        timestamp: new Date().toISOString(),
        client: client || 'unknown'
      })}\n\n`)
      
      // שליחת ping כל 30 שניות
      const interval = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        })}\n\n`)
      }, 30000)
      
      // ניקוי כשהחיבור נסגר
      request.signal?.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('📨 WebSocket API received:', data)
    
    // טיפול בהודעות שונות
    switch (data.type) {
                    case 'register':
        // Arduino נרשם למערכת (כמו בשרת הישן)
        console.log(`📝 Arduino נרשם: ${data.id} (IP: ${data.ip})`)
        
        // רישום בזיכרון (כמו בשרת הישן)
        const registeredLocker = registerLocker(data.id, data.ip, data.cells)
        
        // יצירת תאים אוטומטית במסד הנתונים אם הם לא קיימים
        if (data.cells && Object.keys(data.cells).length > 0) {
          try {
            console.log(`🔄 יוצר תאים אוטומטית עבור לוקר ${data.id}`)
            await createCellsFromArduino(data.id, data.cells, data.ip)
          } catch (error) {
            console.error(`❌ שגיאה ביצירת תאים עבור ${data.id}:`, error)
          }
        }
        
        // שידור הודעת חיבור לכל הלקוחות
        const { broadcastLockerConnection } = await import('@/lib/broadcast-status')
        broadcastLockerConnection(data.id, true, data.ip)
        
        return Response.json({
          type: 'registerSuccess',
          message: `נרשמת בהצלחה כלוקר ${data.id}`,
          timestamp: new Date().toISOString()
        })
        
      case 'cellClosed':
        // Arduino מדווח על סגירת תא (כמו בשרת הישן)
        console.log(`🔒 תא ${data.cellId || data.cell} נסגר במכשיר ${data.id}`)
        
        // עדכון סטטוס בזיכרון
        updateLockerStatus(data.id, {
          [data.cellId || data.cell]: {
            locked: data.status === 'closed',
            opened: data.status === 'open'
          }
        })
        
        // שידור עדכון לכל הלקוחות
        const { broadcastStatus } = await import('@/lib/broadcast-status')
        broadcastStatus()
        
        // שליחת אישור חזרה ל-Arduino (כמו בשרת הישן)
        return Response.json({
          type: 'confirmClose',
          id: data.id,
          cellId: data.cellId || data.cell,
          timestamp: new Date().toISOString()
        })
        
      case 'failedToUnlock':
        // Arduino מדווח על כישלון בפתיחה
        console.log(`❌ כישלון בפתיחת תא ${data.cell} במכשיר ${data.id}: ${data.reason}`)
        return Response.json({
          type: 'acknowledged',
          message: 'הודעת כישלון התקבלה',
          timestamp: new Date().toISOString()
        })
        
      case 'unlock':
        // בקשה לפתיחת תא (מהקליינט)
        console.log(`🔓 מבקש פתיחת תא ${data.cell || data.cellId} בלוקר ${data.id}`)
        
        // שליחת פקודה ל-Arduino דרך queue
        try {
          const commandResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://lockerweb-production.up.railway.app'}/api/arduino/commands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetDeviceId: data.id,
              command: {
                type: 'unlock',
                cell: data.cell || data.cellId
              }
            })
          })
          
          if (commandResponse.ok) {
            return Response.json({
              success: true,
              message: `פקודת פתיחה נשלחה לתא ${data.cell || data.cellId} בלוקר ${data.id}`,
              timestamp: new Date().toISOString()
            })
          } else {
            throw new Error('Failed to queue command')
          }
        } catch (error) {
          console.error('❌ שגיאה בשליחת פקודה:', error)
          return Response.json({
            success: false,
            error: 'שגיאה בשליחת פקודה ל-Arduino',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
        
      case 'lock':
        // בקשה לנעילת תא (מהקליינט)
        console.log(`🔒 מבקש נעילת תא ${data.cell || data.cellId} בלוקר ${data.id}`)
        
        return Response.json({
          success: true,
          message: `פקודת נעילה נשלחה לתא ${data.cell || data.cellId} בלוקר ${data.id}`,
          timestamp: new Date().toISOString()
        })
        
      case 'statusUpdate':
        // עדכון מפורט של סטטוס לוקר (כולל סטטיסטיקות)
        console.log(`📊 עדכון סטטוס מלוקר ${data.id}:`, {
          uptime: data.uptime,
          free_heap: data.free_heap,
          wifi_rssi: data.wifi_rssi || data.status?.wifi_rssi,
          stats: data.stats
        })
        
        // עדכון סטטוס מתקדם בזיכרון
        updateLockerStatus(data.id, undefined, undefined, {
          uptime: data.uptime,
          free_heap: data.free_heap,
          wifi_rssi: data.wifi_rssi || data.status?.wifi_rssi,
          stats: data.stats,
          last_update: new Date().toISOString()
        })
        
        // שידור עדכון לכל הלקוחות
        const { broadcastStatus: broadcastStatusUpdate } = await import('@/lib/broadcast-status')
        broadcastStatusUpdate()
        
        return Response.json({
          type: 'statusUpdateSuccess',
          id: data.id,
          message: 'סטטוס עודכן בהצלחה',
          timestamp: new Date().toISOString()
        })

      case 'ping':
        // עדכון זמן חיבור אחרון (כמו בשרת הישן)
        updateLockerStatus(data.id)
        
        return Response.json({
          type: 'pong',
          id: data.id,
          timestamp: new Date().toISOString()
        })
        
      // טיפול בתגובות מArduino (כמו בשרת הישן)
      case 'unlockResponse':
      case 'lockResponse':
        console.log(`📥 התקבלה תגובה מלוקר ${data.lockerId || data.id}:`, data)
        
        // העברה למנגנון הבקשות הממתינות
        const handled = handleESP32Response(data)
        
        return Response.json({
          type: 'acknowledged',
          message: handled ? 'תגובה עובדה בהצלחה' : 'לא נמצאה בקשה ממתינה',
          requestId: data.requestId,
          timestamp: new Date().toISOString()
        })
        
      default:
        console.log('⚠️ סוג הודעה לא מוכר:', data.type)
        return Response.json({
          error: 'Unknown message type',
          type: data.type,
          received: data
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ שגיאה ב-WebSocket API:', error)
    return Response.json({
      error: 'Invalid JSON or server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}
