import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('📊 טוען נתוני דשבורד - מצב Mock');
    
    // נתוני Mock עבור הדשבורד
    const mockDashboardData = {
      totalLockers: 2,
      onlineLockers: 2,
      offlineLockers: 0,
      totalPackages: 15,
      pendingPackages: 5,
      deliveredPackages: 7,
      collectedPackages: 3,
      expiredPackages: 0,
      todayPackages: 3,
      todayCollected: 1,
      recentPackages: [
        {
          id: 1,
          trackingCode: 'PKG001',
          customerName: 'אחמד עלי',
          status: 'DELIVERED',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          trackingCode: 'PKG002',
          customerName: 'פטימה אחמד',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          trackingCode: 'PKG003',
          customerName: 'מוחמד חסן',
          status: 'COLLECTED',
          createdAt: new Date().toISOString()
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockDashboardData
    })

  } catch (error) {
    console.error('שגיאה בטעינת נתוני דשבורד:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 