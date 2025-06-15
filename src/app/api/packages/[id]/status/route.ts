import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH /api/packages/[id]/status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { status } = await request.json()

    // בדיקת הרשאות לפי סוג המשתמש והסטטוס המבוקש
    const package_ = await prisma.package.findUnique({
      where: { id: params.id },
      include: { courier: true }
    })

    if (!package_) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // בדיקות הרשאה לפי תפקיד
    switch (user.role) {
      case 'ADMIN':
        // מנהל יכול לשנות לכל סטטוס
        break
      
      case 'COURIER':
        // שליח יכול לשנות רק לסטטוסים מסוימים
        if (
          package_.courierId !== user.id || // חייב להיות השליח של החבילה
          !['IN_TRANSIT', 'IN_LOCKER'].includes(status) // יכול לשנות רק לסטטוסים אלו
        ) {
          return NextResponse.json({ error: 'Unauthorized status change' }, { status: 403 })
        }
        break
      
      case 'CUSTOMER':
        // לקוח יכול רק לאשר קבלה
        if (
          package_.recipientId !== user.id || // חייב להיות הנמען
          status !== 'DELIVERED' || // יכול רק לאשר קבלה
          package_.status !== 'IN_LOCKER' // החבילה חייבת להיות בלוקר
        ) {
          return NextResponse.json({ error: 'Unauthorized status change' }, { status: 403 })
        }
        break
      
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // עדכון הסטטוס
    const updatedPackage = await prisma.package.update({
      where: { id: params.id },
      data: { status },
      include: {
        recipient: {
          select: { id: true, name: true, email: true }
        },
        courier: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(updatedPackage)
  } catch (error) {
    console.error('Failed to update package status:', error)
    return NextResponse.json({ error: 'Failed to update package status' }, { status: 500 })
  }
} 