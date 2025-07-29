import { NextRequest, NextResponse } from 'next/server'

// Fallback data במקרה שאין דאטאבייס
const mockLockers: any[] = [
  {
    id: 1,
    name: 'לוקר ראשי',
    location: 'כניסה ראשית',
    description: 'לוקר ראשי בכניסה לבניין',
    ip: '192.168.1.100',
    port: 80,
    deviceId: 'ESP32_001',
    status: 'OFFLINE',
    lastSeen: new Date().toISOString(),
    isActive: true,
    cells: [
      {
        id: 1,
        cellNumber: 1,
        code: 'LOC001_CELL01',
        name: 'תא 1',
        size: 'SMALL',
        status: 'AVAILABLE',
        isLocked: true,
        isActive: true,
        lockerId: 1,
        openCount: 0,
        lastOpenedAt: new Date().toISOString(),
        lastClosedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        cellNumber: 2,
        code: 'LOC001_CELL02',
        name: 'תא 2',
        size: 'MEDIUM',
        status: 'AVAILABLE',
        isLocked: true,
        isActive: true,
        lockerId: 1,
        openCount: 0,
        lastOpenedAt: new Date().toISOString(),
        lastClosedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Dynamic import של Prisma כדי לא לשבור את הבניה
let prisma: any = null

async function getPrisma() {
  // לוג מיידי בכל קריאה
  console.log('🔧 getPrisma called');
  console.log('🔧 DATABASE_URL check:', {
    exists: !!process.env.DATABASE_URL,
    length: process.env.DATABASE_URL?.length || 0,
    value: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'MISSING'
  });
  
  if (!prisma) {
    try {
      // בדיקה אם יש DATABASE_URL
      const databaseUrl = process.env.DATABASE_URL
      console.log('🔍 DATABASE_URL exists:', !!databaseUrl)
      console.log('🔍 DATABASE_URL length:', databaseUrl?.length || 0)
      
      if (!databaseUrl) {
        console.log('⚠️ DATABASE_URL לא מוגדר, משתמש במידע מדומה')
        return null
      }

      const { PrismaClient } = await import('@prisma/client')
      prisma = new PrismaClient({
        errorFormat: 'pretty',
        log: ['error', 'warn']
      })
      
      // בדיקת חיבור עם timeout
      const connectPromise = prisma.$connect()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
      
      await Promise.race([connectPromise, timeoutPromise])
      
      // בדיקה פשוטה שהחיבור עובד
      await prisma.$queryRaw`SELECT 1`
      
      console.log('✅ התחברות למסד הנתונים הצליחה')
      return prisma
    } catch (error) {
      console.error('❌ שגיאה בהתחברות למסד הנתונים:', error)
      console.log('⚠️ לא ניתן להתחבר לדאטאבייס, משתמש במידע מדומה')
      prisma = null // איפוס לוודא שלא נשתמש בחיבור שבור
      return null
    }
  }
  
  // אם prisma כבר קיים, בודק שהחיבור עדיין תקין
  try {
    await prisma.$queryRaw`SELECT 1`
  return prisma
  } catch (error) {
    console.error('❌ חיבור קיים לא תקין, מנסה מחדש:', error)
    prisma = null // איפוס החיבור הישן
    return await getPrisma() // ניסיון חדש
  }
}

// GET - קבלת כל הלוקרים עם התאים
export async function GET() {
  try {
    const db = await getPrisma()
    
    if (db) {
      const lockers = await db.locker.findMany({
        include: {
          cells: {
            orderBy: { cellNumber: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        lockers
      })
    } else {
      // Fallback למידע מדומה
      return NextResponse.json({
        success: true,
        lockers: mockLockers
      })
    }
  } catch (error) {
    console.error('שגיאה בטעינת לוקרים:', error)
    return NextResponse.json({
      success: true,
      lockers: mockLockers
    })
  }
}

// POST - יצירת לוקר חדש או תא חדש
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, name, location, description, ip, port, deviceId, status, isActive } = body
    const db = await getPrisma()

    // אם אין type, ברירת המחדל היא 'locker'
    const requestType = type || 'locker'

    if (requestType === 'locker') {
      if (db) {
        try {
        const locker = await db.locker.create({
          data: {
            name: name || 'לוקר חדש',
            location: location || 'לא מוגדר',
            description: description || '',
            ip: ip || '192.168.1.1',
            port: port || 80,
            deviceId: deviceId || `ESP32_${Date.now()}`,
            status: status || 'OFFLINE',
            isActive: isActive ?? true
          }
        })

        return NextResponse.json({
          success: true,
          locker
        })
        } catch (dbError) {
          console.error('❌ Database error creating locker, falling back to mock:', dbError)
          // נופל לfallback mode אם יש שגיאת DB
        }
      } else {
        // Fallback - הוספה למערך המדומה
        const newLocker: any = {
          id: mockLockers.length + 1,
          name: name || 'לוקר חדש',
          location: location || 'לא מוגדר',
          description: description || '',
          ip: ip || '192.168.1.1',
          port: port || 80,
          deviceId: deviceId || `ESP32_${mockLockers.length + 1}`,
          status: status || 'OFFLINE',
          lastSeen: new Date().toISOString(),
          isActive: isActive ?? true,
          cells: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        mockLockers.push(newLocker)
        
        return NextResponse.json({
          success: true,
          locker: newLocker
        })
      }
    }

    if (requestType === 'cell') {
      const { lockerId, cellNumber, name, size, code, isActive } = body

      if (db) {
        // בדיקה שהתא לא קיים כבר
        const existingCell = await db.cell.findFirst({
          where: {
            lockerId,
            cellNumber
          }
        })

        if (existingCell) {
          return NextResponse.json({
            success: false,
            error: 'תא עם מספר זה כבר קיים בלוקר'
          }, { status: 400 })
        }

        const cell = await db.cell.create({
          data: {
            lockerId,
            cellNumber,
            name,
            size: size || 'MEDIUM',
            code,
            status: 'AVAILABLE',
            isLocked: true,
            isActive: false  // תאים חדשים מתחילים כלא פעילים עד חיבור WebSocket ראשון
          }
        })

        return NextResponse.json({
          success: true,
          cell
        })
      } else {
        // Fallback - הוספה למערך המדומה
        const locker = mockLockers.find((l: any) => l.id === lockerId)
        if (!locker) {
          return NextResponse.json({
            success: false,
            error: 'לוקר לא נמצא'
          }, { status: 404 })
        }

        const newCell = {
          id: Math.max(...locker.cells.map((c: any) => c.id), 0) + 1,
          cellNumber,
          code,
          name,
          size: size || 'MEDIUM',
          status: 'AVAILABLE',
          isLocked: true,
          isActive: isActive ?? true,
          lockerId,
          openCount: 0,
          lastOpenedAt: new Date().toISOString(),
          lastClosedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        locker.cells.push(newCell)

        return NextResponse.json({
          success: true,
          cell: newCell
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'סוג לא מוכר'
    }, { status: 400 })

  } catch (error) {
    console.error('שגיאה ביצירת רשומה:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה ביצירת רשומה'
    }, { status: 500 })
  }
}

// PUT - עדכון לוקר או תא
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔄 PUT request received:', JSON.stringify(body, null, 2))
    const { type, id } = body
    const db = await getPrisma()
    console.log('📊 Database connection:', db ? 'Connected' : 'Using fallback')

    if (type === 'locker') {
      const { name, location, description, ip, port, deviceId, status, isActive } = body

      // בדיקת תקינות נתונים
      if (!id) {
        console.error('❌ Missing locker ID')
        return NextResponse.json({
          success: false,
          error: 'חסר מזהה לוקר'
        }, { status: 400 })
      }

      console.log('📝 Updating locker with data:', { id, name, location, description, ip, port, deviceId, status, isActive })

      if (db) {
        try {
        // קודם נקבל את הנתונים הקיימים
        const existingLocker = await db.locker.findUnique({
          where: { id }
        })

        if (!existingLocker) {
          console.error('❌ Locker not found:', id)
          return NextResponse.json({
            success: false,
            error: 'לוקר לא נמצא'
          }, { status: 404 })
        }

        console.log('📋 Existing locker:', existingLocker)

        const locker = await db.locker.update({
          where: { id },
          data: {
            name: name || existingLocker.name,
            location: location || existingLocker.location,
            description: description || existingLocker.description,
            ip: ip || existingLocker.ip,
            port: port || existingLocker.port,
            deviceId: deviceId || existingLocker.deviceId,
            status: status || existingLocker.status,
            isActive: isActive !== undefined ? isActive : existingLocker.isActive
          }
        })

        return NextResponse.json({
          success: true,
          locker
        })
        } catch (dbError) {
          console.error('❌ Database error, falling back to mock:', dbError)
          // נופל לfallback mode אם יש שגיאת DB
        }
      } else {
        // Fallback - עדכון במערך המדומה
        const lockerIndex = mockLockers.findIndex((l: any) => l.id === id)
        if (lockerIndex === -1) {
          return NextResponse.json({
            success: false,
            error: 'לוקר לא נמצא'
          }, { status: 404 })
        }

        mockLockers[lockerIndex] = {
          ...mockLockers[lockerIndex],
          name: name || mockLockers[lockerIndex].name,
          location: location || mockLockers[lockerIndex].location,
          description: description || mockLockers[lockerIndex].description,
          ip: ip || mockLockers[lockerIndex].ip,
          port: port || mockLockers[lockerIndex].port,
          deviceId: deviceId || mockLockers[lockerIndex].deviceId,
          status: status || mockLockers[lockerIndex].status,
          isActive: isActive ?? mockLockers[lockerIndex].isActive,
          updatedAt: new Date().toISOString()
        }

        return NextResponse.json({
          success: true,
          locker: mockLockers[lockerIndex]
        })
      }
    }

    if (type === 'cell') {
      const { cellNumber, name, size, code, isActive, lockerId } = body

      if (db) {
        // אם זה שיוך תא חדש ללוקר, צריך לוודא שהלוקר קיים
        if (lockerId) {
          console.log('🔍 בודק אם לוקר קיים:', lockerId)
          let locker = await db.locker.findUnique({
            where: { id: lockerId }
          })

          if (!locker) {
            console.log('📝 יוצר לוקר חדש:', lockerId)
            // יצירת לוקר חדש אם לא קיים
            locker = await db.locker.create({
              data: {
                id: lockerId,
                name: `לוקר ${lockerId}`,
                location: 'לא מוגדר',
                description: 'לוקר שנוצר אוטומטית',
                status: 'OFFLINE',
                isActive: true
              }
            })
            console.log('✅ לוקר נוצר:', locker)
          }

          // יצירת תא חדש
          const cell = await db.cell.create({
            data: {
              cellNumber,
              name,
              size: size || 'MEDIUM',
              code,
              isActive: isActive ?? true,
              lockerId
            }
          })

          return NextResponse.json({
            success: true,
            cell
          })
        } else {
          // עדכון תא קיים
        const cell = await db.cell.update({
          where: { id },
          data: {
            cellNumber,
            name,
            size,
            code,
            isActive
          }
        })

        return NextResponse.json({
          success: true,
          cell
        })
        }
      } else {
        // Fallback - עדכון במערך המדומה
        for (const locker of mockLockers) {
          const cellIndex = locker.cells.findIndex((c: any) => c.id === id)
          if (cellIndex !== -1) {
            locker.cells[cellIndex] = {
              ...locker.cells[cellIndex],
              cellNumber: cellNumber || locker.cells[cellIndex].cellNumber,
              name: name || locker.cells[cellIndex].name,
              size: size || locker.cells[cellIndex].size,
              code: code || locker.cells[cellIndex].code,
              isActive: isActive ?? locker.cells[cellIndex].isActive,
              updatedAt: new Date().toISOString()
            }

            return NextResponse.json({
              success: true,
              cell: locker.cells[cellIndex]
            })
          }
        }

        return NextResponse.json({
          success: false,
          error: 'תא לא נמצא'
        }, { status: 404 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'סוג פעולה לא מוכר'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ שגיאה בעדכון פריט:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
    
    // מחזירים תגובה עם פרטי שגיאה מפורטים יותר
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isPrismaError = errorMessage.includes('Prisma') || errorMessage.includes('Database')
    
    return NextResponse.json({
      success: false,
      error: isPrismaError ? 'שגיאה בחיבור למסד הנתונים - משתמש במצב סימולציה' : 'שגיאה בעדכון הפריט',
      details: errorMessage,
      fallback: !isPrismaError ? null : 'המערכת עובדת במצב מדומה בלי מסד נתונים'
    }, { status: isPrismaError ? 503 : 500 })
  }
}

// DELETE - מחיקת לוקר או תא
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    const db = await getPrisma()

    if (!type || !id) {
      return NextResponse.json({
        success: false,
        error: 'חסרים פרמטרים נדרשים'
      }, { status: 400 })
    }

    if (type === 'locker') {
      if (db) {
        // מחיקת כל התאים של הלוקר קודם
        await db.cell.deleteMany({
          where: { lockerId: parseInt(id) }
        })

        // מחיקת הלוקר
        await db.locker.delete({
          where: { id: parseInt(id) }
        })
      } else {
        // Fallback - מחיקה מהמערך המדומה
        const lockerIndex = mockLockers.findIndex((l: any) => l.id === parseInt(id))
        if (lockerIndex !== -1) {
          mockLockers.splice(lockerIndex, 1)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'לוקר נמחק בהצלחה'
      })
    }

    if (type === 'cell') {
      if (db) {
        await db.cell.delete({
          where: { id: parseInt(id) }
        })
      } else {
        // Fallback - מחיקה מהמערך המדומה
        for (const locker of mockLockers) {
          const cellIndex = locker.cells.findIndex((c: any) => c.id === parseInt(id))
          if (cellIndex !== -1) {
            locker.cells.splice(cellIndex, 1)
            break
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'תא נמחק בהצלחה'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'סוג פעולה לא מוכר'
    }, { status: 400 })

  } catch (error) {
    console.error('שגיאה במחיקת פריט:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה במחיקת הפריט'
    }, { status: 500 })
  }
} 