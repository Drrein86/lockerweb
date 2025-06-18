// WebSocket Controller לבקרת תאים בלבד
import { WebSocket } from 'ws'

interface CellControlRequest {
  action: 'unlock' | 'lock'
  lockerId: string
  cellId: string
  userId: string
  timestamp: number
}

interface CellControlResponse {
  success: boolean
  lockerId: string
  cellId: string
  action: 'unlock' | 'lock'
  timestamp: number
  error?: string
}

// Map של חיבורי לוקרים פעילים
const activeLockersMap = new Map<string, WebSocket>()

class CellController {
  private static instance: CellController

  static getInstance(): CellController {
    if (!CellController.instance) {
      CellController.instance = new CellController()
    }
    return CellController.instance
  }

  // רישום לוקר במערכת (פעם אחת בלבד)
  registerLocker(lockerId: string, ws: WebSocket): void {
    console.log(`🔐 רושם לוקר ${lockerId} במערכת`)
    
    // ניקוי חיבור קיים אם יש
    if (activeLockersMap.has(lockerId)) {
      const oldWs = activeLockersMap.get(lockerId)
      if (oldWs && oldWs.readyState === WebSocket.OPEN) {
        oldWs.close()
      }
    }

    // רישום החיבור החדש
    activeLockersMap.set(lockerId, ws)

    // הגדרת מאזינים
    ws.on('close', () => {
      console.log(`🔌 לוקר ${lockerId} התנתק`)
      activeLockersMap.delete(lockerId)
      this.updateLockerStatus(lockerId, 'OFFLINE')
    })

    ws.on('error', (error) => {
      console.error(`❌ שגיאה בלוקר ${lockerId}:`, error)
      activeLockersMap.delete(lockerId)
      this.updateLockerStatus(lockerId, 'OFFLINE')
    })

    // עדכון סטטוס במסד הנתונים
    this.updateLockerStatus(lockerId, 'ONLINE')
  }

  // פתיחת תא (הפונקציה היחידה ב-WebSocket)
  async unlockCell(lockerId: string, cellId: string, userId: string): Promise<CellControlResponse> {
    console.log(`🔓 מנסה לפתוח תא ${cellId} בלוקר ${lockerId} עבור משתמש ${userId}`)

    const ws = activeLockersMap.get(lockerId)
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return {
        success: false,
        lockerId,
        cellId,
        action: 'unlock',
        timestamp: Date.now(),
        error: 'לוקר לא מחובר'
      }
    }

    return new Promise((resolve) => {
      const requestId = `${lockerId}_${cellId}_${Date.now()}`
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          lockerId,
          cellId,
          action: 'unlock',
          timestamp: Date.now(),
          error: 'זמן התגובה פג'
        })
      }, 5000)

      const request: CellControlRequest = {
        action: 'unlock',
        lockerId,
        cellId,
        userId,
        timestamp: Date.now()
      }

      // מאזין לתגובה
      const responseHandler = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString())
          if (response.type === 'cellResponse' && 
              response.lockerId === lockerId && 
              response.cellId === cellId) {
            clearTimeout(timeout)
            ws.off('message', responseHandler)
            
            // עדכון במסד הנתונים
            this.updateCellStatus(cellId, response.success ? 'UNLOCKED' : 'LOCKED')
            
            resolve({
              success: response.success,
              lockerId,
              cellId,
              action: 'unlock',
              timestamp: Date.now(),
              error: response.error
            })
          }
        } catch (error) {
          console.error('❌ שגיאה בפענוח תגובה:', error)
        }
      }

      ws.on('message', responseHandler)
      
      // שליחת הבקשה
      ws.send(JSON.stringify(request))
      console.log(`📤 נשלחה בקשת פתיחה ללוקר ${lockerId}`)
    })
  }

  // בדיקת סטטוס לוקר
  isLockerOnline(lockerId: string): boolean {
    const ws = activeLockersMap.get(lockerId)
    return ws ? ws.readyState === WebSocket.OPEN : false
  }

  // קבלת רשימת לוקרים מחוברים
  getOnlineLockers(): string[] {
    const onlineLockers: string[] = []
    for (const [lockerId, ws] of activeLockersMap.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        onlineLockers.push(lockerId)
      }
    }
    return onlineLockers
  }

  // עדכון סטטוס לוקר במסד הנתונים
  private async updateLockerStatus(lockerId: string, status: 'ONLINE' | 'OFFLINE'): Promise<void> {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      await prisma.locker.updateMany({
        where: { deviceId: lockerId },
        data: { 
          status,
          lastSeen: new Date()
        }
      })
      
      console.log(`📊 עודכן סטטוס לוקר ${lockerId} ל-${status}`)
    } catch (error) {
      console.error('❌ שגיאה בעדכון סטטוס לוקר:', error)
    }
  }

  // עדכון סטטוס תא במסד הנתונים
  private async updateCellStatus(cellId: string, status: 'LOCKED' | 'UNLOCKED'): Promise<void> {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      await prisma.cell.updateMany({
        where: { code: cellId },
        data: { 
          status: status === 'UNLOCKED' ? 'AVAILABLE' : 'LOCKED',
          isLocked: status === 'LOCKED',
          lastOpenedAt: status === 'UNLOCKED' ? new Date() : undefined
        }
      })
      
      console.log(`📊 עודכן סטטוס תא ${cellId} ל-${status}`)
    } catch (error) {
      console.error('❌ שגיאה בעדכון סטטוס תא:', error)
    }
  }
}

export default CellController 