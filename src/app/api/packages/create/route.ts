import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotificationEmail } from '@/lib/email'
import { useWebSocketStore } from '@/lib/services/websocket.service'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      description, 
      lockerId, 
      cellId 
    } = body

    // בדיקת שדות חובה
    if (!name || !email || !phone || !description || !lockerId || !cellId) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה' },
        { status: 400 }
      )
    }

    // בדיקה שהתא עדיין זמין
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: { 
        locker: true,
        packages: {
          where: { status: 'IN_LOCKER' }
        }
      }
    })

    if (!cell || cell.packages.length > 0) {
      return NextResponse.json(
        { error: 'התא כבר תפוס או לא קיים' },
        { status: 400 }
      )
    }

    // חיפוש או יצירת משתמש
    let recipient = await prisma.user.findUnique({
      where: { email }
    })

    if (!recipient) {
      // יצירת סיסמה זמנית
      const tempPassword = Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      recipient = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CUSTOMER'
        }
      })

      // TODO: שליחת סיסמה זמנית במייל
    }

    // שמירת החבילה בבסיס הנתונים
    const newPackage = await prisma.package.create({
      data: {
        description,
        recipient: {
          connect: { id: recipient.id }
        },
        locker: {
          connect: { id: lockerId }
        },
        cell: {
          connect: { id: cellId }
        },
        status: 'PENDING'
      },
      include: {
        locker: true,
        cell: true
      }
    })

    if (!newPackage.locker || !newPackage.cell) {
      throw new Error('שגיאה בשמירת החבילה')
    }

    // עדכון סטטוס התא לנעול
    await prisma.cell.update({
      where: { id: cellId },
      data: { isLocked: true }
    })

    // שליחת הודעת אימייל ללקוח
    try {
      await sendNotificationEmail({
        to: email,
        name,
        packageId: newPackage.id,
        lockerLocation: cell.locker.location,
        cellNumber: cell.number
      })
    } catch (emailError) {
      console.error('שגיאה בשליחת אימייל:', emailError)
      // לא נעצור את התהליך בגלל שגיאת אימייל
    }

    // פתיחת התא דרך WebSocket
    try {
      const { unlockCell } = useWebSocketStore.getState()
      await unlockCell(lockerId, cellId)
    } catch (wsError) {
      console.error('שגיאה בפתיחת התא:', wsError)
      // לא נעצור את התהליך בגלל שגיאת WebSocket
    }

    return NextResponse.json({
      success: true,
      package: {
        id: newPackage.id,
        description: newPackage.description,
        locker: newPackage.locker.location,
        cell: newPackage.cell.number,
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