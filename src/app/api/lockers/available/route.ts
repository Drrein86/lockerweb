import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// מאלץ את הנתיב להיות דינמי
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url || 'http://localhost:3000')
    const size = url.searchParams.get('size')
    const location = url.searchParams.get('location')
    const lockerId = url.searchParams.get('lockerId')

    // אם לא צוין גודל, מחזיר את כל התאים הזמינים
    const sizeFilter = size ? { size: size.toUpperCase() } : {}
    
    // סינון לפי לוקר ספציפי או לפי מיקום
    const lockerFilter = lockerId ? 
      { lockerId: parseInt(lockerId) } : 
      location ? { 
        locker: { 
          location: { 
            contains: location,
            mode: 'insensitive' as const
          } 
        } 
      } : {}

    // חיפוש תאים זמינים במסד הנתונים
    const availableCells = await prisma.cell.findMany({
      where: {
        status: 'AVAILABLE',
        isActive: true,
        ...sizeFilter,
        ...lockerFilter,
        locker: {
          status: 'ONLINE',
          isActive: true,
          // אם מחפשים לפי מיקום, מוסיפים סינון מיקום
          ...(location && !lockerId ? { 
            location: { 
              contains: location,
              mode: 'insensitive' as const
            } 
          } : {})
        }
      },
      include: {
        locker: {
          select: {
            id: true,
            name: true,
            location: true,
            description: true,
            ip: true,
            port: true,
            status: true,
            deviceId: true
          }
        }
      },
      orderBy: [
        { size: 'asc' },
        { cellNumber: 'asc' }
      ]
    })

    // קיבוץ תאים לפי לוקר
    const lockersMap = new Map()
    
    availableCells.forEach(cell => {
      const lockerId = cell.lockerId
      if (!lockersMap.has(lockerId)) {
        lockersMap.set(lockerId, {
          id: cell.locker.id,
          name: cell.locker.name,
          location: cell.locker.location,
          description: cell.locker.description,
          ip: cell.locker.ip,
          port: cell.locker.port,
          status: cell.locker.status,
          deviceId: cell.locker.deviceId,
          availableCells: []
        })
      }
      
      lockersMap.get(lockerId).availableCells.push({
        id: cell.id,
        code: cell.code,
        cellNumber: cell.cellNumber,
        size: cell.size,
        name: cell.name,
        // חישוב שטח לפי גודל (לתצוגה)
        area: getSizeArea(cell.size),
        sizeDisplay: getSizeDisplayName(cell.size)
      })
    })

    const lockers = Array.from(lockersMap.values())

    if (lockers.length === 0) {
      let message = 'אין לוקרים זמינים כרגע'
      
      if (lockerId && size) {
        message = `אין תאים זמינים בגודל ${getSizeDisplayName(size.toUpperCase())} בלוקר זה`
      } else if (size && location) {
        message = `אין לוקרים זמינים עם תאים בגודל ${getSizeDisplayName(size.toUpperCase())} באזור "${location}"`
      } else if (size) {
        message = `אין לוקרים זמינים עם תאים בגודל ${getSizeDisplayName(size.toUpperCase())}`
      } else if (location) {
        message = `אין לוקרים זמינים באזור "${location}"`
      }
      
      return NextResponse.json({
        available: false,
        message,
        lockers: [],
        cells: [],
        total: 0
      })
    }

    // יצירת רשימה פשוטה של תאים (לתצוגה ישירה)
    const cellsList = availableCells.map(cell => ({
      id: cell.id,
      code: cell.code,
      cellNumber: cell.cellNumber,
      size: cell.size,
      sizeDisplay: getSizeDisplayName(cell.size),
      lockerId: cell.lockerId,
      lockerName: cell.locker.name,
      lockerLocation: cell.locker.location,
      area: getSizeArea(cell.size),
      sizeOrder: getSizeOrder(cell.size)
    }))

    return NextResponse.json({
      available: true,
      lockers,
      cells: cellsList,
      total: lockers.length,
      totalCells: availableCells.length,
      query: { size, location, lockerId }
    })

  } catch (error) {
    console.error('שגיאה בחיפוש לוקרים זמינים:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת', details: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// פונקציות עזר לתצוגת גדלים
function getSizeDisplayName(size: string): string {
  const sizeMap: Record<string, string> = {
    'SMALL': 'קטן',
    'MEDIUM': 'בינוני', 
    'LARGE': 'גדול',
    'WIDE': 'רחב'
  }
  return sizeMap[size] || size
}

function getSizeArea(size: string): number {
  const areaMap: Record<string, number> = {
    'SMALL': 150,    // 15x10 ס"מ
    'MEDIUM': 600,   // 30x20 ס"מ
    'LARGE': 1575,   // 45x35 ס"מ
    'WIDE': 2400     // 60x40 ס"מ
  }
  return areaMap[size] || 0
}

function getSizeOrder(size: string): number {
  const orderMap: Record<string, number> = {
    'SMALL': 1,
    'MEDIUM': 2,
    'LARGE': 3,
    'WIDE': 4
  }
  return orderMap[size] || 0
} 