import { NextResponse } from 'next/server'

// נתוני Mock ללוקרים
const mockLockers = [
  {
    id: 1,
    location: 'בניין A - קומה ראשונה',
    status: 'ONLINE',
    ip: '192.168.0.104',
    port: 80,
    lastSeen: new Date(),
    cells: {
      'A1': { locked: true, opened: false, hasPackage: true, packageId: 'PKG001' },
      'A2': { locked: false, opened: true, hasPackage: false },
      'A3': { locked: true, opened: false, hasPackage: false },
      'B1': { locked: false, opened: false, hasPackage: false },
      'B2': { locked: true, opened: false, hasPackage: true, packageId: 'PKG002' },
      'B3': { locked: false, opened: false, hasPackage: false }
    }
  },
  {
    id: 2,
    location: 'בניין B - כניסה ראשית',
    status: 'ONLINE',
    ip: '192.168.0.105',
    port: 80,
    lastSeen: new Date(Date.now() - 300000), // 5 דקות אחורה
    cells: {
      'C1': { locked: false, opened: false, hasPackage: false },
      'C2': { locked: true, opened: false, hasPackage: true, packageId: 'PKG003' },
      'C3': { locked: false, opened: false, hasPackage: false },
      'D1': { locked: false, opened: false, hasPackage: false },
      'D2': { locked: false, opened: false, hasPackage: false },
      'D3': { locked: false, opened: false, hasPackage: false }
    }
  }
];

export async function GET() {
  try {
    console.log('🏢 טוען רשימת לוקרים - מצב Mock');
    
    return NextResponse.json({
      success: true,
      lockers: mockLockers
    })

  } catch (error) {
    console.error('שגיאה בטעינת לוקרים:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 