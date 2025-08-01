import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const lockerId = url.searchParams.get('lockerId')
    const cellNumberFromUrl = url.searchParams.get('cellNumber')

    if (!lockerId || !cellNumberFromUrl) {
      return NextResponse.json(
        { success: false, message: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    // כפיית המרה ל-string
    const cellNumberString: string = String(cellNumberFromUrl)

    // מציאת הלוקר והתא במסד הנתונים
    const locker = await prisma.locker.findUnique({
      where: { id: parseInt(lockerId) },
      include: {
        cells: {
          where: { cellNumber: parseInt(cellNumberString) }
        }
      }
    })

    if (!locker) {
      return NextResponse.json(
        { success: false, message: 'לוקר לא נמצא' },
        { status: 404 }
      )
    }

    const cell = locker.cells[0]
    if (!cell) {
      return NextResponse.json(
        { success: false, message: 'תא לא נמצא' },
        { status: 404 }
      )
    }

    // בדיקת סטטוס התא דרך ESP32
    const esp32Status = await checkCellStatusFromESP32(locker.ip, locker.port, cellNumberString)

    if (esp32Status.success) {
      // עדכון סטטוס התא במסד הנתונים לפי התגובה מה-ESP32
      let updatedCell = cell
      
      if (esp32Status.cellClosed && !cell.isLocked) {
        // התא נסגר - עדכון במסד הנתונים
        updatedCell = await prisma.cell.update({
          where: { id: cell.id },
          data: {
            isLocked: true,
            lastClosedAt: new Date()
          }
        })

        // יצירת לוג
        try {
          console.log('נוצר לוג: תא נסגר', { 
            action: 'CELL_CLOSED',
            entityType: 'CELL',
            entityId: cell.id.toString(),
              lockerId: parseInt(lockerId),
              cellNumber: parseInt(cellNumberString),
              esp32Data: esp32Status
          })
        } catch (logError) {
          console.error('שגיאה ביצירת לוג:', logError)
        }
      }

      return NextResponse.json({
        success: true,
        cellId: cell.id,
        cellNumber: cell.cellNumber,
        cellCode: cell.code,
        isLocked: updatedCell.isLocked,
        cellClosed: esp32Status.cellClosed,
        cellOpen: !esp32Status.cellClosed,
        lastOpenedAt: cell.lastOpenedAt,
        lastClosedAt: updatedCell.lastClosedAt,
        esp32Data: esp32Status
      })

    } else {
      // אם ESP32 לא זמין, החזר מידע מהמסד הנתונים
      return NextResponse.json({
        success: true,
        cellId: cell.id,
        cellNumber: cell.cellNumber,
        cellCode: cell.code,
        isLocked: cell.isLocked,
        cellClosed: cell.isLocked, // נניח שנעול = סגור
        cellOpen: !cell.isLocked,
        lastOpenedAt: cell.lastOpenedAt,
        lastClosedAt: cell.lastClosedAt,
        warning: 'לא ניתן להתחבר ל-ESP32, מחזיר נתונים ממסד הנתונים',
        esp32Error: esp32Status.message
      })
    }

  } catch (error) {
    console.error('שגיאה בבדיקת סטטוס תא:', error)
    return NextResponse.json(
      { success: false, message: 'שגיאה בשרת', details: error instanceof Error ? error.message : 'שגיאה לא ידועה' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// פונקציה לבדיקת סטטוס תא דרך ESP32
async function checkCellStatusFromESP32(ip: string | null, port: number | null, cellNumber: string) {
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
      body: JSON.stringify({
        action: 'checkCell',
        cellId: cellNumber
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success) {
      return {
        success: true,
        cellClosed: data.cellClosed,
        locked: data.locked,
        sensorState: data.sensorState || null,
        timestamp: data.timestamp || Date.now()
      }
    } else {
      return { success: false, message: data.message || 'תגובה לא תקינה מ-ESP32' }
    }

  } catch (error) {
    console.error('שגיאה בחיבור ל-ESP32:', error)
    return { 
      success: false, 
              message: `שגיאה בחיבור ל-ESP32: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}` 
    }
  }
} 