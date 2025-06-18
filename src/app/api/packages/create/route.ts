import { NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      userName, 
      email, 
      phone, 
      tracking_code, 
      size, 
      lockerId, 
      cellId
    } = body
    
    // תמיכה בשני פורמטים - name או userName
    const customerName = userName || name

    // בדיקת שדות חובה
    if (!customerName || !email || !phone || !size || !lockerId || !cellId) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה' },
        { status: 400 }
      )
    }

    // יצירת קוד מעקב אם לא סופק
    const finalTrackingCode = tracking_code || 
      'XYZ' + Math.random().toString(36).substr(2, 9).toUpperCase()

    // במצב Mock - נדמה יצירת חבילה
    console.log('יוצר חבילה חדשה:', {
      customerName,
      email,
      phone,
      finalTrackingCode,
      size,
      lockerId,
      cellId
    })

    // שמירת החבילה במערכת Mock
    const newPackage = {
      id: Math.floor(Math.random() * 10000),
      name: customerName,
      userName: customerName,
        email, 
      phone,
      tracking_code: finalTrackingCode,
        size,
        lockerId,
        cellId,
      status: 'WAITING',
      createdAt: new Date().toISOString()
      }

    // שליחת הודעת אימייל ללקוח
    try {
      await sendNotificationEmail({
        to: email,
        name: customerName,
        trackingCode: finalTrackingCode,
        lockerLocation: `לוקר ${lockerId}`,
        cellCode: cellId.toString()
      })
    } catch (emailError) {
      console.error('שגיאה בשליחת אימייל:', emailError)
      // לא נעצור את התהליך בגלל שגיאת אימייל
    }

    return NextResponse.json({
      success: true,
      package: {
        id: newPackage.id,
        trackingCode: finalTrackingCode,
        userName: customerName,
        userEmail: email,
        userPhone: phone,
        size: size,
        lockerId: lockerId,
        cellId: cellId,
        status: 'WAITING'
      }
    })

  } catch (error) {
    console.error('שגיאה ביצירת חבילה:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
} 