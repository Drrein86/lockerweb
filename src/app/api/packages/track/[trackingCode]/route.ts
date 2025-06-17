import { NextResponse } from 'next/server'

// נתוני Mock לחבילות
const mockPackages = [
  {
    id: 1,
    trackingCode: 'PKG001',
    customerName: 'אחמד עלי',
    userName: 'אחמד עלי',
    userEmail: 'ahmad@example.com',
    userPhone: '050-1234567',
    size: 'MEDIUM',
    status: 'DELIVERED',
    lockerId: 1,
    cellId: 'A1',
    locker: { location: 'בניין A - קומה ראשונה' },
    cell: { code: 'A1' },
    createdAt: '2024-01-15T10:00:00Z',
    deliveredAt: '2024-01-15T14:30:00Z'
  },
  {
    id: 2,
    trackingCode: 'PKG002',
    customerName: 'פטימה אחמד',
    userName: 'פטימה אחמד',
    userEmail: 'fatima@example.com',
    userPhone: '052-9876543',
    size: 'LARGE',
    status: 'PENDING',
    lockerId: 2,
    cellId: 'B3',
    locker: { location: 'בניין B - כניסה ראשית' },
    cell: { code: 'B3' },
    createdAt: '2024-01-16T09:15:00Z',
    deliveredAt: null
  },
  {
    id: 3,
    trackingCode: 'PKG003',
    customerName: 'מוחמד חסן',
    userName: 'מוחמד חסן',
    userEmail: 'mohammad@example.com',
    userPhone: '053-5555555',
    size: 'SMALL',
    status: 'COLLECTED',
    lockerId: 1,
    cellId: 'C2',
    locker: { location: 'בניין A - קומה ראשונה' },
    cell: { code: 'C2' },
    createdAt: '2024-01-17T11:20:00Z',
    deliveredAt: '2024-01-17T16:45:00Z'
  }
];

export async function GET(
  request: Request,
  { params }: { params: { trackingCode: string } }
) {
  try {
    const { trackingCode } = params

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'קוד מעקב לא סופק' },
        { status: 400 }
      )
    }

    // חיפוש החבילה לפי קוד מעקב במערכת Mock
    const packageData = mockPackages.find(pkg => 
      pkg.trackingCode.toUpperCase() === trackingCode.toUpperCase()
    )

    if (!packageData) {
      return NextResponse.json(
        { error: 'חבילה לא נמצאה' },
        { status: 404 }
      )
    }

    // בדיקה אם החבילה כבר נאספה
    if (packageData.status === 'COLLECTED') {
      return NextResponse.json(
        { 
          error: 'החבילה כבר נאספה',
          package: {
            packageId: packageData.trackingCode,
            status: packageData.status
          }
        },
        { status: 410 } // Gone
      )
    }

    // בדיקת תוקף החבילה (7 ימים)
    const createdDate = new Date(packageData.createdAt)
    const currentDate = new Date()
    const daysDiff = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 7) {
      return NextResponse.json(
        { 
          error: 'החבילה פגת תוקף (יותר מ-7 ימים)',
          package: {
            packageId: packageData.trackingCode,
            status: 'EXPIRED',
            createdAt: packageData.createdAt
          }
        },
        { status: 410 } // Gone
      )
    }

    const statusMap: { [key: string]: string } = {
      'WAITING': 'ממתין לאיסוף',
      'DELIVERED': 'נמסר',
      'COLLECTED': 'נאסף'
    }

    return NextResponse.json({
      success: true,
      package: {
        id: packageData.id,
        packageId: packageData.trackingCode,
        trackingCode: packageData.trackingCode,
        userName: packageData.userName,
        userEmail: packageData.userEmail,
        userPhone: packageData.userPhone,
        size: packageData.size,
        status: statusMap[packageData.status] || packageData.status,
        lockerId: packageData.lockerId,
        cellId: packageData.cellId,
        locker: packageData.locker,
        cell: packageData.cell,
        createdAt: packageData.createdAt,
        daysLeft: Math.max(0, 7 - daysDiff),
        canCollect: daysDiff <= 7
      }
    })

  } catch (error) {
    console.error('שגיאה במעקב חבילה:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 