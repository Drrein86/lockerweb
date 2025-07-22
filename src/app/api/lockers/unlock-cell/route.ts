import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { lockerId, cellNumber, action } = await request.json()

    if (!lockerId || !cellNumber || !action) {
      return NextResponse.json(
        { success: false, message: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    // מציאת הלוקר במסד הנתונים
    const locker = await prisma.locker.findUnique({
      where: { id: lockerId },
      include: {
        cells: {
          where: { cellNumber: cellNumber }
        }
      }
    })

    if (!locker) {
      return NextResponse.json(
        { success: false, message: 'לוקר לא נמצא' },
        { status: 404 }
      )
    }

    if (locker.status !== 'ONLINE') {
      return NextResponse.json(
        { success: false, message: 'הלוקר אינו מחובר' },
        { status: 503 }
      )
    }

    const cell = locker.cells[0]
    if (!cell) {
      return NextResponse.json(
        { success: false, message: 'תא לא נמצא' },
        { status: 404 }
      )
    }

    if (cell.status === 'OCCUPIED') {
      return NextResponse.json(
        { success: false, message: 'התא כבר תפוס' },
        { status: 409 }
      )
    }

    // שליחת פקודה ל-ESP32
    const esp32Response = await sendCommandToESP32(locker.ip || '', locker.port, {
      action: action,
      cellId: cellNumber.toString(),
      packageId: `TEMP_${Date.now()}`
    })

    if (esp32Response.success) {
      // עדכון סטטוס התא במסד הנתונים
      await prisma.cell.update({
        where: { id: cell.id },
        data: {
          isLocked: false,
          lastOpenedAt: new Date()
        }
      })

      // יצירת לוג אודיט
      await (prisma as any).auditLog.create({
        data: {
          action: 'UNLOCK_CELL',
          entityType: 'CELL',
          entityId: cell.id.toString(),
          details: {
            lockerId: lockerId,
            cellNumber: cellNumber,
            esp32Response: esp32Response
          },
          success: true,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'התא נפתח בהצלחה',
        cellId: cell.id,
        lockerId: lockerId,
        esp32Response: esp32Response
      })
    } else {
      // לוג כישלון
      await (prisma as any).auditLog.create({
        data: {
          action: 'UNLOCK_CELL',
          entityType: 'CELL',
          entityId: cell.id.toString(),
          details: {
            lockerId: lockerId,
            cellNumber: cellNumber,
            error: esp32Response.message
          },
          success: false,
          errorMessage: esp32Response.message,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json(
        { success: false, message: esp32Response.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('שגיאה בפתיחת תא:', error)
    return NextResponse.json(
      { success: false, message: 'שגיאה בשרת', details: error instanceof Error ? error.message : 'שגיאה לא ידועה' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// פונקציה לשליחת פקודה ל-ESP32
async function sendCommandToESP32(ip: string, port: number | null, command: any) {
  try {
    if (!ip) {
      return { success: false, message: 'כתובת IP לא זמינה' }
    }

    const esp32Url = `http://${ip}${port ? `:${port}` : ''}/locker`
    
    const response = await fetch(esp32Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command),
      timeout: 10000 // 10 שניות timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error('שגיאה בחיבור ל-ESP32:', error)
    return { 
      success: false, 
      message: `שגיאה בחיבור ל-ESP32: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}` 
    }
  }
} 