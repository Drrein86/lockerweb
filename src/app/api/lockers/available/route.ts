import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// מאלץ את הנתיב להיות דינמי
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params?: any } = {}) {
  try {
    const url = new URL(request.url || 'http://localhost:3000')
    const size = url.searchParams.get('size')

    if (!size) {
      return NextResponse.json(
        { error: 'חובה להזין גודל חבילה' },
        { status: 400 }
      )
    }

    // המרת גודל מעברית לאנגלית עבור הדאטבייס
    const sizeMap: { [key: string]: string } = {
      'קטן': 'SMALL',
      'בינוני': 'MEDIUM',
      'גדול': 'LARGE',
      'רחב': 'WIDE'
    }

    const dbSize = sizeMap[size]
    if (!dbSize) {
      return NextResponse.json(
        { error: 'גודל חבילה לא תקין' },
        { status: 400 }
      )
    }

    // חיפוש תאים זמינים
    const availableCells = await prisma.cell.findMany({
      where: {
        size: dbSize as any,
        isOccupied: false
      },
      include: {
        locker: {
          select: {
            id: true,
            location: true,
            description: true
          }
        }
      },
      take: 10 // מגבלה של 10 תאים
    })

    if (availableCells.length === 0) {
      return NextResponse.json({
        available: false,
        message: 'אין תאים זמינים בגודל המבוקש'
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
        code: cell.code,
        size: cell.size
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