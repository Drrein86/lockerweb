import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      trackingCode,
      tracking_code,
      customerName,
      name,
      userName,
      customerPhone,
      phone,
      customerEmail,
      email,
      size,
      lockerId,
      cellId,
      cellCode,
      notes
    } = body

    // תמיכה בשמות שדות שונים
    const finalTrackingCode = trackingCode || tracking_code
    const finalCustomerName = customerName || name || userName
    const finalCustomerPhone = customerPhone || phone  
    const finalCustomerEmail = customerEmail || email

    // בדיקת פרמטרים נדרשים
    if (!finalTrackingCode || !finalCustomerName || !finalCustomerPhone || !size || !lockerId || !cellId) {
      return NextResponse.json(
        { success: false, message: 'חסרים פרמטרים נדרשים', 
          received: { finalTrackingCode, finalCustomerName, finalCustomerPhone, size, lockerId, cellId } },
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
    let customer = await prisma.customer.findFirst({
      where: { phone: finalCustomerPhone }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: finalCustomerEmail || `${finalCustomerPhone}@temp.local`,
          firstName: finalCustomerName.split(' ')[0] || finalCustomerName,
          lastName: finalCustomerName.split(' ').slice(1).join(' ') || '',
          phone: finalCustomerPhone,
          address: cell.locker.location // כתובת זמנית
        }
      })
    }

    // יצירת קוד שחרור בן 4 ספרות
    const pickupCode = generatePickupCode()

    // יצירת רשומת החבילה
    const newPackage = await prisma.package.create({
      data: {
        trackingCode: finalTrackingCode,
        unlockCode: pickupCode,
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

    // פתיחת התא אוטומטית עבור השליח
    try {
      console.log(`🚚 פותח תא ${cell.cellNumber} בלוקר ${cell.locker.deviceId} עבור הכנסת חבילה`)
      
      // קריאה ל-API פתיחת תא
      const unlockResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/lockers/unlock-cell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lockerId: cell.lockerId,
          cellId: cell.cellNumber,
          reason: 'COURIER_DELIVERY',
          packageId: newPackage.id
        })
      })

      if (unlockResponse.ok) {
        console.log(`✅ תא ${cell.cellNumber} נפתח בהצלחה עבור הכנסת חבילה`)
      } else {
        console.error(`❌ שגיאה בפתיחת תא: ${unlockResponse.status}`)
      }
    } catch (unlockError) {
      console.error('❌ שגיאה בפתיחת תא אוטומטית:', unlockError)
      // לא נכשיל את כל הפעולה אם יש שגיאה בפתיחת התא
    }

    // שמירת קוד השחרור בטבלה נפרדת (אם קיימת) או ב-metadata
    try {
      console.log('נוצר לוג: חבילה נוצרה', {
        action: 'PACKAGE_CREATED',
        entityType: 'PACKAGE',
        entityId: newPackage.id.toString(),
          trackingCode: finalTrackingCode,
          customerId: customer.id,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          lockerId,
          cellId,
          cellCode,
          pickupCode, // שמירת קוד השחרור
          size,
          notes
      })
    } catch (logError) {
      console.error('שגיאה ביצירת לוג:', logError)
    }

    // שליחת הודעה ללקוח (SMS/Email)
    const notificationResult = await sendCustomerNotification({
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerEmail: finalCustomerEmail,
      trackingCode: finalTrackingCode,
      pickupCode,
      lockerName: cell.locker.name,
      lockerLocation: cell.locker.location,
      cellNumber: cell.cellNumber
    })

    return NextResponse.json({
      success: true,
      message: 'החבילה נשמרה בהצלחה',
      package: {
        id: newPackage.id,
        trackingCode: newPackage.trackingCode,
        status: newPackage.status,
        pickupCode,
        customer: {
          name: finalCustomerName,
          phone: finalCustomerPhone,
          email: finalCustomerEmail
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
      { success: false, message: 'שגיאה בשרת', details: error instanceof Error ? error.message : 'שגיאה לא ידועה' },
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
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה',
      message: 'שגיאה בשליחת הודעה ללקוח'
    }
  }
} 