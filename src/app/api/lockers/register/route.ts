import { NextRequest, NextResponse } from 'next/server'
import CellController from '@/lib/websocket-cell-control'

// POST - הרשמת לוקר במערכת
export async function POST(request: NextRequest) {
  try {
    const { lockerId, ip, deviceInfo } = await request.json()

    if (!lockerId || !ip) {
      return NextResponse.json({
        success: false,
        error: 'חסרים פרמטרים נדרשים: lockerId, ip'
      }, { status: 400 })
    }

    console.log(`🔐 מבקש הרשמה: לוקר ${lockerId} מכתובת ${ip}`)

    // בדיקה שהלוקר קיים במסד הנתונים
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      let locker = await prisma.locker.findFirst({
        where: { deviceId: lockerId },
        include: { cells: true }
      })

      if (!locker) {
        // יצירת לוקר חדש אוטומטית
        console.log(`🆕 יוצר לוקר חדש: ${lockerId}`)
        
        locker = await prisma.locker.create({
          data: {
            name: `לוקר ${lockerId}`,
            location: 'לא הוגדר',
            description: `לוקר אוטומטי - ${deviceInfo?.model || 'ESP32'}`,
            ip: ip,
            port: 80,
            deviceId: lockerId,
            status: 'ONLINE',
            lastSeen: new Date(),
            isActive: true
          },
          include: { cells: true }
        })

        // יצירת תאים בסיסיים אם לא קיימים
        if (deviceInfo?.cellCount && deviceInfo.cellCount > 0) {
          for (let i = 1; i <= deviceInfo.cellCount; i++) {
            await prisma.cell.create({
              data: {
                cellNumber: i,
                code: `${lockerId}_CELL${String(i).padStart(2, '0')}`,
                name: `תא ${i}`,
                size: 'MEDIUM',
                status: 'AVAILABLE',
                isLocked: true,
                isActive: true,
                lockerId: locker.id
              }
            })
          }
        }

        // טעינה מחדש עם התאים
        locker = await prisma.locker.findFirst({
          where: { deviceId: lockerId },
          include: { cells: true }
        })!
      } else {
        // עדכון פרטי לוקר קיים
        await prisma.locker.update({
          where: { id: locker.id },
          data: {
            ip: ip,
            status: 'ONLINE',
            lastSeen: new Date()
          }
        })
      }

      console.log(`✅ לוקר ${lockerId} נרשם בהצלחה במערכת`)
      console.log(`📊 פרטי לוקר:`, {
        id: locker?.id,
        name: locker?.name,
        cellsCount: locker?.cells?.length || 0
      })

      if (!locker) {
        return NextResponse.json({
          success: false,
          error: 'שגיאה ביצירת לוקר'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'לוקר נרשם בהצלחה במערכת',
        locker: {
          id: locker.id,
          deviceId: locker.deviceId,
          name: locker.name,
          location: locker.location,
          cellsCount: locker.cells.length,
          cells: locker.cells.map(cell => ({
            id: cell.id,
            cellNumber: cell.cellNumber,
            code: cell.code,
            name: cell.name,
            size: cell.size,
            status: cell.status,
            isLocked: cell.isLocked
          }))
        }
      })

    } catch (dbError) {
      console.error('❌ שגיאה במסד הנתונים:', dbError)
      return NextResponse.json({
        success: false,
        error: 'שגיאה במסד הנתונים',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 })
    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('❌ שגיאה בהרשמת לוקר:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בהרשמת לוקר',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET - קבלת רשימת לוקרים רשומים
export async function GET() {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const lockers = await prisma.locker.findMany({
        include: { 
          cells: {
            orderBy: { cellNumber: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      const cellController = CellController.getInstance()
      const onlineLockers = cellController.getOnlineLockers()

      const lockersWithStatus = lockers.map(locker => ({
        ...locker,
        isOnline: onlineLockers.includes(locker.deviceId || ''),
        cellsCount: locker.cells.length
      }))

      return NextResponse.json({
        success: true,
        lockers: lockersWithStatus,
        onlineCount: onlineLockers.length,
        totalCount: lockers.length
      })

    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('❌ שגיאה בקבלת רשימת לוקרים:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בקבלת רשימת לוקרים'
    }, { status: 500 })
  }
} 