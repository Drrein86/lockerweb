import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      tracking_code, 
      size, 
      lockerId, 
      cellId
    } = body

    // בדיקת שדות חובה
    if (!name || !email || !phone || !size || !lockerId || !cellId) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה' },
        { status: 400 }
      )
    }

    // יצירת קוד מעקב אם לא סופק
    const finalTrackingCode = tracking_code || 
      'XYZ' + Math.random().toString(36).substr(2, 9).toUpperCase()

    // בדיקה שהלוקר קיים
    const locker = await prisma.locker.findUnique({
      where: { id: lockerId }
    })

    if (!locker) {
      return NextResponse.json(
        { error: 'הלוקר לא קיים' },
        { status: 400 }
      )
    }

    // יצירת לקוח או מציאת לקוח קיים
    const customer = await prisma.customer.upsert({
      where: { email },
      update: { firstName: name.split(' ')[0], lastName: name.split(' ')[1] || '', phone },
      create: { 
        email, 
        firstName: name.split(' ')[0], 
        lastName: name.split(' ')[1] || '', 
        phone 
      }
    })

    // שמירת החבילה בבסיס הנתונים
    const newPackage = await prisma.package.create({
      data: {
        trackingCode: finalTrackingCode,
        customerId: customer.id,
        courierId: 1, // זמני - יש צורך במערכת שליחים
        size,
        lockerId,
        cellId,
        status: 'WAITING'
      }
    })

    // שליחת הודעת אימייל ללקוח
    try {
      await sendNotificationEmail({
        to: email,
        name,
        trackingCode: finalTrackingCode,
        lockerLocation: `לוקר ${locker.lockerId}`,
        cellCode: cellId
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
        lockerId: newPackage.lockerId,
        cellId: newPackage.cellId,
        status: newPackage.status
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