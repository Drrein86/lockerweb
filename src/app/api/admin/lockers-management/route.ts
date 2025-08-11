import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - קבלת כל הלוקרים עם התאים (רק מ-Railway DB)
export async function GET() {
  try {
    console.log('🔍 טוען לוקרים מ-Railway PostgreSQL...')
    
    // בדיקת חיבור ראשונית
    await prisma.$connect()
    console.log('✅ חיבור ל-Railway DB הצליח')
    
    const lockers = await prisma.locker.findMany({
      include: {
        cells: {
          orderBy: { cellNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ נמצאו ${lockers.length} לוקרים ב-Railway`)

    return NextResponse.json({
      success: true,
      lockers: lockers.map(locker => ({
        id: locker.id,
        name: locker.name,
        location: locker.location,
        description: locker.description,
        ip: locker.ip,
        port: locker.port,
        deviceId: locker.deviceId,
        status: locker.status,
        lastSeen: locker.lastSeen,
        isActive: locker.isActive,
        totalCells: locker.cells.length,
        availableCells: locker.cells.filter(cell => cell.status === 'AVAILABLE').length,
        occupiedCells: locker.cells.filter(cell => cell.status === 'OCCUPIED').length,
        cells: locker.cells.map(cell => ({
          id: cell.id,
          cellNumber: cell.cellNumber,
          code: cell.code,
          name: cell.name,
          size: cell.size,
          status: cell.status,
          isLocked: cell.isLocked,
          isActive: cell.isActive,
          lastOpenedAt: cell.lastOpenedAt,
          lastClosedAt: cell.lastClosedAt,
          openCount: cell.openCount
        })),
        createdAt: locker.createdAt,
        updatedAt: locker.updatedAt
      }))
    })
  } catch (error) {
    console.error('❌ שגיאה בטעינת לוקרים מ-Railway:', error)
    
    // בדיקה אם זו שגיאת חיבור לDB
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { 
          error: 'שגיאה בחיבור לDB - DATABASE_URL לא מוגדר',
          details: 'נדרש להגדיר את משתנה הסביבה DATABASE_URL',
          errorType: 'DATABASE_CONNECTION'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'שגיאה בטעינת לוקרים מ-Railway',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST - יצירת לוקר חדש (רק ב-Railway DB)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, location, description, ip, port, deviceId, cellsCount = 6 } = body

    if (!name || !location) {
      return NextResponse.json(
        { error: 'שם ומיקום נדרשים' },
        { status: 400 }
      )
    }

    console.log(`🆕 יוצר לוקר חדש ב-Railway: ${name}`)
    
    // בדיקת חיבור ראשונית
    await prisma.$connect()
    console.log('✅ חיבור ל-Railway DB הצליח לPOST')

    // יצירת הלוקר
    const locker = await prisma.locker.create({
      data: {
        name,
        location,
        description,
        ip,
        port,
        deviceId,
        status: 'OFFLINE',
        isActive: true
      }
    })

    // יצירת התאים
    const cells = []
    for (let i = 1; i <= cellsCount; i++) {
      const cellCode = `${deviceId || locker.id}-${String(i).padStart(2, '0')}`
      const cell = await prisma.cell.create({
        data: {
          cellNumber: i,
          code: cellCode,
          name: `תא ${i}`,
          size: i <= 2 ? 'SMALL' : i <= 4 ? 'MEDIUM' : 'LARGE',
          status: 'AVAILABLE',
          isLocked: true,
          isActive: true,
          lockerId: locker.id,
          openCount: 0
        }
      })
      cells.push(cell)
    }

    console.log(`✅ לוקר ${name} נוצר ב-Railway עם ${cellsCount} תאים`)

    return NextResponse.json({
      success: true,
      locker: {
        ...locker,
        cells,
        totalCells: cells.length,
        availableCells: cells.length,
        occupiedCells: 0
      }
    })
  } catch (error) {
    console.error('❌ שגיאה ביצירת לוקר ב-Railway:', error)
    
    // בדיקה אם זו שגיאת חיבור לDB
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { 
          error: 'שגיאה בחיבור לDB - DATABASE_URL לא מוגדר',
          details: 'נדרש להגדיר את משתנה הסביבה DATABASE_URL לPOST',
          errorType: 'DATABASE_CONNECTION'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'שגיאה ביצירת לוקר ב-Railway',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT - עדכון לוקר (רק ב-Railway DB)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, location, description, ip, port, deviceId, status, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'מזהה לוקר נדרש' },
        { status: 400 }
      )
    }

    console.log(`🔄 מעדכן לוקר ${id} ב-Railway`)

    const updatedLocker = await prisma.locker.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(description !== undefined && { description }),
        ...(ip !== undefined && { ip }),
        ...(port !== undefined && { port }),
        ...(deviceId !== undefined && { deviceId }),
        ...(status && { status }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        cells: {
          orderBy: { cellNumber: 'asc' }
        }
      }
    })

    console.log(`✅ לוקר ${id} עודכן ב-Railway`)

    return NextResponse.json({
      success: true,
      locker: {
        ...updatedLocker,
        totalCells: updatedLocker.cells.length,
        availableCells: updatedLocker.cells.filter(cell => cell.status === 'AVAILABLE').length,
        occupiedCells: updatedLocker.cells.filter(cell => cell.status === 'OCCUPIED').length,
      }
    })
  } catch (error) {
    console.error('❌ שגיאה בעדכון לוקר ב-Railway:', error)
    return NextResponse.json(
      { 
        error: 'שגיאה בעדכון לוקר ב-Railway',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - מחיקת לוקר (רק מ-Railway DB)
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'מזהה לוקר נדרש' },
        { status: 400 }
      )
    }

    console.log(`🗑️ מוחק לוקר ${id} מ-Railway`)

    // מחיקת כל התאים קודם
    await prisma.cell.deleteMany({
      where: { lockerId: parseInt(id) }
    })

    // מחיקת הלוקר
    await prisma.locker.delete({
      where: { id: parseInt(id) }
    })

    console.log(`✅ לוקר ${id} נמחק מ-Railway`)

    return NextResponse.json({
      success: true,
      message: 'לוקר נמחק בהצלחה מ-Railway'
    })
  } catch (error) {
    console.error('❌ שגיאה במחיקת לוקר מ-Railway:', error)
    return NextResponse.json(
      { 
        error: 'שגיאה במחיקת לוקר מ-Railway',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}