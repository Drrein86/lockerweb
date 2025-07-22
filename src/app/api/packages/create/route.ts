import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const {
      trackingCode,
      customerName,
      customerPhone,
      customerEmail,
      size,
      lockerId,
      cellId,
      notes
    } = await request.json()

    // בדיקת פרמטרים נדרשים
    if (!trackingCode || !customerName || !customerPhone || !size || !lockerId || !cellId) {
      return NextResponse.json(
        { success: false, message: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    // בדיקה שהתא קיים ופנוי
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: { locker: true }
    })

    if (!cell) {
      return NextResponse.json(
        { success: false, message: 'תא לא נמצא' },
        { status: 404 }
      )
    }

    if (cell.status === 'OCCUPIED') {
      return NextResponse.json(
        { success: false, message: 'התא כבר תפוס' },
        { status: 409 }
      )
    }

    // יצירת או מציאת לקוח
    let customer = await prisma.customer.findUnique({
      where: { phone: customerPhone }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: customerEmail || `${customerPhone}@temp.local`,
          firstName: customerName.split(' ')[0] || customerName,
          lastName: customerName.split(' ').slice(1).join(' ') || '',
          phone: customerPhone,
          address: cell.locker.location // כתובת זמנית
        }
      })
    }

    // יצירת קוד שחרור
    const pickupCode = generatePickupCode()

    // יצירת רשומת החבילה
    const package = await prisma.package.create({
      data: {
        trackingCode,
        customerId: customer.id,
        courierId: 1, // נניח שיש משתמש courier ברירת מחדל
        size: size.toUpperCase(),
        status: 'WAITING',
        lockerId,
        cellId,
        delivery: {
          create: {
            courierId: 1,
            status: 'COMPLETED',
            notes: notes || null
          }
        }
      },
      include: {
        customer: true,
        locker: true,
        cell: true
      }
    })

    // עדכון סטטוס התא לתפוס
    await prisma.cell.update({
      where: { id: cellId },
      data: {
        status: 'OCCUPIED'
      }
    })

    // שמירת קוד השחרור בטבלה נפרדת (אם קיימת) או ב-metadata
    await prisma.auditLog.create({
      data: {
        action: 'PACKAGE_CREATED',
        entityType: 'PACKAGE',
        entityId: package.id.toString(),
        details: {
          trackingCode,
          customerId: customer.id,
          customerName,
          customerPhone,
          lockerId,
          cellId,
          pickupCode, // שמירת קוד השחרור
          size,
          notes
        },
        success: true,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // שליחת הודעה ללקוח (SMS/Email)
    const notificationResult = await sendCustomerNotification({
      customerName,
      customerPhone,
      customerEmail,
      trackingCode,
      pickupCode,
      lockerName: cell.locker.name,
      lockerLocation: cell.locker.location,
      cellNumber: cell.cellNumber
    })

    return NextResponse.json({
      success: true,
      message: 'החבילה נשמרה בהצלחה',
      package: {
        id: package.id,
        trackingCode: package.trackingCode,
        status: package.status,
        pickupCode,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail
        },
        locker: {
          id: cell.locker.id,
          name: cell.locker.name,
          location: cell.locker.location
        },
        cell: {
          id: cell.id,
          number: cell.cellNumber,
          code: cell.code
        },
        notification: notificationResult
      }
    })

  } catch (error) {
    console.error('שגיאה בשמירת חבילה:', error)
    return NextResponse.json(
      { success: false, message: 'שגיאה בשרת', details: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// יצירת קוד שחרור רנדומלי
function generatePickupCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// שליחת הודעה ללקוח
async function sendCustomerNotification(data: {
  customerName: string
  customerPhone: string
  customerEmail?: string
  trackingCode: string
  pickupCode: string
  lockerName: string
  lockerLocation: string
  cellNumber: number
}) {
  try {
    const message = `שלום ${data.customerName},
חבילה מחכה לך בלוקר!

🏢 לוקר: ${data.lockerName}
📍 מיקום: ${data.lockerLocation}
📦 תא מספר: ${data.cellNumber}
🔑 קוד שחרור: ${data.pickupCode}
📋 קוד מעקב: ${data.trackingCode}

לשחרור החבילה, גש ללוקר והזן את קוד השחרור.
החבילה תישמר עד 7 ימים.

בברכה,
צוות הלוקרים החכמים`

    // כאן ניתן להוסיף אינטגרציה עם שירות SMS אמיתי
    // לדוגמה: Twillio, MessageBird, וכו'
    
    console.log('נשלחת הודעה ללקוח:', {
      phone: data.customerPhone,
      message: message
    })

    // סימולציה של שליחת הודעה מוצלחת
    return {
      success: true,
      method: 'SMS',
      recipient: data.customerPhone,
      message: 'ההודעה נשלחה בהצלחה',
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('שגיאה בשליחת הודעה:', error)
    return {
      success: false,
      error: error.message,
      message: 'שגיאה בשליחת הודעה ללקוח'
    }
  }
} 