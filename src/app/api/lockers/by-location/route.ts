import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const location = url.searchParams.get('location')
    const radius = parseInt(url.searchParams.get('radius') || '5') // רדיוס חיפוש בק"מ

    if (!location) {
      return NextResponse.json(
        { error: 'חובה להזין כתובת למשלוח' },
        { status: 400 }
      )
    }

    // חיפוש לוקרים לפי מיקום (חיפוש טקסט פשוט)
    const lockers = await prisma.locker.findMany({
      where: {
        status: 'ONLINE',
        isActive: true,
        OR: [
          {
            location: {
              contains: location,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: location,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: location,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        cells: {
          where: {
            status: 'AVAILABLE',
            isActive: true
          }
        },
        _count: {
          select: {
            cells: {
              where: {
                status: 'AVAILABLE',
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // סינון לוקרים שיש להם לפחות תא אחד פנוי
    const availableLockers = lockers.filter((locker: any) => locker._count.cells > 0)

    if (availableLockers.length === 0) {
      return NextResponse.json({
        found: false,
        message: `לא נמצאו לוקרים פעילים עם תאים זמינים באזור "${location}"`,
        lockers: [],
        suggestions: [
          'בדוק אם הכתובת נכתבה נכון',
          'נסה חיפוש רחב יותר (למשל רק שם העיר)',
          'צור קשר עם התמיכה לעדכון על לוקרים חדשים באזור'
        ]
      })
    }

    // חישוב סטטיסטיקות לכל לוקר
    const lockersWithStats = availableLockers.map((locker: any) => {
      const cellsBySize = {
        SMALL: locker.cells.filter((c: any) => c.size === 'SMALL').length,
        MEDIUM: locker.cells.filter((c: any) => c.size === 'MEDIUM').length,
        LARGE: locker.cells.filter((c: any) => c.size === 'LARGE').length,
        WIDE: locker.cells.filter((c: any) => c.size === 'WIDE').length
      }

      return {
        id: locker.id,
        name: locker.name,
        location: locker.location,
        description: locker.description,
        deviceId: locker.deviceId,
        ip: locker.ip,
        port: locker.port,
        status: locker.status,
        totalAvailableCells: locker._count.cells,
        cellsBySize,
        hasSmall: cellsBySize.SMALL > 0,
        hasMedium: cellsBySize.MEDIUM > 0,
        hasLarge: cellsBySize.LARGE > 0,
        hasWide: cellsBySize.WIDE > 0,
        // דירוג לפי מספר תאים זמינים
        priority: locker._count.cells
      }
    })

    // מיון לפי מספר תאים זמינים (יותר תאים = עדיפות גבוהה)
    lockersWithStats.sort((a: any, b: any) => b.priority - a.priority)

    return NextResponse.json({
      found: true,
      lockers: lockersWithStats,
      total: lockersWithStats.length,
      query: {
        location,
        radius
      },
      summary: {
        totalLockers: lockersWithStats.length,
        totalAvailableCells: lockersWithStats.reduce((sum, l) => sum + l.totalAvailableCells, 0),
        cellsBySize: {
          SMALL: lockersWithStats.reduce((sum, l) => sum + l.cellsBySize.SMALL, 0),
          MEDIUM: lockersWithStats.reduce((sum, l) => sum + l.cellsBySize.MEDIUM, 0),
          LARGE: lockersWithStats.reduce((sum, l) => sum + l.cellsBySize.LARGE, 0),
          WIDE: lockersWithStats.reduce((sum, l) => sum + l.cellsBySize.WIDE, 0)
        }
      }
    })

  } catch (error) {
    console.error('שגיאה בחיפוש לוקרים לפי מיקום:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת', details: error instanceof Error ? error.message : 'שגיאה לא ידועה' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 