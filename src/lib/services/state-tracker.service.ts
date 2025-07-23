import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class StateTrackerService {
  // עדכון מצב לוקר
  static async updateLockerState(lockerId: number, data: {
    status?: string
    isResponding?: boolean
    lastCommand?: string
    lastCommandStatus?: string
    metadata?: any
    incrementRetries?: boolean
  }) {
    try {
      const updateData: any = {
        lastCommunication: new Date(),
        updatedAt: new Date()
      }

      if (data.status !== undefined) updateData.lastKnownStatus = data.status
      if (data.isResponding !== undefined) updateData.isResponding = data.isResponding
      if (data.lastCommand !== undefined) {
        updateData.lastCommand = data.lastCommand
        updateData.lastCommandTime = new Date()
      }
      if (data.lastCommandStatus !== undefined) updateData.lastCommandStatus = data.lastCommandStatus
      if (data.metadata !== undefined) updateData.metadata = data.metadata
      if (data.incrementRetries) {
        // נצטרך להשתמש ב-raw query או לקבל את הערך הנוכחי
        const current = await (prisma as any).lockerState.findUnique({
          where: { lockerId }
        })
        updateData.connectionRetries = (current?.connectionRetries || 0) + 1
      }

      await (prisma as any).lockerState.upsert({
        where: { lockerId },
        update: updateData,
        create: {
          lockerId,
          lastKnownStatus: data.status || 'OFFLINE',
          lastCommunication: new Date(),
          isResponding: data.isResponding ?? false,
          lastCommand: data.lastCommand,
          lastCommandTime: data.lastCommand ? new Date() : undefined,
          lastCommandStatus: data.lastCommandStatus,
          metadata: data.metadata,
          connectionRetries: data.incrementRetries ? 1 : 0
        }
      })

      console.log(`🔄 מצב לוקר ${lockerId} עודכן: ${data.status || 'לא צוין'}`)
    } catch (error) {
      console.error(`❌ שגיאה בעדכון מצב לוקר ${lockerId}:`, error)
    }
  }

  // עדכון מצב תא
  static async updateCellState(cellId: number, data: {
    status?: string
    physicallyLocked?: boolean
    lastOpenCommand?: boolean
    lastCloseCommand?: boolean
    commandInProgress?: string | null
    metadata?: any
    incrementRetries?: boolean
  }) {
    try {
      const updateData: any = {
        lastSensorCheck: new Date(),
        updatedAt: new Date()
      }

      if (data.status !== undefined) updateData.lastKnownStatus = data.status
      if (data.physicallyLocked !== undefined) updateData.physicallyLocked = data.physicallyLocked
      if (data.lastOpenCommand) updateData.lastOpenCommand = new Date()
      if (data.lastCloseCommand) updateData.lastCloseCommand = new Date()
      if (data.commandInProgress !== undefined) updateData.commandInProgress = data.commandInProgress
      if (data.metadata !== undefined) updateData.metadata = data.metadata
      if (data.incrementRetries) {
        const current = await (prisma as any).cellState.findUnique({
          where: { cellId }
        })
        updateData.retryCount = (current?.retryCount || 0) + 1
      }

      await (prisma as any).cellState.upsert({
        where: { cellId },
        update: updateData,
        create: {
          cellId,
          lastKnownStatus: data.status || 'LOCKED',
          physicallyLocked: data.physicallyLocked ?? true,
          lastOpenCommand: data.lastOpenCommand ? new Date() : undefined,
          lastCloseCommand: data.lastCloseCommand ? new Date() : undefined,
          lastSensorCheck: new Date(),
          commandInProgress: data.commandInProgress,
          metadata: data.metadata,
          retryCount: data.incrementRetries ? 1 : 0
        }
      })

      console.log(`🔄 מצב תא ${cellId} עודכן: ${data.status || 'לא צוין'}`)
    } catch (error) {
      console.error(`❌ שגיאה בעדכון מצב תא ${cellId}:`, error)
    }
  }

  // קבלת מצב נוכחי של לוקר
  static async getLockerState(lockerId: number) {
    try {
      return await (prisma as any).lockerState.findUnique({
        where: { lockerId },
        include: { 
          locker: {
            include: {
              cells: true
            }
          }
        }
      })
    } catch (error) {
      console.error(`❌ שגיאה בקבלת מצב לוקר ${lockerId}:`, error)
      return null
    }
  }

  // קבלת מצב נוכחי של תא
  static async getCellState(cellId: number) {
    try {
      return await (prisma as any).cellState.findUnique({
        where: { cellId },
        include: { 
          cell: {
            include: {
              locker: true
            }
          }
        }
      })
    } catch (error) {
      console.error(`❌ שגיאה בקבלת מצב תא ${cellId}:`, error)
      return null
    }
  }

  // קבלת מצב כל הלוקרים
  static async getAllLockerStates() {
    try {
      console.log('❌ שגיאה בקבלת מצב כל הלוקרים: מודל LockerState לא זמין')
      return []
    } catch (error) {
      console.error('❌ שגיאה בקבלת מצב כל הלוקרים:', error)
      return []
    }
  }

  // קבלת תאים עם פקודות ממתינות
  static async getPendingCommands() {
    try {
      console.log('❌ שגיאה בקבלת פקודות ממתינות: מודל CellState לא זמין')
      return []
    } catch (error) {
      console.error('❌ שגיאה בקבלת פקודות ממתינות:', error)
      return []
    }
  }

  // איפוס ניסיונות חיבור
  static async resetConnectionRetries(lockerId: number) {
    try {
      await (prisma as any).lockerState.update({
        where: { lockerId },
        data: { connectionRetries: 0 }
      })
      console.log(`🔄 ניסיונות חיבור לוקר ${lockerId} אופסו`)
    } catch (error) {
      console.error(`❌ שגיאה באיפוס ניסיונות לוקר ${lockerId}:`, error)
    }
  }

  // ניקוי פקודות ישנות
  static async clearOldCommands(olderThanMinutes: number = 30) {
    try {
      const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000)
      
      const result = await (prisma as any).cellState.updateMany({
        where: {
          commandInProgress: {
            not: null
          },
          updatedAt: {
            lt: cutoffTime
          }
        },
        data: {
          commandInProgress: null
        }
      })

      console.log(`🧹 נוקו ${result.count} פקודות ישנות`)
      return result.count
    } catch (error) {
      console.error('❌ שגיאה בניקוי פקודות ישנות:', error)
      return 0
    }
  }

  // סטטיסטיקות מהירות
  static async getSystemStats() {
    try {
      console.log('❌ שגיאה בקבלת סטטיסטיקות: מודל LockerState לא זמין')
      // נתונים זמניים עד לתיקון מודל הנתונים
      return {
        totalLockers: 0,
        onlineLockers: 0,
        offlineLockers: 0,
        totalCells: 0,
        lockedCells: 0,
        unlockedCells: 0,
        pendingCommands: 0
      }
    } catch (error) {
      console.error('❌ שגיאה בקבלת סטטיסטיקות:', error)
      return {
        totalLockers: 0,
        onlineLockers: 0,
        offlineLockers: 0,
        totalCells: 0,
        lockedCells: 0,
        unlockedCells: 0,
        pendingCommands: 0
      }
    }
  }
} 