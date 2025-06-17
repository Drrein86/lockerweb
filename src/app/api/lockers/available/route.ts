import { NextResponse } from 'next/server'

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

    // במקום לחפש בדאטבייס, נשתמש במערכת Mock
    // חיפוש לוקרים זמינים
    const mockLockers = [
      {
        id: 1,
        lockerId: '001',
        location: 'בניין A - קומה קרקע',
        description: 'ליד המעליות הראשיות',
        ip: '192.168.0.104',
        port: 80,
        status: 'ONLINE',
        cells: [
          { id: 1, code: 'A01', size: 'SMALL', isOccupied: false },
          { id: 2, code: 'A02', size: 'MEDIUM', isOccupied: false },
          { id: 3, code: 'A03', size: 'LARGE', isOccupied: false }
        ]
      },
      {
        id: 2,
        lockerId: '002',
        location: 'בניין B - קומה 1',
        description: 'בלובי',
        ip: '192.168.0.105',
        port: 80,
        status: 'ONLINE',
        cells: [
          { id: 4, code: 'B01', size: 'SMALL', isOccupied: false },
          { id: 5, code: 'B02', size: 'MEDIUM', isOccupied: false }
        ]
      }
    ]

    // סינון לוקרים עם תאים זמינים מהגודל המבוקש
    const lockersWithAvailableCells = mockLockers.filter(locker => {
      const availableCells = locker.cells.filter(cell => 
        !cell.isOccupied && cell.size === size
      )
      return availableCells.length > 0
    })

    if (lockersWithAvailableCells.length === 0) {
      return NextResponse.json({
        available: false,
        message: `אין לוקרים זמינים עם תאים בגודל ${size}`
      })
    }

    return NextResponse.json({
      available: lockersWithAvailableCells.length > 0,
      lockers: lockersWithAvailableCells.map(locker => ({
        id: locker.id,
        lockerId: locker.lockerId,
        location: locker.location,
        description: locker.description,
        ip: locker.ip,
        port: locker.port,
        status: locker.status,
        availableCells: locker.cells.filter(cell => !cell.isOccupied && cell.size === size)
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