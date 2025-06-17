import { NextResponse } from 'next/server'
import { prismaMock } from '@/lib/prisma'

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

    // חיפוש החבילה במערכת Mock
    const packageData = await prismaMock.package.findUnique({
      where: {
        trackingCode: trackingCode.toUpperCase()
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

    // עדכון סטטוס החבילה לנאספה במערכת Mock
    const updatedPackage = await prismaMock.package.update({
      where: { id: packageData.id },
      data: { 
        status: 'COLLECTED'
      }
    })

    // רישום פעולת איסוף (לוג)
    console.log(`חבילה נאספה: ${trackingCode} מתא ${packageData.cellId} בלוקר ${packageData.lockerId}`)

    return NextResponse.json({
      success: true,
      message: 'החבילה סומנה כנאספה',
      package: {
        packageId: updatedPackage.trackingCode,
        status: 'נאסף',
        lockerId: packageData.lockerId,
        cellId: packageData.cellId
      }
    })

  } catch (error) {
    console.error('שגיאה בעדכון חבילה:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 