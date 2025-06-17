import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { trackingCode: string } }
) {
  try {
    const { trackingCode } = params

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'קוד מעקב לא סופק' },
        { status: 400 }
      )
    }

    // חיפוש החבילה לפי קוד מעקב
    const packageData = await prisma.package.findUnique({
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
        { 
          error: 'החבילה כבר נאספה',
          package: {
            packageId: packageData.trackingCode,
            status: packageData.status,
            collectedAt: packageData.collectedAt
          }
        },
        { status: 410 } // Gone
      )
    }

    // בדיקת תוקף החבילה (7 ימים)
    const createdDate = new Date(packageData.createdAt)
    const currentDate = new Date()
    const daysDiff = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 7) {
      return NextResponse.json(
        { 
          error: 'החבילה פגת תוקף (יותר מ-7 ימים)',
          package: {
            packageId: packageData.trackingCode,
            status: 'EXPIRED',
            createdAt: packageData.createdAt
          }
        },
        { status: 410 } // Gone
      )
    }

    const statusMap: { [key: string]: string } = {
      'WAITING': 'ממתין לאיסוף',
      'DELIVERED': 'נמסר',
      'COLLECTED': 'נאסף'
    }

    return NextResponse.json({
      success: true,
      package: {
        id: packageData.id,
        packageId: packageData.trackingCode,
        status: statusMap[packageData.status] || packageData.status,
        lockerId: packageData.lockerId,
        cellId: packageData.cellId,
        customerId: packageData.customerId,
        createdAt: packageData.createdAt,
        deliveredAt: packageData.deliveredAt,
        collectedAt: packageData.collectedAt,
        daysLeft: Math.max(0, 7 - daysDiff),
        canCollect: daysDiff <= 7
      }
    })

  } catch (error) {
    console.error('שגיאה במעקב חבילה:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 