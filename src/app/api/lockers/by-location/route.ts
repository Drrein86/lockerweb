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

    // דיבוג: בואו נראה מה יש במסד הנתונים בכלל
    const allLockers = await prisma.locker.findMany({
      where: {
        status: 'ONLINE',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        location: true,
        city: true,
        street: true,
        description: true,
        status: true
      }
    });

    console.log('📋 כל הלוקרים הפעילים במסד הנתונים:');
    allLockers.forEach(locker => {
      console.log(`   לוקר ${locker.id}: ${locker.name}`);
      console.log(`      מיקום: "${locker.location || 'לא מוגדר'}"`);
      console.log(`      עיר: "${locker.city || 'לא מוגדר'}"`);
      console.log(`      רחוב: "${locker.street || 'לא מוגדר'}"`);
      console.log(`      תיאור: "${locker.description || 'לא מוגדר'}"`);
    });

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
    
    console.log('🔎 תנאי חיפוש שנבנו:', JSON.stringify(searchConditions, null, 2));

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

    // חיפוש נוסף לדיבוג - כל התאים בלוקרים
    const allCellsForDebugging = await prisma.locker.findMany({
      where: {
        status: 'ONLINE',
        isActive: true,
        OR: searchConditions
      },
      include: {
        cells: true, // כל התאים ללא סינון
        _count: {
          select: {
            cells: true // כל התאים
          }
        }
      }
    })

    console.log('🔍 דיבוג - מצב כל התאים בלוקרים:');
    allCellsForDebugging.forEach(locker => {
      console.log(`\n📦 לוקר: ${locker.name} (ID: ${locker.id})`);
      if (locker.cells && locker.cells.length > 0) {
        locker.cells.forEach(cell => {
          console.log(`   תא ${cell.cellNumber}: ${cell.status} (גודל: ${cell.size}, פעיל: ${cell.isActive})`);
        });
      } else {
        console.log('   אין תאים');
      }
    });

    console.log('📊 לוקרים שנמצאו לפני סינון:', lockers.length);
    
    if (lockers.length === 0) {
      console.log('❌ לא נמצא אף לוקר שמתאים לתנאי החיפוש!');
      console.log('🔍 בואו נבדוק אם יש התאמה ידנית:');
      
      allLockers.forEach(locker => {
        const matchLocation = location && locker.location && locker.location.toLowerCase().includes(location.toLowerCase());
        const matchCity = city && locker.city && locker.city.toLowerCase().includes(city.toLowerCase());
        const matchStreet = street && locker.street && locker.street.toLowerCase().includes(street.toLowerCase());
        const matchName = location && locker.name && locker.name.toLowerCase().includes(location.toLowerCase());
        const matchDescription = location && locker.description && locker.description.toLowerCase().includes(location.toLowerCase());
        
        console.log(`\n   לוקר ${locker.name}:`);
        console.log(`      מיקום מתאים: ${matchLocation ? '✅' : '❌'} (מחפש: "${location}", יש: "${locker.location}")`);
        console.log(`      עיר מתאימה: ${matchCity ? '✅' : '❌'} (מחפש: "${city}", יש: "${locker.city}")`);
        console.log(`      רחוב מתאים: ${matchStreet ? '✅' : '❌'} (מחפש: "${street}", יש: "${locker.street}")`);
        if (location) {
          console.log(`      שם מתאים: ${matchName ? '✅' : '❌'} (מחפש: "${location}", יש: "${locker.name}")`);
          console.log(`      תיאור מתאים: ${matchDescription ? '✅' : '❌'} (מחפש: "${location}", יש: "${locker.description}")`);
        }
      });
    } else {
      lockers.forEach(l => {
        console.log(`   - ${l.name} (ID: ${l.id}): ${l._count.cells} תאים זמינים, סטטוס: ${l.status}`);
        console.log(`     כל התאים: ${l.cells ? l.cells.length : 0} זמינים מתוך סך התאים`);
      });
    }

    // סינון לוקרים שיש להם לפחות תא אחד פנוי
    const availableLockers = lockers.filter((locker: any) => locker._count.cells > 0)
    console.log('✅ לוקרים זמינים אחרי סינון:', availableLockers.length);

    if (availableLockers.length === 0) {
      const searchTerm = location || city || street;
      console.log('❌ לא נמצאו לוקרים זמינים');
      
      // בדיקה אם יש לוקרים אבל ללא תאים זמינים
      const lockersWithoutCells = lockers.filter((locker: any) => locker._count.cells === 0);
      const hasLockersButNoCells = lockersWithoutCells.length > 0;
      
      if (hasLockersButNoCells) {
        console.log(`📦 נמצאו ${lockersWithoutCells.length} לוקרים אבל כולם ללא תאים זמינים`);
        lockersWithoutCells.forEach(l => {
          console.log(`   - ${l.name}: כל התאים תפוסים`);
        });
      }
      
      return NextResponse.json({
        found: false,
        message: hasLockersButNoCells 
          ? `נמצאו לוקרים באזור "${searchTerm}" אבל כל התאים תפוסים כרגע`
          : `לא נמצאו לוקרים פעילים עבור "${searchTerm}"`,
        lockers: [],
        debugInfo: {
          totalLockersInDB: allLockers.length,
          lockersMatchingSearch: lockers.length,
          lockersWithAvailableCells: availableLockers.length,
          searchParams: { location, city, street },
          allLockers: allLockers.map(l => ({
            name: l.name,
            location: l.location,
            city: l.city,
            street: l.street
          }))
        },
        suggestions: hasLockersButNoCells 
          ? [
              'נסה שוב מאוחר יותר - ייתכן שתאים ישתחררו',
              'בדוק לוקרים באזורים סמוכים',
              'צור קשר עם התמיכה לעדכון על זמינות'
            ]
          : [
              'בדוק אם הכתובת נכתבה נכון',
              'נסה חיפוש רחב יותר (למשל רק שם העיר)',
              'צור קשר עם התמיכה לעדכון על לוקרים חדשים באזור'
            ]
      })
    }

    // חישוב סטטיסטיקות לכל לוקר
    const lockersWithStats = availableLockers.map((locker: any) => {
      const availableCells = locker.cells || [];
      
      // חיפוש הלוקר המקביל עם כל התאים לקבלת סטטיסטיקות מלאות
      const fullLocker = allCellsForDebugging.find(l => l.id === locker.id);
      const allCells = fullLocker?.cells || [];
      
      const cellsBySize = {
        SMALL: availableCells.filter((c: any) => c.size === 'SMALL').length,
        MEDIUM: availableCells.filter((c: any) => c.size === 'MEDIUM').length,
        LARGE: availableCells.filter((c: any) => c.size === 'LARGE').length,
        WIDE: availableCells.filter((c: any) => c.size === 'WIDE').length
      }

      const totalCellsBySize = {
        SMALL: allCells.filter((c: any) => c.size === 'SMALL').length,
        MEDIUM: allCells.filter((c: any) => c.size === 'MEDIUM').length,
        LARGE: allCells.filter((c: any) => c.size === 'LARGE').length,
        WIDE: allCells.filter((c: any) => c.size === 'WIDE').length
      }

      const occupiedCells = allCells.filter((c: any) => c.status === 'OCCUPIED').length;

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
        totalCells: allCells.length,
        occupiedCells: occupiedCells,
        cellsBySize,
        totalCellsBySize,
        hasSmall: cellsBySize.SMALL > 0,
        hasMedium: cellsBySize.MEDIUM > 0,
        hasLarge: cellsBySize.LARGE > 0,
        hasWide: cellsBySize.WIDE > 0,
        // דירוג לפי מספר תאים זמינים
        priority: locker._count.cells,
        // אחוז תפוסה
        occupancyRate: allCells.length > 0 ? Math.round((occupiedCells / allCells.length) * 100) : 0
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
      debugInfo: {
        totalLockersInDB: allLockers.length,
        lockersMatchingSearch: lockers.length,
        lockersWithAvailableCells: availableLockers.length,
        searchParams: { location, city, street }
      },
      summary: {
        totalLockers: lockersWithStats.length,
        totalAvailableCells: lockersWithStats.reduce((sum: any, l: any) => sum + (l.totalAvailableCells || 0), 0),
        totalCells: lockersWithStats.reduce((sum: any, l: any) => sum + (l.totalCells || 0), 0),
        totalOccupiedCells: lockersWithStats.reduce((sum: any, l: any) => sum + (l.occupiedCells || 0), 0),
        overallOccupancyRate: Math.round(
          (lockersWithStats.reduce((sum: any, l: any) => sum + (l.occupiedCells || 0), 0) / 
           Math.max(lockersWithStats.reduce((sum: any, l: any) => sum + (l.totalCells || 0), 0), 1)) * 100
        ),
        availableCellsBySize: {
          SMALL: lockersWithStats.reduce((sum: any, l: any) => sum + (l.cellsBySize?.SMALL || 0), 0),
          MEDIUM: lockersWithStats.reduce((sum: any, l: any) => sum + (l.cellsBySize?.MEDIUM || 0), 0),
          LARGE: lockersWithStats.reduce((sum: any, l: any) => sum + (l.cellsBySize?.LARGE || 0), 0),
          WIDE: lockersWithStats.reduce((sum: any, l: any) => sum + (l.cellsBySize?.WIDE || 0), 0)
        },
        totalCellsBySize: {
          SMALL: lockersWithStats.reduce((sum: any, l: any) => sum + (l.totalCellsBySize?.SMALL || 0), 0),
          MEDIUM: lockersWithStats.reduce((sum: any, l: any) => sum + (l.totalCellsBySize?.MEDIUM || 0), 0),
          LARGE: lockersWithStats.reduce((sum: any, l: any) => sum + (l.totalCellsBySize?.LARGE || 0), 0),
          WIDE: lockersWithStats.reduce((sum: any, l: any) => sum + (l.totalCellsBySize?.WIDE || 0), 0)
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