import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - קבלת כל הלוקרים עם התאים
export async function GET() {
  try {
    const lockers = await prisma.locker.findMany({
      include: {
        cells: {
          include: {
            packages: {
              where: {
                status: {
                  in: ['WAITING', 'DELIVERED']
                }
              },
              include: {
                customer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 1 // רק החבילה האחרונה בתא
            }
          },
          orderBy: { cellNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      lockers: lockers.map((locker: any) => ({
        id: locker.id,
        name: locker.name,
        location: locker.location,
        city: locker.city,
        street: locker.street,
        description: locker.description,
        ip: locker.ip,
        port: locker.port,
        deviceId: locker.deviceId,
        status: locker.status,
        lastSeen: locker.lastSeen,
        isActive: locker.isActive,
        totalCells: locker.cells.length,
        availableCells: locker.cells.filter((cell: any) => cell.status === 'AVAILABLE').length,
        occupiedCells: locker.cells.filter((cell: any) => cell.status === 'OCCUPIED').length,
        cells: locker.cells.map((cell: any) => ({
          id: cell.id,
          cellNumber: cell.cellNumber,
          code: cell.code,
          name: cell.name,
          size: cell.size,
          status: cell.status,
          isLocked: cell.isLocked,
          isActive: cell.isActive,
          lastOpenedAt: cell.lastOpenedAt,
          lastClosedAt: cell.lastClosedAt,
          openCount: cell.openCount,
          package: cell.packages && cell.packages.length > 0 ? {
            id: cell.packages[0].id,
            trackingCode: cell.packages[0].trackingCode,
            status: cell.packages[0].status,
            size: cell.packages[0].size,
            createdAt: cell.packages[0].createdAt,
            customer: {
              name: `${cell.packages[0].customer.firstName} ${cell.packages[0].customer.lastName}`.trim(),
              email: cell.packages[0].customer.email,
              phone: cell.packages[0].customer.phone
            }
          } : null
        })),
        createdAt: locker.createdAt,
        updatedAt: locker.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error loading lockers:', error)
    
    return NextResponse.json(
      { 
        error: 'שגיאה בטעינת לוקרים',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - יצירת לוקר חדש או תא חדש
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, name, location, city, street, description, cellsCount = 0 } = body

    // יצירת תא חדש
    if (type === 'cell') {
      const { lockerId, cellNumber, code, name: cellName, size, isActive = true } = body

      if (!lockerId || !cellNumber) {
        return NextResponse.json(
          { error: 'מזהה לוקר ומספר תא נדרשים' },
          { status: 400 }
        )
      }

      const cell = await prisma.cell.create({
        data: {
          lockerId: parseInt(lockerId),
          cellNumber: parseInt(cellNumber),
          code: code || `LOC${String(lockerId).padStart(3, '0')}_CELL${String(cellNumber).padStart(2, '0')}`,
          name: cellName || `תא ${cellNumber}`,
          size: size || 'MEDIUM',
          status: 'AVAILABLE',
          isLocked: true,
          isActive: isActive,
          openCount: 0
        }
      })

      return NextResponse.json({
        success: true,
        cell
      })
    }

    if (!name || !location) {
      return NextResponse.json(
        { error: 'שם ומיקום נדרשים' },
        { status: 400 }
      )
    }

    // יצירת הלוקר קודם בלי deviceId
    const locker = await prisma.locker.create({
      data: {
        name,
        location,
        city: city || null,
        street: street || null,
        description,
        ip: null, // יעודכן כאשר Arduino יתחבר
        port: 80, // ברירת מחדל
        deviceId: null, // נעדכן זאת אחר כך
        status: 'OFFLINE' as any,
        isActive: true
      }
    })

    // יצירת deviceId אוטומטי
    const finalDeviceId = `LOC${String(locker.id).padStart(3, '0')}`

    // עדכון הlוקר עם deviceId הסופי
    const updatedLocker = await prisma.locker.update({
      where: { id: locker.id },
      data: { deviceId: finalDeviceId }
    })

    // יצירת התאים (רק אם מבוקש)
    const cells = []
    if (cellsCount > 0) {
      for (let i = 1; i <= cellsCount; i++) {
        const cellCode = `${finalDeviceId}-${String(i).padStart(2, '0')}`
        
        const cell = await prisma.cell.create({
          data: {
            cellNumber: i,
            code: cellCode,
            name: `תא ${i}`,
            size: (i <= 2 ? 'SMALL' : i <= 4 ? 'MEDIUM' : 'LARGE') as any,
            status: 'AVAILABLE' as any,
            isLocked: true,
            isActive: true,
            lockerId: updatedLocker.id,
            openCount: 0
          }
        })
        cells.push(cell)
      }
    }

    return NextResponse.json({
      success: true,
      locker: {
        ...updatedLocker,
        cells,
        totalCells: cells.length,
        availableCells: cells.length,
        occupiedCells: 0
      }
    })
  } catch (error) {
    console.error('Error creating locker:', error)
    
    return NextResponse.json(
      { 
        error: 'שגיאה ביצירת לוקר',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - עדכון לוקר או תא
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, name, location, city, street, description, status, isActive } = body

    // עדכון תא
    if (type === 'cell') {
      const { size, name: cellName, isActive: cellIsActive } = body

      if (!id) {
        return NextResponse.json(
          { error: 'מזהה תא נדרש' },
          { status: 400 }
        )
      }

      const updatedCell = await prisma.cell.update({
        where: { id: parseInt(id) },
        data: {
          ...(size && { size }),
          ...(cellName && { name: cellName }),
          ...(cellIsActive !== undefined && { isActive: cellIsActive })
        }
      })

      return NextResponse.json({
        success: true,
        cell: updatedCell
      })
    }

    // עדכון לוקר
    if (!id) {
      return NextResponse.json(
        { error: 'מזהה לוקר נדרש' },
        { status: 400 }
      )
    }

    const updatedLocker = await prisma.locker.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(city !== undefined && { city }),
        ...(street !== undefined && { street }),
        ...(description !== undefined && { description }),
        ...(status && { status: status as any }),
        ...(isActive !== undefined && { isActive })
        // ip, port ו-deviceId מתעדכנים אוטומטית כאשר Arduino מתחבר
      },
      include: {
        cells: {
          orderBy: { cellNumber: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      locker: {
        ...updatedLocker,
        totalCells: updatedLocker.cells.length,
        availableCells: updatedLocker.cells.filter((cell: any) => cell.status === 'AVAILABLE').length,
        occupiedCells: updatedLocker.cells.filter((cell: any) => cell.status === 'OCCUPIED').length,
      }
    })
  } catch (error) {
    console.error('Error updating:', error)
    return NextResponse.json(
      { 
        error: 'שגיאה בעדכון',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - מחיקת לוקר או תא
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const type = url.searchParams.get('type')

    if (!id) {
      return NextResponse.json(
        { error: 'מזהה נדרש' },
        { status: 400 }
      )
    }

    // מחיקת תא
    if (type === 'cell') {
      await prisma.cell.delete({
        where: { id: parseInt(id) }
      })

      return NextResponse.json({
        success: true,
        message: 'תא נמחק בהצלחה'
      })
    }

    // מחיקת לוקר
    // מחיקת כל התאים קודם
    await prisma.cell.deleteMany({
      where: { lockerId: parseInt(id) }
    })

    // מחיקת הלוקר
    await prisma.locker.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: 'לוקר נמחק בהצלחה'
    })
  } catch (error) {
    console.error('Error deleting:', error)
    return NextResponse.json(
      { 
        error: 'שגיאה במחיקה',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 