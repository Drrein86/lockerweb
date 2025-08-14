import { NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const location = url.searchParams.get('location')
    const city = url.searchParams.get('city')
    const street = url.searchParams.get('street')
    const radius = parseInt(url.searchParams.get('radius') || '5') // רדיוס חיפוש בק"מ

    console.log('🔍 API by-location קיבל:', { location, city, street, radius });

    if (!location && !city && !street) {
      console.log('❌ לא צוינו פרמטרי חיפוש');
      return NextResponse.json(
        { error: 'חובה להזין לפחות כתובת, עיר או רחוב' },
        { status: 400 }
      )
    }

    // חיפוש לוקרים לפי מיקום (חיפוש טקסט פשוט)
    const searchConditions = [];
    
    // חיפוש לפי כתובת מלאה
    if (location) {
      searchConditions.push(
        {
          location: {
            contains: location,
            mode: Prisma.QueryMode.insensitive
          }
        },
        {
          name: {
            contains: location,
            mode: Prisma.QueryMode.insensitive
          }
        },
        {
          description: {
            contains: location,
            mode: Prisma.QueryMode.insensitive
          }
        }
      );
    }
    
    // חיפוש לפי עיר
    if (city) {
      searchConditions.push({
        city: {
          contains: city,
          mode: Prisma.QueryMode.insensitive
        }
      });
    }
    
    // חיפוש לפי רחוב
    if (street) {
      searchConditions.push({
        street: {
          contains: street,
          mode: Prisma.QueryMode.insensitive
        }
      });
    }
    
    const lockers = await prisma.locker.findMany({
      where: {
        status: 'ONLINE',
        isActive: true,
        OR: searchConditions
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

    console.log('📊 לוקרים שנמצאו לפני סינון:', lockers.length);
    lockers.forEach(l => {
      console.log(`   - ${l.name}: ${l._count.cells} תאים זמינים, סטטוס: ${l.status}`);
    });

    // סינון לוקרים שיש להם לפחות תא אחד פנוי
    const availableLockers = lockers.filter((locker: any) => locker._count.cells > 0)
    console.log('✅ לוקרים זמינים אחרי סינון:', availableLockers.length);

    if (availableLockers.length === 0) {
      const searchTerm = location || city || street;
      console.log('❌ לא נמצאו לוקרים זמינים');
      return NextResponse.json({
        found: false,
        message: `לא נמצאו לוקרים פעילים עם תאים זמינים עבור "${searchTerm}"`,
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
      const cells = locker.cells || [];
      const cellsBySize = {
        SMALL: cells.filter((c: any) => c.size === 'SMALL').length,
        MEDIUM: cells.filter((c: any) => c.size === 'MEDIUM').length,
        LARGE: cells.filter((c: any) => c.size === 'LARGE').length,
        WIDE: cells.filter((c: any) => c.size === 'WIDE').length
      }

      return {
        id: locker.id,
        name: locker.name,
        location: locker.location,
        city: locker.city,
        street: locker.street,
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

    const result = {
      found: true,
      lockers: lockersWithStats,
      total: lockersWithStats.length,
      query: {
        location,
        city,
        street,
        radius
      },
      summary: {
        totalLockers: lockersWithStats.length,
        totalAvailableCells: lockersWithStats.reduce((sum: any, l: any) => sum + (l.totalAvailableCells || 0), 0),
        cellsBySize: {
          SMALL: lockersWithStats.reduce((sum: any, l: any) => sum + (l.cellsBySize?.SMALL || 0), 0),
          MEDIUM: lockersWithStats.reduce((sum: any, l: any) => sum + (l.cellsBySize?.MEDIUM || 0), 0),
          LARGE: lockersWithStats.reduce((sum: any, l: any) => sum + (l.cellsBySize?.LARGE || 0), 0),
          WIDE: lockersWithStats.reduce((sum: any, l: any) => sum + (l.cellsBySize?.WIDE || 0), 0)
        }
      }
    };

    console.log('🎯 מחזיר תוצאה:', result);
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ שגיאה בחיפוש לוקרים לפי מיקום:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'שגיאה בשרת', 
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 