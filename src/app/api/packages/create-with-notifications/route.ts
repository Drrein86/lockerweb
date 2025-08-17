import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

interface PackageCreateRequest {
  // נתוני חבילה
  trackingCode: string
  packageId?: string
  description: string
  size: string
  
  // נתוני לקוח
  customerName: string
  customerPhone: string
  customerEmail: string
  
  // נתוני לוקר ותא
  lockerId: number
  cellId: number
  cellNumber: number
  cellCode?: string
  lockerName?: string
  location?: string
  
  // הערות ומידע נוסף
  notes?: string
  inputMethod: 'qr' | 'manual'
}

interface NotificationResult {
  success: boolean
  message: string
  recipient?: string
  url?: string
}

interface NotificationResults {
  email: NotificationResult
  whatsapp: NotificationResult
  sms: NotificationResult
}

export async function POST(request: NextRequest) {
  try {
    const body: PackageCreateRequest = await request.json()
    console.log('📦 התקבלה בקשה ליצירת חבילה:', body)

    // בדיקת פרמטרים נדרשים
    if (!body.customerName || !body.customerPhone || !body.customerEmail || 
        !body.lockerId || !body.cellId || !body.trackingCode) {
      return NextResponse.json(
        { success: false, message: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      )
    }

    // יצירת או עדכון לקוח
    console.log('👤 מטפל בנתוני לקוח...')
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: body.customerEmail },
          { phone: body.customerPhone }
        ]
      }
    })

    if (customer) {
      // עדכון לקוח קיים
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          firstName: body.customerName.split(' ')[0] || body.customerName,
          lastName: body.customerName.split(' ').slice(1).join(' ') || '',
          phone: body.customerPhone,
          email: body.customerEmail
        }
      })
      console.log('✅ לקוח קיים עודכן:', customer.id)
    } else {
      // יצירת לקוח חדש
      customer = await prisma.customer.create({
        data: {
          firstName: body.customerName.split(' ')[0] || body.customerName,
          lastName: body.customerName.split(' ').slice(1).join(' ') || '',
          phone: body.customerPhone,
          email: body.customerEmail
        }
      })
      console.log('✅ לקוח חדש נוצר:', customer.id)
    }

    // בדיקה שהתא קיים ופנוי
    const cell = await prisma.cell.findUnique({
      where: { id: body.cellId },
      include: { locker: true }
    })

    if (!cell) {
      return NextResponse.json(
        { success: false, message: 'התא לא נמצא במערכת' },
        { status: 404 }
      )
    }

    if (cell.status !== 'AVAILABLE') {
      return NextResponse.json(
        { success: false, message: 'התא לא זמין כרגע' },
        { status: 409 }
      )
    }

    // יצירת החבילה
    console.log('📦 יוצר חבילה חדשה...')
    const newPackage = await prisma.package.create({
      data: {
        trackingCode: body.trackingCode,
        customerId: customer.id,
        courierId: 1, // TODO: לקבל מה-session
        size: body.size,
        status: 'WAITING',
        lockerId: body.lockerId,
        cellId: body.cellId
      },
      include: {
        customer: true,
        locker: true,
        cell: true
      }
    })

    // עדכון סטטוס התא לתפוס
    await prisma.cell.update({
      where: { id: body.cellId },
      data: {
        status: 'OCCUPIED',
        isLocked: true
      }
    })

    console.log('✅ חבילה נוצרה בהצלחה:', newPackage.id)

    // שליחת הודעות ללקוח
    console.log('📱 שולח הודעות ללקוח...')
    const notificationResult = await sendNotificationsToCustomer({
      customer,
      package: newPackage,
      cell,
      locker: cell.locker,
      location: body.location,
      lockerName: body.lockerName
    })

    console.log('📡 תוצאות שליחת הודעות:', notificationResult)

    return NextResponse.json({
      success: true,
      message: 'החבילה נשמרה והודעות נשלחו בהצלחה',
      packageId: newPackage.id,
      trackingCode: newPackage.trackingCode,
      customerId: customer.id,
      cellId: cell.id,
      notifications: notificationResult
    })

  } catch (error) {
    console.error('❌ שגיאה ביצירת חבילה:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'שגיאה פנימית בשרת',
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// פונקציה לשליחת הודעות ללקוח
async function sendNotificationsToCustomer({
  customer,
  package: pkg,
  cell,
  locker,
  location,
  lockerName
}: {
  customer: any
  package: any
  cell: any
  locker: any
  location?: string
  lockerName?: string
}): Promise<NotificationResults> {
  const results: NotificationResults = {
    email: { success: false, message: '', recipient: '' },
    whatsapp: { success: false, message: '', url: '' },
    sms: { success: false, message: '', url: '' }
  }

  // יצירת הודעה מותאמת אישית
  const locationText = location || locker.location || 'המיקום יימסר בנפרד'
  const lockerDisplayName = lockerName || locker.name || `לוקר ${locker.id}`
  
  const message = `
🎉 החבילה שלך הגיעה!

📦 פרטי החבילה:
• קוד מעקב: ${pkg.trackingCode}
• גודל: ${pkg.size}

📍 מיקום איסוף:
• כתובת: ${locationText}
• לוקר: ${lockerDisplayName}
• תא מספר: ${cell.cellNumber}
• קוד תא: ${cell.code}

🔑 קוד פתיחה: ${pkg.trackingCode}

📱 הוראות איסוף:
1. הגע למיקום הלוקר
2. לחץ על "פתיחת תא" באתר
3. הזן את קוד המעקב
4. התא ייפתח אוטומטית
5. קח את החבילה וסגור את התא

💻 קישור למערכת: https://lockerweb-alpha.vercel.app/customer/unlock/${pkg.trackingCode}

בברכה,
צוות הלוקרים החכמים 🚀
  `.trim()

  // שליחת מייל
  try {
    console.log('📧 שולח מייל ל:', customer.email)
    const emailResult = await sendEmailNotification(customer.email, customer.firstName, message, pkg.trackingCode)
    results.email = emailResult
  } catch (error) {
    console.error('❌ שגיאה בשליחת מייל:', error)
    results.email = { success: false, message: error instanceof Error ? error.message : 'שגיאה בשליחת מייל', recipient: customer.email }
  }

  // הכנת הודעת וואטסאפ
  try {
    console.log('📱 מכין הודעת וואטסאפ ל:', customer.phone)
    const whatsappUrl = createWhatsAppMessage(customer.phone, message)
    results.whatsapp = { success: true, message: 'הודעת וואטסאפ מוכנה', url: whatsappUrl }
  } catch (error) {
    console.error('❌ שגיאה בהכנת וואטסאפ:', error)
    results.whatsapp = { success: false, message: error instanceof Error ? error.message : 'שגיאה בהכנת וואטסאפ', url: '' }
  }

  // הכנת הודעת SMS
  try {
    console.log('💬 מכין הודעת SMS ל:', customer.phone)
    const smsText = `החבילה שלך הגיעה! קוד מעקב: ${pkg.trackingCode}. מיקום: ${locationText}, ${lockerDisplayName}, תא ${cell.cellNumber}. קישור: https://lockerweb-alpha.vercel.app/customer/unlock/${pkg.trackingCode}`
    const smsUrl = createSMSMessage(customer.phone, smsText)
    results.sms = { success: true, message: 'הודעת SMS מוכנה', url: smsUrl }
  } catch (error) {
    console.error('❌ שגיאה בהכנת SMS:', error)
    results.sms = { success: false, message: error instanceof Error ? error.message : 'שגיאה בהכנת SMS', url: '' }
  }

  return results
}

// פונקציה לשליחת מייל (תצטרך הגדרה של שירות מייל)
async function sendEmailNotification(email: string, name: string, message: string, trackingCode: string): Promise<NotificationResult> {
  // כאן תהיה אינטגרציה עם שירות מייל (Gmail, SendGrid, וכו')
  console.log('📧 [SIMULATION] שליחת מייל ל:', email)
  console.log('📧 [SIMULATION] תוכן:', message)
  
  // סימולציה של שליחת מייל מוצלחת
  return { 
    success: true, 
    message: 'מייל נשלח בהצלחה (סימולציה)',
    recipient: email
  }
}

// פונקציה ליצירת קישור וואטסאפ
function createWhatsAppMessage(phone: string, message: string): string {
  // ניקוי מספר טלפון
  const cleanPhone = phone.replace(/[^\d]/g, '')
  const phoneWithCountryCode = cleanPhone.startsWith('972') ? cleanPhone : `972${cleanPhone.substring(1)}`
  
  // יצירת URL לוואטסאפ
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`
}

// פונקציה ליצירת קישור SMS
function createSMSMessage(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message)
  return `sms:${phone}?body=${encodedMessage}`
}
