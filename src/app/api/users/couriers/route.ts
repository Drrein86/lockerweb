import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/users/couriers - Get all couriers
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const couriers = await prisma.user.findMany({
      where: { role: 'COURIER' },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return NextResponse.json(couriers)
  } catch (error) {
    console.error('Failed to fetch couriers:', error)
    return NextResponse.json({ error: 'Failed to fetch couriers' }, { status: 500 })
  }
} 