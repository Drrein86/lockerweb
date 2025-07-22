import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// מאלץ את הנתיב להיות דינמי
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cellCode, deviceId, lockerId } = body

    console.log(`🔌 ניסיון הפעלת תא: ${cellCode} מהתקן: ${deviceId}`)

    if (!cellCode) {
      return NextResponse.json({
        success: false,
        error: 'חסר קוד תא'
      }, { status: 400 })
    }

    // חיפוש התא במסד הנתונים
    const cell = await prisma.cell.findFirst({
      where: {
        code: cellCode,
        // אם יש lockerId, וודא שהתא שייך ללוקר הנכון
        ...(lockerId && { lockerId: parseInt(lockerId) })
      },
      include: {
        locker: true
      }
    })

    if (!cell) {
      console.log(`❌ תא לא נמצא: ${cellCode}`)
      return NextResponse.json({
        success: false,
        error: 'תא לא נמצא במערכת'
      }, { status: 404 })
    }

    // אם התא כבר פעיל, פשוט נעדכן את זמן החיבור האחרון
    if (cell.isActive) {
      console.log(`✅ תא כבר פעיל: ${cellCode}, מעדכן זמן חיבור`)
      
      // עדכון זמן חיבור אחרון ללוקר
      if (cell.locker) {
        await prisma.locker.update({
          where: { id: cell.lockerId },
          data: { 
            lastSeen: new Date(),
            status: 'ONLINE'
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'תא כבר פעיל',
        cell: {
          id: cell.id,
          code: cell.code,
          isActive: true,
          wasAlreadyActive: true
        }
      })
    }

    // הפעלת התא לראשונה!
    console.log(`🎉 מפעיל תא לראשונה: ${cellCode}`)

    const updatedCell = await prisma.cell.update({
      where: { id: cell.id },
      data: {
        isActive: true,
        // עדכון זמנים
        updatedAt: new Date()
      }
    })

    // עדכון סטטוס הלוקר גם כן
    if (cell.locker) {
      await prisma.locker.update({
        where: { id: cell.lockerId },
        data: { 
          lastSeen: new Date(),
          status: 'ONLINE'
        }
      })
      console.log(`🔌 עדכון לוקר ${cell.locker.name} לסטטוס ONLINE`)
    }

    console.log(`✅ תא הופעל בהצלחה: ${cellCode}`)

    return NextResponse.json({
      success: true,
      message: 'תא הופעל בהצלחה',
      cell: {
        id: updatedCell.id,
        code: updatedCell.code,
        cellNumber: updatedCell.cellNumber,
        size: updatedCell.size,
        isActive: true,
        lockerId: updatedCell.lockerId,
        wasAlreadyActive: false,
        activatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('❌ שגיאה בהפעלת תא:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בשרת',
      details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// GET - בדיקת סטטוס תא
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const cellCode = url.searchParams.get('cellCode')

    if (!cellCode) {
      return NextResponse.json({
        success: false,
        error: 'חסר קוד תא'
      }, { status: 400 })
    }

    const cell = await prisma.cell.findFirst({
      where: { code: cellCode },
      include: {
        locker: {
          select: {
            id: true,
            name: true,
            location: true,
            status: true
          }
        }
      }
    })

    if (!cell) {
      return NextResponse.json({
        success: false,
        error: 'תא לא נמצא'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      cell: {
        id: cell.id,
        code: cell.code,
        cellNumber: cell.cellNumber,
        size: cell.size,
        isActive: cell.isActive,
        status: cell.status,
        lockerId: cell.lockerId,
        locker: cell.locker
      }
    })

  } catch (error) {
    console.error('שגיאה בבדיקת סטטוס תא:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בשרת'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 