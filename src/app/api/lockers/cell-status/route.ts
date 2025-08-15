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

    // בדיקת סטטוס התא דרך Railway Server
    console.log(`🔍 בודק סטטוס תא ${cellNumberString} בלוקר ${lockerId}`)
    
    const railwayStatus = await checkCellStatusViaRailway(locker.deviceId, cellNumberString)

    // תמיד נחזיר תגובה מוצלחת, גם אם Railway לא זמין
    let cellClosed = false
    let dataSource = 'database'
    
    if (railwayStatus.success) {
      cellClosed = railwayStatus.cellClosed || false
      dataSource = 'railway'
      console.log(`✅ נתונים מ-Railway: תא ${cellClosed ? 'סגור' : 'פתוח'}`)
    } else {
      // אם Railway לא זמין, נשתמש בנתונים מהמסד הנתונים
      cellClosed = cell.isLocked
      console.log(`⚠️ Railway לא זמין, משתמש בנתוני DB: תא ${cellClosed ? 'סגור' : 'פתוח'}`)
    }

    // עדכון במסד הנתונים אם התא נסגר
    let updatedCell = cell
    if (cellClosed && !cell.isLocked) {
      console.log(`🔒 מעדכן במסד נתונים: תא ${cellNumberString} נסגר`)
      updatedCell = await prisma.cell.update({
        where: { id: cell.id },
        data: {
          isLocked: true,
          lastClosedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      cellId: cell.id,
      cellNumber: cell.cellNumber,
      cellCode: cell.code,
      isLocked: updatedCell.isLocked,
      cellClosed: cellClosed,
      cellOpen: !cellClosed,
      lastOpenedAt: cell.lastOpenedAt,
      lastClosedAt: updatedCell.lastClosedAt,
      dataSource: dataSource,
      railwayAvailable: railwayStatus.success,
      timestamp: new Date().toISOString()
    })

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

// פונקציה לבדיקת סטטוס תא דרך Railway Server
async function checkCellStatusViaRailway(deviceId: string | null, cellNumber: string) {
  try {
    if (!deviceId) {
      console.log('⚠️ לא נמצא deviceId עבור הלוקר')
      return { success: false, message: 'deviceId חסר' }
    }

    const railwayUrl = 'https://lockerweb-production.up.railway.app'
    console.log(`📡 בודק סטטוס תא דרך Railway: ${railwayUrl}`)
    
    // יצירת timeout של 5 שניות
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${railwayUrl}/api/cell-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'checkCellStatus',
        id: deviceId,
        cellId: cellNumber
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log(`❌ Railway Server החזיר שגיאה: ${response.status}`)
      return { success: false, message: `HTTP ${response.status}` }
    }

    const data = await response.json()
    console.log('📥 תגובה מ-Railway:', data)
    
    if (data.success) {
      return {
        success: true,
        cellClosed: data.cellClosed || false,
        sensorState: data.sensorState || null,
        timestamp: data.timestamp || Date.now()
      }
    } else {
      return { success: false, message: data.message || 'תגובה לא תקינה מ-Railway' }
    }

  } catch (error) {
    console.error('❌ שגיאה בחיבור ל-Railway:', error)
    
    // Fallback graceful - לא נחזיר שגיאה אלא נודיע שהשירות לא זמין
    return { 
      success: false, 
      message: `Railway לא זמין: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}` 
    }
  }
} 