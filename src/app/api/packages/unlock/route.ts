import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openLockerCell } from '@/lib/websocket'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { trackingCode } = body

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'קוד מעקב לא סופק' },
        { status: 400 }
      )
    }

    // חיפוש החבילה
    const packageData = await prisma.package.findUnique({
      where: {
        trackingCode: trackingCode.toUpperCase()
      },
      include: {
        locker: true,
        cell: true
      }
    })

    if (!packageData) {
      return NextResponse.json(
        { error: 'חבילה לא נמצאה' },
        { status: 404 }
      )
    }

    // בדיקה אם החבילה כבר נאספה
    if (packageData.status === 'COLLECTED') {
      return NextResponse.json(
        { error: 'החבילה כבר נאספה' },
        { status: 410 }
      )
    }

    // בדיקת תוקף החבילה (7 ימים)
    const createdDate = new Date(packageData.createdAt)
    const currentDate = new Date()
    const daysDiff = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 7) {
      return NextResponse.json(
        { error: 'החבילה פגת תוקף (יותר מ-7 ימים)' },
        { status: 410 }
      )
    }

    // פתיחת התא דרך WebSocket
    const unlockSuccess = await openLockerCell(packageData.lockerId, packageData.cell.code)
    
    if (!unlockSuccess) {
      return NextResponse.json(
        { error: 'הלוקר לא מחובר או שגיאה בפתיחה' },
        { status: 503 }
      )
    }

    // עדכון סטטוס החבילה לנאספה
    const updatedPackage = await prisma.package.update({
      where: { id: packageData.id },
      data: { 
        status: 'COLLECTED',
        updatedAt: new Date()
      }
    })

    // עדכון התא לפנוי
    await prisma.cell.update({
      where: { id: packageData.cellId },
      data: { isOccupied: false }
    })

    // רישום פעולת איסוף (לוג)
    console.log(`חבילה נאספה: ${trackingCode} מתא ${packageData.cell.code} בלוקר ${packageData.locker.location}`)

    return NextResponse.json({
      success: true,
      message: 'הלוקר נפתח בהצלחה',
      package: {
        trackingCode: updatedPackage.trackingCode,
        status: 'נאסף',
        collectedAt: updatedPackage.updatedAt,
        locker: packageData.locker.location,
        cell: packageData.cell.code
      }
    })

  } catch (error) {
    console.error('שגיאה בפתיחת לוקר:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 