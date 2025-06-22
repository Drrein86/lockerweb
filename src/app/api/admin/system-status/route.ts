import { NextRequest, NextResponse } from 'next/server'
import { StateTrackerService } from '@/lib/services/state-tracker.service'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = await StateTrackerService.getSystemStats()
        return NextResponse.json({ success: true, data: stats })

      case 'lockers':
        const lockerStates = await StateTrackerService.getAllLockerStates()
        return NextResponse.json({ 
          success: true, 
          data: lockerStates.map((state: any) => ({
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
            cellsCount: state.locker.cells.length
          }))
        })

      case 'pending':
        const pendingCommands = await StateTrackerService.getPendingCommands()
        return NextResponse.json({
          success: true,
          data: pendingCommands.map((state: any) => ({
            cellId: state.cellId,
            cellNumber: state.cell.cellNumber,
            lockerName: state.cell.locker.name,
            lockerId: state.cell.lockerId,
            commandInProgress: state.commandInProgress,
            retryCount: state.retryCount,
            updatedAt: state.updatedAt,
            waitingTime: Date.now() - state.updatedAt.getTime()
          }))
        })

      case 'cleanup':
        const cleanedCount = await StateTrackerService.clearOldCommands(30)
        return NextResponse.json({
          success: true,
          message: `נוקו ${cleanedCount} פקודות ישנות`,
          cleanedCount
        })

      default:
        // מצב כללי
        const [systemStats, allLockers, pending] = await Promise.all([
          StateTrackerService.getSystemStats(),
          StateTrackerService.getAllLockerStates(),
          StateTrackerService.getPendingCommands()
        ])

        return NextResponse.json({
          success: true,
          data: {
            stats: systemStats,
            lockersOnline: allLockers.filter((l: any) => l.isResponding).length,
            lockersOffline: allLockers.filter((l: any) => !l.isResponding).length,
            pendingCommandsCount: pending.length,
            lastUpdate: new Date()
          }
        })
    }

  } catch (error) {
    console.error('❌ שגיאה בקבלת מצב המערכת:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בקבלת מצב המערכת',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, lockerId, cellId, data } = body

    switch (action) {
      case 'reset-retries':
        if (!lockerId) {
          return NextResponse.json({
            success: false,
            error: 'חסר מזהה לוקר'
          }, { status: 400 })
        }
        
        await StateTrackerService.resetConnectionRetries(parseInt(lockerId))
        return NextResponse.json({
          success: true,
          message: `ניסיונות חיבור לוקר ${lockerId} אופסו`
        })

      case 'update-locker':
        if (!lockerId || !data) {
          return NextResponse.json({
            success: false,
            error: 'חסרים פרמטרים נדרשים'
          }, { status: 400 })
        }
        
        await StateTrackerService.updateLockerState(parseInt(lockerId), data)
        return NextResponse.json({
          success: true,
          message: `מצב לוקר ${lockerId} עודכן`
        })

      case 'update-cell':
        if (!cellId || !data) {
          return NextResponse.json({
            success: false,
            error: 'חסרים פרמטרים נדרשים'
          }, { status: 400 })
        }
        
        await StateTrackerService.updateCellState(parseInt(cellId), data)
        return NextResponse.json({
          success: true,
          message: `מצב תא ${cellId} עודכן`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'פעולה לא מוכרת'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ שגיאה בעדכון מצב המערכת:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בעדכון מצב המערכת',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 