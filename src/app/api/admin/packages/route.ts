import { NextResponse } from 'next/server'

// נתוני Mock לחבילות
const mockPackages = [
  {
    id: 1,
    trackingCode: 'PKG001',
    customerName: 'אחמד עלי',
    customerPhone: '050-1234567',
    courierName: 'יוסף כהן',
    status: 'DELIVERED',
    lockerId: 1,
    cellId: 'A1',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    deliveredAt: new Date('2024-01-15T14:30:00Z')
  },
  {
    id: 2,
    trackingCode: 'PKG002',
    customerName: 'פטימה אחמד',
    customerPhone: '052-9876543',
    courierName: 'דוד לוי',
    status: 'PENDING',
    lockerId: 2,
    cellId: 'B3',
    createdAt: new Date('2024-01-16T09:15:00Z'),
    deliveredAt: null
  },
  {
    id: 3,
    trackingCode: 'PKG003',
    customerName: 'מוחמד חסן',
    customerPhone: '053-5555555',
    courierName: 'רחל אברהם',
    status: 'COLLECTED',
    lockerId: 1,
    cellId: 'C2',
    createdAt: new Date('2024-01-17T11:20:00Z'),
    deliveredAt: new Date('2024-01-17T16:45:00Z')
  }
];

export async function GET() {
  try {
    console.log('📦 טוען רשימת חבילות - מצב Mock');
    
    return NextResponse.json({
      success: true,
      packages: mockPackages
    })

  } catch (error) {
    console.error('שגיאה בטעינת חבילות:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 