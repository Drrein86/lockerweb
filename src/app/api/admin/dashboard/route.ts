import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getConnectedLockers } from '@/lib/websocket'

export async function GET() {
  try {
    // ספירת לוקרים
    const totalLockers = await prisma.locker.count()
    
    // ספירת תאים
    const totalCells = await prisma.cell.count()
    const occupiedCells = await prisma.cell.count({
      where: { isOccupied: true }
    })
    
    // ספירת חבילות
    const totalPackages = await prisma.package.count()
    const waitingPackages = await prisma.package.count({
      where: { status: 'WAITING' }
    })
    const collectedPackages = await prisma.package.count({
      where: { status: 'COLLECTED' }
    })
    
    // לוקרים מחוברים (מ-WebSocket)
    const connectedLockers = getConnectedLockers().length

    // סטטיסטיקות נוספות
    const recentPackages = await prisma.package.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        locker: { select: { location: true } },
        cell: { select: { code: true } }
      }
    })

    // חבילות שפגו תוקף (יותר מ-7 ימים)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const expiredPackages = await prisma.package.count({
      where: {
        status: 'WAITING',
        createdAt: { lt: sevenDaysAgo }
      }
    })

    // תפוסה לפי גודל תא
    const cellsBySize = await prisma.cell.groupBy({
      by: ['size'],
      _count: { _all: true }
    })
    
    // ספירת תאים תפוסים לפי גודל
    const cellsOccupiedBySize = await prisma.cell.groupBy({
      by: ['size'],
      where: { isOccupied: true },
      _count: { _all: true }
    })

    // סטטיסטיקות יומיות (היום)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayPackages = await prisma.package.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    const todayCollected = await prisma.package.count({
      where: {
        status: 'COLLECTED',
        updatedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalLockers,
        totalCells,
        occupiedCells,
        totalPackages,
        waitingPackages,
        collectedPackages,
        connectedLockers,
        expiredPackages,
        todayPackages,
        todayCollected,
        occupancyRate: totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0,
        collectionRate: totalPackages > 0 ? Math.round((collectedPackages / totalPackages) * 100) : 0
      },
      recentPackages: recentPackages.map(pkg => ({
        trackingCode: pkg.trackingCode,
        userName: pkg.userName,
        status: pkg.status === 'WAITING' ? 'ממתין' : 'נאסף',
        locker: pkg.locker.location,
        cell: pkg.cell.code,
        createdAt: pkg.createdAt
      })),
      cellsBySize: cellsBySize.map(item => {
        const occupiedCount = cellsOccupiedBySize.find(occ => occ.size === item.size)?._count._all || 0
        return {
          size: item.size === 'SMALL' ? 'קטן' : 
                item.size === 'MEDIUM' ? 'בינוני' :
                item.size === 'LARGE' ? 'גדול' : 'רחב',
          total: item._count._all,
          occupied: occupiedCount
        }
      })
    })

  } catch (error) {
    console.error('שגיאה בטעינת דשבורד:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 