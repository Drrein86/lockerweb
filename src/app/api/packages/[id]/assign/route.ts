import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH /api/packages/[id]/assign
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

    // רק מנהל יכול להקצות שליח
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can assign couriers' }, { status: 403 })
    }

    const { courierId } = await request.json()

    // בדיקה שהשליח קיים והוא אכן שליח
    const courier = await prisma.user.findUnique({
      where: { id: courierId }
    })

    if (!courier || courier.role !== 'COURIER') {
      return NextResponse.json({ error: 'Invalid courier' }, { status: 400 })
    }

    // בדיקה שהחבילה קיימת ובסטטוס מתאים
    const package_ = await prisma.package.findUnique({
      where: { id: params.id }
    })

    if (!package_) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    if (package_.status !== 'PENDING') {
      return NextResponse.json({ error: 'Package is not pending' }, { status: 400 })
    }

    // הקצאת השליח ועדכון הסטטוס
    const updatedPackage = await prisma.package.update({
      where: { id: params.id },
      data: {
        courierId,
        status: 'IN_TRANSIT'
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

    return NextResponse.json(updatedPackage)
  } catch (error) {
    console.error('Failed to assign courier:', error)
    return NextResponse.json({ error: 'Failed to assign courier' }, { status: 500 })
  }
} 