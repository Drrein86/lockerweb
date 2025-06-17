import { NextRequest, NextResponse } from 'next/server'

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
    console.log('📊 מחזיר רשימת לוקרים עם תאים')
    
    return NextResponse.json({
      success: true,
      lockers: mockLockers,
      total: mockLockers.length
    })
  } catch (error) {
    console.error('❌ שגיאה בקבלת לוקרים:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בקבלת נתונים' },
      { status: 500 }
    )
  }
}

// POST - יצירת לוקר חדש או תא חדש
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('📝 יוצר רשומה חדשה:', data)

    if (data.type === 'locker') {
      // יצירת לוקר חדש
      const newLocker = {
        id: mockLockers.length + 1,
        name: data.name || `לוקר ${mockLockers.length + 1}`,
        location: data.location || '',
        description: data.description || '',
        ip: data.ip || '',
        port: data.port || 80,
        deviceId: data.deviceId || `ESP32_${String(mockLockers.length + 1).padStart(3, '0')}`,
        status: 'OFFLINE',
        lastSeen: new Date().toISOString(),
        isActive: data.isActive !== false,
        cells: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockLockers.push(newLocker)
      
      return NextResponse.json({
        success: true,
        message: 'לוקר חדש נוצר בהצלחה',
        locker: newLocker
      })

    } else if (data.type === 'cell') {
      // יצירת תא חדש
      const locker = mockLockers.find(l => l.id === data.lockerId)
      if (!locker) {
        return NextResponse.json(
          { success: false, error: 'לוקר לא נמצא' },
          { status: 404 }
        )
      }

      const newCell = {
        id: mockCells.length + 1,
        cellNumber: data.cellNumber || (locker.cells.length + 1),
        code: data.code || `LOC${String(data.lockerId).padStart(3, '0')}_CELL${String(data.cellNumber || locker.cells.length + 1).padStart(2, '0')}`,
        name: data.name || `תא ${data.cellNumber || locker.cells.length + 1}`,
        size: data.size || 'MEDIUM',
        status: 'AVAILABLE',
        isLocked: true,
        isActive: data.isActive !== false,
        lockerId: data.lockerId,
        openCount: 0,
        lastOpenedAt: new Date().toISOString(),
        lastClosedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      locker.cells.push(newCell)
      mockCells.push(newCell)

      return NextResponse.json({
        success: true,
        message: 'תא חדש נוצר בהצלחה',
        cell: newCell
      })
    }

    return NextResponse.json(
      { success: false, error: 'סוג לא מוכר' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ שגיאה ביצירת רשומה:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה ביצירת רשומה' },
      { status: 500 }
    )
  }
}

// PUT - עדכון לוקר או תא
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('🔄 מעדכן רשומה:', data)

    if (data.type === 'locker') {
      const lockerIndex = mockLockers.findIndex(l => l.id === data.id)
      if (lockerIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'לוקר לא נמצא' },
          { status: 404 }
        )
      }

      mockLockers[lockerIndex] = {
        ...mockLockers[lockerIndex],
        ...data,
        updatedAt: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        message: 'לוקר עודכן בהצלחה',
        locker: mockLockers[lockerIndex]
      })

    } else if (data.type === 'cell') {
      const cellIndex = mockCells.findIndex(c => c.id === data.id)
      if (cellIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'תא לא נמצא' },
          { status: 404 }
        )
      }

      mockCells[cellIndex] = {
        ...mockCells[cellIndex],
        ...data,
        updatedAt: new Date().toISOString()
      }

      // עדכון גם בלוקר
      const locker = mockLockers.find(l => l.id === mockCells[cellIndex].lockerId)
      if (locker) {
        const lockerCellIndex = locker.cells.findIndex(c => c.id === data.id)
        if (lockerCellIndex !== -1) {
          locker.cells[lockerCellIndex] = mockCells[cellIndex]
        }
      }

      return NextResponse.json({
        success: true,
        message: 'תא עודכן בהצלחה',
        cell: mockCells[cellIndex]
      })
    }

    return NextResponse.json(
      { success: false, error: 'סוג לא מוכר' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ שגיאה בעדכון רשומה:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון רשומה' },
      { status: 500 }
    )
  }
}

// DELETE - מחיקת לוקר או תא
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const type = url.searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    const itemId = parseInt(id)

    if (type === 'locker') {
      const lockerIndex = mockLockers.findIndex(l => l.id === itemId)
      if (lockerIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'לוקר לא נמצא' },
          { status: 404 }
        )
      }

      // בדיקה אם יש תאים תפוסים
      const occupiedCells = mockLockers[lockerIndex].cells.filter(c => c.status === 'OCCUPIED')
      if (occupiedCells.length > 0) {
        return NextResponse.json(
          { success: false, error: 'לא ניתן למחוק לוקר עם תאים תפוסים' },
          { status: 400 }
        )
      }

      mockLockers.splice(lockerIndex, 1)

      return NextResponse.json({
        success: true,
        message: 'לוקר נמחק בהצלחה'
      })

    } else if (type === 'cell') {
      const cellIndex = mockCells.findIndex(c => c.id === itemId)
      if (cellIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'תא לא נמצא' },
          { status: 404 }
        )
      }

      // בדיקה אם התא תפוס
      if (mockCells[cellIndex].status === 'OCCUPIED') {
        return NextResponse.json(
          { success: false, error: 'לא ניתן למחוק תא תפוס' },
          { status: 400 }
        )
      }

      const lockerId = mockCells[cellIndex].lockerId
      mockCells.splice(cellIndex, 1)

      // הסרה מהלוקר
      const locker = mockLockers.find(l => l.id === lockerId)
      if (locker) {
        locker.cells = locker.cells.filter(c => c.id !== itemId)
      }

      return NextResponse.json({
        success: true,
        message: 'תא נמחק בהצלחה'
      })
    }

    return NextResponse.json(
      { success: false, error: 'סוג לא מוכר' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ שגיאה במחיקת רשומה:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה במחיקת רשומה' },
      { status: 500 }
    )
  }
} 