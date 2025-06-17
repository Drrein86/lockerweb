import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { packageId, status } = await request.json()
    
    console.log(`📦 עדכון חבילה ${packageId} לסטטוס ${status} - מצב Mock`);
    
    // בדיקה בסיסית
    if (!packageId || !status) {
      return NextResponse.json(
        { error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    // סימולציה של עדכון חבילה
    const mockUpdatedPackage = {
      id: packageId,
      status: status,
      updatedAt: new Date().toISOString(),
      message: `סטטוס החבילה עודכן ל-${status}`
    };

    return NextResponse.json({
      success: true,
      package: mockUpdatedPackage,
      message: `חבילה ${packageId} עודכנה בהצלחה`
    })

  } catch (error) {
    console.error('שגיאה בעדכון חבילה:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 