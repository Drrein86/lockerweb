import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mock data עבור הפיתוח
const mockLockers = [
  {
    id: 1,
    name: 'לוקר ראשי',
    location: 'כניסה ראשית',
    description: 'לוקר ראשי בכניסה לבניין',
    ip: '192.168.0.104',
    port: 80,
    deviceId: 'ESP32_001',
    status: 'ONLINE',
    lastSeen: new Date().toISOString(),
    isActive: true,
    cells: [
      {
        id: 1,
        cellNumber: 1,
        code: 'LOC001_CELL01',
        name: 'תא קטן 1',
        size: 'SMALL',
        status: 'AVAILABLE',
        isLocked: true,
        isActive: true,
        lockerId: 1,
        openCount: 5,
        lastOpenedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        cellNumber: 2,
        code: 'LOC001_CELL02',
        name: 'תא בינוני 1',
        size: 'MEDIUM',
        status: 'OCCUPIED',
        isLocked: true,
        isActive: true,
        lockerId: 1,
        openCount: 12,
        lastOpenedAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  },
  {
    id: 2,
    name: 'לוקר משני',
    location: 'חדר דואר',
    description: 'לוקר בחדר הדואר',
    ip: '192.168.0.105',
    port: 80,
    deviceId: 'ESP32_002',
    status: 'OFFLINE',
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    isActive: true,
    cells: []
  }
]

const mockCells = [
  ...mockLockers[0].cells,
  {
    id: 3,
    cellNumber: 1,
    code: 'LOC002_CELL01',
    name: 'תא גדול 1',
    size: 'LARGE',
    status: 'MAINTENANCE',
    isLocked: true,
    isActive: false,
    lockerId: 2,
    openCount: 0,
    lastOpenedAt: new Date().toISOString()
  }
]

// GET - קבלת כל הלוקרים עם התאים
export async function GET() {
  try {
    const lockers = await prisma.locker.findMany({
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
  } catch (error) {
    console.error('שגיאה בטעינת לוקרים:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בטעינת הנתונים'
    }, { status: 500 })
  }
}

// POST - יצירת לוקר חדש או תא חדש
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === 'locker') {
      const { name, location, description, ip, port, deviceId, status, isActive } = body

      const locker = await prisma.locker.create({
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
    }

    if (type === 'cell') {
      const { lockerId, cellNumber, name, size, code, isActive } = body

      // בדיקה שהתא לא קיים כבר
      const existingCell = await prisma.cell.findFirst({
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

      const cell = await prisma.cell.create({
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

    if (type === 'locker') {
      const { name, location, description, ip, port, deviceId, status, isActive } = body

      const locker = await prisma.locker.update({
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
    }

    if (type === 'cell') {
      const { cellNumber, name, size, code, isActive } = body

      const cell = await prisma.cell.update({
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

    if (!type || !id) {
      return NextResponse.json({
        success: false,
        error: 'חסרים פרמטרים נדרשים'
      }, { status: 400 })
    }

    if (type === 'locker') {
      // מחיקת כל התאים של הלוקר קודם
      await prisma.cell.deleteMany({
        where: { lockerId: parseInt(id) }
      })

      // מחיקת הלוקר
      await prisma.locker.delete({
        where: { id: parseInt(id) }
      })

      return NextResponse.json({
        success: true,
        message: 'לוקר נמחק בהצלחה'
      })
    }

    if (type === 'cell') {
      await prisma.cell.delete({
        where: { id: parseInt(id) }
      })

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