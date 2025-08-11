import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - קבלת כל המשתמשים (רק לאדמין)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        permissions: true,
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('שגיאה בטעינת משתמשים:', error)
    return NextResponse.json({ error: 'שגיאה בטעינת משתמשים' }, { status: 500 })
  }
}

// PUT - עדכון משתמש (רק לאדמין)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
    }

    const { userId, role, status, isApproved } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 })
    }

    const updateData: any = {}
    
    if (role !== undefined) {
      updateData.role = role
    }
    
    if (status !== undefined) {
      updateData.status = status
    }
    
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved
      if (isApproved) {
        updateData.approvedBy = session.user.id
        updateData.approvedAt = new Date()
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        permissions: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('שגיאה בעדכון משתמש:', error)
    return NextResponse.json({ error: 'שגיאה בעדכון משתמש' }, { status: 500 })
  }
}
