import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const lockers = await prisma.locker.findMany({
      include: {
        cells: {
          orderBy: {
            code: 'asc'
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      lockers
    })

  } catch (error) {
    console.error('שגיאה בטעינת לוקרים:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 