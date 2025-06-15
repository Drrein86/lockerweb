import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/packages - Get all packages (filtered by role)
export async function GET() {
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

    let packages
    switch (user.role) {
      case 'ADMIN':
        // מנהל רואה את כל החבילות
        packages = await prisma.package.findMany({
          include: {
            recipient: {
              select: { id: true, name: true, email: true }
            },
            courier: {
              select: { id: true, name: true, email: true }
            }
          }
        })
        break
      
      case 'COURIER':
        // שליח רואה רק חבילות שהוקצו לו
        packages = await prisma.package.findMany({
          where: {
            OR: [
              { courierId: user.id },
              { status: 'PENDING' } // שליח יכול לראות גם חבילות שממתינות לשליח
            ]
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
        break
      
      case 'CUSTOMER':
        // לקוח רואה רק את החבילות שלו
        packages = await prisma.package.findMany({
          where: { recipientId: user.id },
          include: {
            recipient: {
              select: { id: true, name: true, email: true }
            },
            courier: {
              select: { id: true, name: true, email: true }
            }
          }
        })
        break
      
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    return NextResponse.json(packages)
  } catch (error) {
    console.error('Failed to fetch packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

// POST /api/packages - Create a new package
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // וידוא שיש נמען
    if (!data.recipientId) {
      return NextResponse.json({ error: 'Recipient is required' }, { status: 400 })
    }

    const package_ = await prisma.package.create({
      data: {
        ...data,
        status: 'PENDING'
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

    return NextResponse.json(package_)
  } catch (error) {
    console.error('Failed to create package:', error)
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
} 