import { NextRequest, NextResponse } from 'next/server'
import { StateTrackerService } from '@/lib/services/state-tracker.service'
import { AuditService } from '@/lib/services/audit.service'

export async function GET(request: NextRequest) {
  try {
    // קבלת סטטיסטיקות כלליות
    const stats = await StateTrackerService.getSystemStats()
    
    // קבלת מצב כל הלוקרים
    const lockerStates = await StateTrackerService.getAllLockerStates()
    
    // קבלת פקודות ממתינות
    const pendingCommands = await StateTrackerService.getPendingCommands()
    
    // קבלת לוגים אחרונים
    const recentLogs = await AuditService.getLogs({
      limit: 100,
      from: new Date(Date.now() - 24 * 60 * 60 * 1000) // יום אחרון
    })
    
    // סיכום לוגים לפי סוג פעולה
    const actionSummary = recentLogs.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        stats,
        lockerStates: lockerStates.map(state => ({
          lockerId: state.lockerId,
          lockerName: state.locker.name,
          location: state.locker.location,
          lastKnownStatus: state.lastKnownStatus,
          lastCommunication: state.lastCommunication,
          isResponding: state.isResponding,
          lastCommand: state.lastCommand,
          lastCommandTime: state.lastCommandTime,
          lastCommandStatus: state.lastCommandStatus,
          connectionRetries: state.connectionRetries,
          cells: state.locker.cells.map(cell => ({
            id: cell.id,
            cellNumber: cell.cellNumber,
            status: cell.status,
            isLocked: cell.isLocked,
            lastOpenedAt: cell.lastOpenedAt,
            lastClosedAt: cell.lastClosedAt,
            openCount: cell.openCount,
            cellState: cell.cellState
          }))
        })),
        pendingCommands: pendingCommands.map(state => ({
          cellId: state.cellId,
          cellNumber: state.cell.cellNumber,
          lockerName: state.cell.locker.name,
          commandInProgress: state.commandInProgress,
          lastCommand: state.lastOpenCommand || state.lastCloseCommand,
          retryCount: state.retryCount,
          updatedAt: state.updatedAt
        })),
        recentActivity: recentLogs.slice(0, 20).map(log => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          timestamp: log.timestamp,
          success: log.success,
          user: log.user ? {
            name: `${log.user.firstName} ${log.user.lastName}`,
            email: log.user.email
          } : null,
          details: log.details
        })),
        actionSummary,
        healthCheck: {
          timestamp: new Date(),
          totalConnections: stats.totalLockers,
          activeConnections: stats.onlineLockers,
          systemUptime: process.uptime()
        }
      }
    })

  } catch (error) {
    console.error('❌ שגיאה בקבלת נתוני דשבורד:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בקבלת נתוני המערכת',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 