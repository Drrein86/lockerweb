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

    // חיפוש לוקרים זמינים
    const availableLockers = await prisma.locker.findMany({
      where: {
        status: 'online'
      }
    })

    if (availableLockers.length === 0) {
      return NextResponse.json({
        available: false,
        message: 'אין לוקרים זמינים כרגע'
      })
    }

    // סינון לוקרים עם תאים זמינים
    const lockersWithAvailableCells = availableLockers.filter(locker => {
      const cells = typeof locker.cells === 'object' ? locker.cells as any : {}
      return Object.keys(cells).length > 0
    })

    return NextResponse.json({
      available: lockersWithAvailableCells.length > 0,
      lockers: lockersWithAvailableCells.map(locker => ({
        id: locker.id,
        lockerId: locker.lockerId,
        ip: locker.ip,
        port: locker.port,
        status: locker.status,
        cells: locker.cells
      })),
      total: lockersWithAvailableCells.length
    })

  } catch (error) {
    console.error('שגיאה בחיפוש לוקרים זמינים:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 