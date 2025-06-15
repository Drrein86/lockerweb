import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotificationEmail } from '@/lib/email'
import { openLockerCell } from '@/lib/websocket'

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
      cellId, 
      cellCode 
    } = body

    // בדיקת שדות חובה
    if (!name || !email || !phone || !size || !lockerId || !cellId) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה' },
        { status: 400 }
      )
    }

    // המרת גודל מעברית לאנגלית
    const sizeMap: { [key: string]: string } = {
      'קטן': 'SMALL',
      'בינוני': 'MEDIUM',
      'גדול': 'LARGE',
      'רחב': 'WIDE'
    }

    const dbSize = sizeMap[size]
    if (!dbSize) {
      return NextResponse.json(
        { error: 'גודל חבילה לא תקין' },
        { status: 400 }
      )
    }

    // יצירת קוד מעקב אם לא סופק
    const finalTrackingCode = tracking_code || 
      'XYZ' + Math.random().toString(36).substr(2, 9).toUpperCase()

    // בדיקה שהתא עדיין זמין
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: { locker: true }
    })

    if (!cell || cell.isOccupied) {
      return NextResponse.json(
        { error: 'התא כבר תפוס או לא קיים' },
        { status: 400 }
      )
    }

    // שמירת החבילה בבסיס הנתונים
    const newPackage = await prisma.package.create({
      data: {
        trackingCode: finalTrackingCode,
        userName: name,
        userEmail: email,
        userPhone: phone,
        size: dbSize as any,
        lockerId,
        cellId,
        status: 'WAITING'
      },
      include: {
        locker: true,
        cell: true
      }
    })

    // עדכון סטטוס התא לתפוס
    await prisma.cell.update({
      where: { id: cellId },
      data: { isOccupied: true }
    })

    // שליחת הודעת אימייל ללקוח
    try {
      await sendNotificationEmail({
        to: email,
        name,
        trackingCode: finalTrackingCode,
        lockerLocation: cell.locker.location,
        cellCode: cell.code
      })
    } catch (emailError) {
      console.error('שגיאה בשליחת אימייל:', emailError)
      // לא נעצור את התהליך בגלל שגיאת אימייל
    }

    // פתיחת התא דרך WebSocket
    try {
      await openLockerCell(lockerId, cellCode || cell.code)
    } catch (wsError) {
      console.error('שגיאה בפתיחת התא:', wsError)
      // לא נעצור את התהליך בגלל שגיאת WebSocket
    }

    return NextResponse.json({
      success: true,
      package: {
        id: newPackage.id,
        trackingCode: finalTrackingCode,
        locker: newPackage.locker.location,
        cell: newPackage.cell.code,
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