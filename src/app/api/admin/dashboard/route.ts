import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { useWebSocketStore } from '@/lib/services/websocket.service'

export async function GET() {
  try {
    // ספירת לוקרים
    const totalLockers = await prisma.locker.count()
    
    // ספירת תאים
    const totalCells = await prisma.cell.count()
    const occupiedCells = await prisma.cell.count({
      where: { 
        packages: { some: { status: 'IN_LOCKER' } }
      }
    })
    
    // ספירת חבילות
    const totalPackages = await prisma.package.count()
    const pendingPackages = await prisma.package.count({
      where: { status: 'PENDING' }
    })
    const deliveredPackages = await prisma.package.count({
      where: { status: 'DELIVERED' }
    })
    
    // לוקרים מחוברים
    const connectedLockers = await prisma.locker.count({
      where: { isOnline: true }
    })

    // חבילות אחרונות
    const recentPackages = await prisma.package.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        recipient: { select: { name: true } },
        locker: { select: { location: true } },
        cell: { select: { number: true } }
      }
    })

    // חבילות שפגו תוקף (יותר מ-7 ימים)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const expiredPackages = await prisma.package.count({
      where: {
        status: 'IN_LOCKER',
        createdAt: { lt: sevenDaysAgo }
      }
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

    const todayDelivered = await prisma.package.count({
      where: {
        status: 'DELIVERED',
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
        pendingPackages,
        deliveredPackages,
        connectedLockers,
        expiredPackages,
        todayPackages,
        todayDelivered,
        occupancyRate: totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0,
        deliveryRate: totalPackages > 0 ? Math.round((deliveredPackages / totalPackages) * 100) : 0
      },
      recentPackages: recentPackages.map(pkg => ({
        id: pkg.id,
        description: pkg.description,
        status: pkg.status,
        recipientName: pkg.recipient.name,
        location: pkg.locker?.location || 'לא במיקום',
        cellNumber: pkg.cell?.number || '-',
        createdAt: pkg.createdAt
      }))
    })

  } catch (error) {
    console.error('שגיאה בטעינת דשבורד:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 