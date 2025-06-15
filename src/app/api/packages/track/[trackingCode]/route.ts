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
        { error: 'מזהה חבילה לא סופק' },
        { status: 400 }
      )
    }

    // חיפוש החבילה לפי מזהה
    const packageData = await prisma.package.findUnique({
      where: {
        id: trackingCode
      },
      include: {
        locker: true,
        cell: true,
        recipient: true
      }
    })

    if (!packageData) {
      return NextResponse.json(
        { error: 'חבילה לא נמצאה' },
        { status: 404 }
      )
    }

    if (!packageData.locker || !packageData.cell || !packageData.recipient) {
      return NextResponse.json(
        { error: 'נתוני החבילה חסרים' },
        { status: 500 }
      )
    }

    // בדיקה אם החבילה כבר נאספה
    if (packageData.status === 'DELIVERED') {
      return NextResponse.json(
        { 
          error: 'החבילה כבר נאספה',
          package: {
            id: packageData.id,
            status: packageData.status,
            deliveredAt: packageData.updatedAt
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
            id: packageData.id,
            status: 'EXPIRED',
            createdAt: packageData.createdAt
          }
        },
        { status: 410 } // Gone
      )
    }

    const statusMap: { [key: string]: string } = {
      'PENDING': 'ממתין לשליח',
      'IN_TRANSIT': 'בדרך',
      'IN_LOCKER': 'ממתין לאיסוף',
      'DELIVERED': 'נאסף'
    }

    return NextResponse.json({
      success: true,
      package: {
        id: packageData.id,
        description: packageData.description,
        recipientName: packageData.recipient.name,
        recipientEmail: packageData.recipient.email,
        status: statusMap[packageData.status] || packageData.status,
        locker: {
          id: packageData.locker.id,
          location: packageData.locker.location,
          name: packageData.locker.name
        },
        cell: {
          id: packageData.cell.id,
          number: packageData.cell.number
        },
        createdAt: packageData.createdAt,
        daysLeft: Math.max(0, 7 - daysDiff),
        canCollect: daysDiff <= 7 && packageData.status === 'IN_LOCKER'
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