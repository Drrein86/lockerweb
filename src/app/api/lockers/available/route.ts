import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// מאלץ את הנתיב להיות דינמי
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params?: any } = {}) {
  try {
    // חיפוש תאים זמינים
    const availableCells = await prisma.cell.findMany({
      where: {
        isLocked: false,
        packages: { none: { status: 'IN_LOCKER' } }
      },
      include: {
        locker: {
          select: {
            id: true,
            location: true,
            name: true
          }
        }
      },
      take: 10 // מגבלה של 10 תאים
    })

    if (availableCells.length === 0) {
      return NextResponse.json({
        available: false,
        message: 'אין תאים זמינים'
      })
    }

    // קיבוץ לפי לוקרים
    const lockerGroups = availableCells.reduce((acc, cell) => {
      const lockerId = cell.locker.id
      if (!acc[lockerId]) {
        acc[lockerId] = {
          locker: cell.locker,
          cells: []
        }
      }
      acc[lockerId].cells.push({
        id: cell.id,
        number: cell.number,
        isLocked: cell.isLocked,
        isOpen: cell.isOpen
      })
      return acc
    }, {} as any)

    return NextResponse.json({
      available: true,
      lockers: Object.values(lockerGroups),
      total: availableCells.length
    })

  } catch (error) {
    console.error('שגיאה בחיפוש תאים זמינים:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 