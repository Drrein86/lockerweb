import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      include: {
        locker: {
          select: {
            location: true
          }
        },
        cell: {
          select: {
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      packages
    })

  } catch (error) {
    console.error('שגיאה בטעינת חבילות:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 