import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { useWebSocketStore } from '@/lib/services/websocket.service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'מזהה חבילה לא סופק' },
        { status: 400 }
      )
    }

    // חיפוש החבילה
    const packageData = await prisma.package.findUnique({
      where: {
        id: packageId
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

    if (!packageData.locker || !packageData.cell || !packageData.cellId) {
      return NextResponse.json(
        { error: 'נתוני החבילה חסרים' },
        { status: 500 }
      )
    }

    // בדיקה אם החבילה כבר נאספה
    if (packageData.status === 'DELIVERED') {
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
    try {
      const { unlockCell } = useWebSocketStore.getState()
      await unlockCell(packageData.locker.id, packageData.cell.id)
    } catch (error) {
      return NextResponse.json(
        { error: 'הלוקר לא מחובר או שגיאה בפתיחה' },
        { status: 503 }
      )
    }

    // עדכון סטטוס החבילה לנאספה
    const updatedPackage = await prisma.package.update({
      where: { id: packageData.id },
      data: { 
        status: 'DELIVERED',
        updatedAt: new Date()
      }
    })

    // עדכון התא לפתוח
    await prisma.cell.update({
      where: { id: packageData.cellId },
      data: { 
        isLocked: false,
        isOpen: true
      }
    })

    // רישום פעולת איסוף (לוג)
    console.log(`חבילה נאספה: ${packageId} מתא ${packageData.cell.number} בלוקר ${packageData.locker.location}`)

    return NextResponse.json({
      success: true,
      message: 'הלוקר נפתח בהצלחה',
      package: {
        id: updatedPackage.id,
        status: 'נאסף',
        deliveredAt: updatedPackage.updatedAt,
        locker: packageData.locker.location,
        cell: packageData.cell.number
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