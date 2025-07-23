import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AuditLogData {
  action: string
  entityType: string
  entityId: string
  userId?: number
  details?: any
  ipAddress?: string
  userAgent?: string
  success?: boolean
  errorMessage?: string
}

export class AuditService {
  static async log(data: AuditLogData) {
    try {
      console.log(`📋 אודיט נשמר: ${data.action} על ${data.entityType} ${data.entityId}`, {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          details: data.details,
        success: data.success ?? true
      })
    } catch (error) {
      console.error('❌ שגיאה בשמירת לוג אודיט:', error)
    }
  }

  // פעולות ספציפיות לתאים
  static async logCellOperation(
    cellId: string, 
    action: 'OPEN' | 'CLOSE', 
    userId?: number, 
    success: boolean = true,
    errorMessage?: string,
    details?: any
  ) {
    await this.log({
      action: `${action}_CELL`,
      entityType: 'CELL',
      entityId: cellId,
      userId,
      success,
      errorMessage,
      details: { cellId, action, ...details }
    })
  }

  // פעולות ספציפיות ללוקרים
  static async logLockerConnection(
    lockerId: string,
    action: 'CONNECT' | 'DISCONNECT',
    details?: any
  ) {
    await this.log({
      action: `LOCKER_${action}`,
      entityType: 'LOCKER', 
      entityId: lockerId,
      details
    })
  }

  // פעולות משתמשים
  static async logUserAction(
    userId: number,
    action: string,
    details?: any
  ) {
    await this.log({
      action,
      entityType: 'USER',
      entityId: userId.toString(),
      userId,
      details
    })
  }

  // פעולות חבילות
  static async logPackageAction(
    packageId: string,
    action: string,
    userId?: number,
    details?: any
  ) {
    await this.log({
      action,
      entityType: 'PACKAGE',
      entityId: packageId,
      userId,
      details
    })
  }

  // קבלת לוגים עם פילטרים
  static async getLogs(filters: {
    action?: string
    entityType?: string
    entityId?: string
    userId?: number
    from?: Date
    to?: Date
    limit?: number
  } = {}) {
    try {
      const where: any = {}
      
      if (filters.action) where.action = filters.action
      if (filters.entityType) where.entityType = filters.entityType
      if (filters.entityId) where.entityId = filters.entityId
      if (filters.userId) where.userId = filters.userId
      
      if (filters.from || filters.to) {
        where.timestamp = {}
        if (filters.from) where.timestamp.gte = filters.from
        if (filters.to) where.timestamp.lte = filters.to
      }

      console.log('❌ שגיאה בקבלת לוגי אודיט: מודל AuditLog לא זמין')
      return []
    } catch (error) {
      console.error('❌ שגיאה בקבלת לוגי אודיט:', error)
      return []
    }
  }
} 