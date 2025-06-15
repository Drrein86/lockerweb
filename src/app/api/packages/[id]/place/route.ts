import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH /api/packages/[id]/place
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

    const { lockerId, cellId } = await request.json()

    // בדיקה שהחבילה קיימת
    const package_ = await prisma.package.findUnique({
      where: { id: params.id }
    })

    if (!package_) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // בדיקת הרשאות
    if (
      user.role !== 'ADMIN' && // מנהל יכול תמיד
      (user.role !== 'COURIER' || package_.courierId !== user.id) // שליח יכול רק לחבילות שלו
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // בדיקה שהחבילה בסטטוס מתאים
    if (package_.status !== 'IN_TRANSIT') {
      return NextResponse.json({ error: 'Package must be in transit' }, { status: 400 })
    }

    // יצירת קוד אקראי לפתיחת התא
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    // עדכון החבילה
    const updatedPackage = await prisma.package.update({
      where: { id: params.id },
      data: {
        lockerId,
        cellId,
        code,
        status: 'IN_LOCKER'
      },
      include: {
        recipient: {
          select: { id: true, name: true, email: true }
        },
        courier: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // TODO: שליחת הקוד ללקוח במייל/SMS

    return NextResponse.json(updatedPackage)
  } catch (error) {
    console.error('Failed to place package in locker:', error)
    return NextResponse.json({ error: 'Failed to place package in locker' }, { status: 500 })
  }
} 