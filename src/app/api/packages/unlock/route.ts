import { NextResponse } from 'next/server'

// נתוני Mock לחבילות
const mockPackages = [
  {
    id: 1,
    trackingCode: 'PKG001',
    customerName: 'אחמד עלי',
    status: 'DELIVERED',
    lockerId: 1,
    cellId: 'A1',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    trackingCode: 'PKG002',
    customerName: 'פטימה אחמד',
    status: 'PENDING',
    lockerId: 2,
    cellId: 'B3',
    createdAt: '2024-01-16T09:15:00Z'
  },
  {
    id: 3,
    trackingCode: 'PKG003',
    customerName: 'מוחמד חסן',
    status: 'COLLECTED',
    lockerId: 1,
    cellId: 'C2',
    createdAt: '2024-01-17T11:20:00Z'
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { trackingCode } = body

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'קוד מעקב לא סופק' },
        { status: 400 }
      )
    }

    // חיפוש החבילה במערכת Mock
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
        { error: 'החבילה כבר נאספה' },
        { status: 410 }
      )
    }

    // בדיקת תוקף החבילה (7 ימים)
    const createdDate = new Date(packageData.createdAt)
    const currentDate = new Date()
    const daysDiff = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 7) {
      return NextResponse.json(
        { error: 'החבילה פגת תוקף (יותר מ-7 ימים)' },
        { status: 410 }
      )
    }

    // עדכון סטטוס החבילה לנאספה במערכת Mock
    const packageIndex = mockPackages.findIndex(pkg => pkg.id === packageData.id)
    if (packageIndex !== -1) {
      mockPackages[packageIndex].status = 'COLLECTED'
    }
    const updatedPackage = mockPackages[packageIndex]

    // רישום פעולת איסוף (לוג)
    console.log(`חבילה נאספה: ${trackingCode} מתא ${packageData.cellId} בלוקר ${packageData.lockerId}`)

    return NextResponse.json({
      success: true,
      message: 'החבילה סומנה כנאספה',
      package: {
        packageId: updatedPackage.trackingCode,
        status: 'נאסף',
        lockerId: packageData.lockerId,
        cellId: packageData.cellId
      }
    })

  } catch (error) {
    console.error('שגיאה בעדכון חבילה:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 