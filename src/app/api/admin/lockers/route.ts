import { NextResponse } from 'next/server'

// API זה מחזיר רק לוקרים אמיתיים מחוברים לשרת החומרה
// אין כאן נתונים מדומים - רק לוקרים חיים בזמן אמת

export async function GET() {
  try {
    console.log('🏢 מחפש לוקרים אמיתיים מחוברים לשרת החומרה...');
    
    // החזרת רשימה ריקה - רק לוקרים חיים יוצגו דרך WebSocket
    return NextResponse.json({
      success: true,
      lockers: [],
      message: 'רק לוקרים חיים מחוברים לשרת החומרה יוצגו'
    })

  } catch (error) {
    console.error('שגיאה בטעינת לוקרים:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 