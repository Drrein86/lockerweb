import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { packageId, status } = await request.json()

    if (!packageId || !status) {
      return NextResponse.json(
        { error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    // עדכון סטטוס החבילה
    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: { status },
      include: {
        cell: true
      }
    })

    // עדכון סטטוס התא
    if (status === 'COLLECTED') {
      // אם החבילה נאספה, התא נהיה זמין
      await prisma.cell.update({
        where: { id: updatedPackage.cellId },
        data: { isOccupied: false }
      })
    } else if (status === 'WAITING') {
      // אם החבילה חזרה למתין, התא תפוס
      await prisma.cell.update({
        where: { id: updatedPackage.cellId },
        data: { isOccupied: true }
      })
    }

    return NextResponse.json({
      success: true,
      package: updatedPackage
    })

  } catch (error) {
    console.error('שגיאה בעדכון חבילה:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 