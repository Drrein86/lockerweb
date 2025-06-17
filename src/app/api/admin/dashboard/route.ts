import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // ספירת לוקרים
    const totalLockers = await prisma.locker.count()
    
    // ספירת חבילות
    const totalPackages = await prisma.package.count()
    const pendingPackages = await prisma.package.count({
      where: { status: 'WAITING' }
    })
    const deliveredPackages = await prisma.package.count({
      where: { status: 'DELIVERED' }
    })
    const collectedPackages = await prisma.package.count({
      where: { status: 'COLLECTED' }
    })
    
    // לוקרים מחוברים
    const onlineLockers = await prisma.locker.count({
      where: { status: 'ONLINE' }
    })

    // חבילות אחרונות
    const recentPackages = await prisma.package.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
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
        onlineLockers,
        totalPackages,
        pendingPackages,
        deliveredPackages,
        collectedPackages,
        expiredPackages,
        todayPackages,
        todayCollected,
        deliveryRate: totalPackages > 0 ? Math.round((deliveredPackages / totalPackages) * 100) : 0,
        collectionRate: totalPackages > 0 ? Math.round((collectedPackages / totalPackages) * 100) : 0
      },
      recentPackages: recentPackages.map(pkg => ({
        trackingCode: pkg.trackingCode,
        status: pkg.status === 'WAITING' ? 'ממתין' : 
                pkg.status === 'DELIVERED' ? 'נמסר' : 'נאסף',
        lockerId: pkg.lockerId,
        cellId: pkg.cellId,
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