import { NextRequest, NextResponse } from 'next/server'

// Fallback data במקרה שאין דאטאבייס
const mockLockers = [
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
        lastClosedAt: new Date().toISOString()
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
        lastClosedAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Dynamic import של Prisma כדי לא לשבור את הבניה
let prisma: any = null

async function getPrisma() {
  if (!prisma) {
    try {
      const { PrismaClient } = await import('@prisma/client')
      prisma = new PrismaClient()
      await prisma.$connect()
      return prisma
    } catch (error) {
      console.log('⚠️ לא ניתן להתחבר לדאטאבייס, משתמש במידע מדומה')
      return null
    }
  }
  return prisma
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
    const { type } = body
    const db = await getPrisma()

    if (type === 'locker') {
      const { name, location, description, ip, port, deviceId, status, isActive } = body

      if (db) {
        const locker = await db.locker.create({
          data: {
            name,
            location,
            description,
            ip,
            port: port || 80,
            deviceId,
            status: status || 'OFFLINE',
            isActive: isActive ?? true
          }
        })

        return NextResponse.json({
          success: true,
          locker
        })
      } else {
        // Fallback - הוספה למערך המדומה
        const newLocker = {
          id: mockLockers.length + 1,
          name,
          location,
          description,
          ip,
          port: port || 80,
          deviceId,
          status: status || 'OFFLINE',
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

    if (type === 'cell') {
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
            isActive: isActive ?? true
          }
        })

        return NextResponse.json({
          success: true,
          cell
        })
      } else {
        // Fallback - הוספה למערך המדומה
        const locker = mockLockers.find(l => l.id === lockerId)
        if (!locker) {
          return NextResponse.json({
            success: false,
            error: 'לוקר לא נמצא'
          }, { status: 404 })
        }

        const newCell = {
          id: Date.now(), // ID זמני
          cellNumber,
          name,
          size: size || 'MEDIUM',
          code,
          isActive: isActive ?? true,
          status: 'AVAILABLE',
          isLocked: true,
          lockerId,
          openCount: 0,
          lastOpenedAt: new Date().toISOString(),
          lastClosedAt: new Date().toISOString()
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
      error: 'סוג פעולה לא מוכר'
    }, { status: 400 })

  } catch (error) {
    console.error('שגיאה ביצירת פריט:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה ביצירת הפריט'
    }, { status: 500 })
  }
}

// PUT - עדכון לוקר או תא
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id } = body
    const db = await getPrisma()

    if (type === 'locker') {
      const { name, location, description, ip, port, deviceId, status, isActive } = body

      if (db) {
        const locker = await db.locker.update({
          where: { id },
          data: {
            name,
            location,
            description,
            ip,
            port,
            deviceId,
            status,
            isActive
          }
        })

        return NextResponse.json({
          success: true,
          locker
        })
      } else {
        // Fallback - עדכון במערך המדומה
        const lockerIndex = mockLockers.findIndex(l => l.id === id)
        if (lockerIndex === -1) {
          return NextResponse.json({
            success: false,
            error: 'לוקר לא נמצא'
          }, { status: 404 })
        }

        mockLockers[lockerIndex] = {
          ...mockLockers[lockerIndex],
          name,
          location,
          description,
          ip,
          port,
          deviceId,
          status,
          isActive,
          updatedAt: new Date().toISOString()
        }

        return NextResponse.json({
          success: true,
          locker: mockLockers[lockerIndex]
        })
      }
    }

    if (type === 'cell') {
      const { cellNumber, name, size, code, isActive } = body

      if (db) {
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
      } else {
        // Fallback - עדכון במערך המדומה
        for (const locker of mockLockers) {
          const cellIndex = locker.cells.findIndex(c => c.id === id)
          if (cellIndex !== -1) {
            locker.cells[cellIndex] = {
              ...locker.cells[cellIndex],
              cellNumber,
              name,
              size,
              code,
              isActive
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
    console.error('שגיאה בעדכון פריט:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בעדכון הפריט'
    }, { status: 500 })
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
        const lockerIndex = mockLockers.findIndex(l => l.id === parseInt(id))
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
          const cellIndex = locker.cells.findIndex(c => c.id === parseInt(id))
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