import { NextRequest, NextResponse } from 'next/server'

// Dynamic import של Prisma כדי לא לשבור את הבניה
let prisma: any = null

async function getPrisma() {
  if (!prisma) {
    try {
      const { PrismaClient } = await import('@prisma/client')
      prisma = new PrismaClient()
      await prisma.$connect()
      return prisma
    } catch (error) {
      console.error('❌ שגיאה בהתחברות למסד הנתונים:', error)
      return null
    }
  }
  return prisma
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📦 התקבלה בקשה ליצירת חבילה עם הודעות')
    
    const body = await request.json()
    console.log('📋 נתוני החבילה:', body)
    
    const {
      customerName,
      customerPhone,
      customerEmail,
      trackingCode,
      description,
      packageId,
      lockerId,
      cellId,
      cellCode,
      cellNumber,
      size,
      city,
      street,
      location,
      lockerName,
      active,
      deliveryType
    } = body

    // בדיקת פרמטרים נדרשים
    if (!customerName || !customerPhone || !trackingCode || !lockerId || !cellId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'חסרים פרמטרים נדרשים: customerName, customerPhone, trackingCode, lockerId, cellId' 
        },
        { status: 400 }
      )
    }

    const prismaClient = await getPrisma()
    if (!prismaClient) {
      return NextResponse.json(
        { success: false, message: 'שגיאה בחיבור למסד הנתונים' },
        { status: 500 }
      )
    }

    try {
      // שלב 1: יצירת החבילה במסד הנתונים
      console.log('💾 יוצר חבילה במסד הנתונים...')
      
      const packageRecord = await prismaClient.package.create({
        data: {
          trackingCode: trackingCode,
          customerName: customerName,
          customerPhone: customerPhone,
          customerEmail: customerEmail || '',
          size: size || 'MEDIUM',
          status: 'DEPOSITED',
          isActive: active !== false,
          notes: description || '',
          packageId: packageId ? String(packageId) : null,
          lockerId: lockerId,
          cellId: cellId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log('✅ חבילה נוצרה במסד הנתונים:', packageRecord.id)

      // שלב 2: עדכון סטטוס התא כתפוס
      console.log('🔒 מעדכן סטטוס התא כתפוס...')
      
      await prismaClient.cell.update({
        where: { id: cellId },
        data: {
          isLocked: true,
          isOccupied: true,
          packageId: packageRecord.id,
          lastClosedAt: new Date()
        }
      })

      console.log('✅ התא עודכן כתפוס')

      // שלב 3: יצירת רשומת לוג
      try {
        await prismaClient.auditLog.create({
          data: {
            action: 'PACKAGE_CREATED',
            entityType: 'PACKAGE',
            entityId: packageRecord.id.toString(),
            userId: null, // אין משתמש מחובר - זה שליח
            details: JSON.stringify({
              trackingCode,
              lockerId,
              cellId,
              cellCode,
              customerName,
              deliveryType: 'COURIER_DEPOSIT'
            }),
            createdAt: new Date()
          }
        })
      } catch (logError) {
        console.error('⚠️ שגיאה ביצירת לוג (לא קריטי):', logError)
      }

      // שלב 4: יצירת נתוני ההודעות
      const notificationData = {
        customerName,
        customerPhone,
        customerEmail,
        trackingCode,
        city: city || 'תל אביב',
        street: street || 'רחוב הטכנולוגיה 1',
        location: location || 'ליד הכניסה הראשית',
        lockerName: lockerName || `לוקר #${lockerId}`,
        cellCode: cellCode,
        lockerId,
        cellId,
        packageId: packageRecord.id,
        description: description || 'חבילה',
        unlockCode: generateUnlockCode(packageRecord.id, trackingCode),
        companyName: 'Smart Lockers',
        companyPhone: '072-123-4567',
        companyEmail: 'support@smartlockers.co.il'
      }

      // שלב 5: שליחת הודעות
      console.log('📨 מתחיל שליחת הודעות...')
      
      const notificationResults = await sendNotifications(notificationData)

      // תגובה סופית
      return NextResponse.json({
        success: true,
        message: 'החבילה נשמרה בהצלחה והודעות נשלחו',
        packageId: packageRecord.id,
        trackingCode: trackingCode,
        cellCode: cellCode,
        notificationsSent: notificationResults.sent,
        notificationErrors: notificationResults.errors,
        unlockCode: notificationData.unlockCode
      })

    } catch (dbError) {
      console.error('❌ שגיאה במסד הנתונים:', dbError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'שגיאה בשמירת החבילה במסד הנתונים',
          details: dbError instanceof Error ? dbError.message : 'שגיאה לא ידועה'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ שגיאה כללית ב-API:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'שגיאה פנימית בשרת',
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      },
      { status: 500 }
    )
  }
}

// פונקציה ליצירת קוד פתיחה
function generateUnlockCode(packageId: number, trackingCode: string): string {
  // יצירת קוד פתיחה מבוסס על מזהה החבילה וקוד המעקב
  const hash = require('crypto').createHash('md5').update(`${packageId}-${trackingCode}`).digest('hex')
  return hash.substring(0, 8).toUpperCase()
}

// פונקציה לשליחת הודעות
async function sendNotifications(data: any) {
  const results = {
    sent: 0,
    errors: [] as string[]
  }

  try {
    // יצירת תוכן ההודעות
    const messageContent = createMessageContent(data)
    
    console.log('📧 שולח הודעות:', {
      email: data.customerEmail,
      phone: data.customerPhone,
      trackingCode: data.trackingCode
    })

    // שליחת אימייל (אם יש אימייל)
    if (data.customerEmail) {
      try {
        await sendEmail(data.customerEmail, messageContent.email)
        console.log('✅ אימייל נשלח בהצלחה')
        results.sent++
      } catch (emailError) {
        console.error('❌ שגיאה בשליחת אימייל:', emailError)
        results.errors.push('שגיאה בשליחת אימייל')
      }
    }

    // הכנת הודעת SMS (לא שולחים אוטומטית - מכינים רק)
    console.log('📱 הכנת הודעת SMS:', messageContent.sms)
    
    // יצירת קישור ל-WhatsApp
    const whatsappUrl = createWhatsAppUrl(data.customerPhone, messageContent.whatsapp)
    console.log('💬 קישור WhatsApp:', whatsappUrl)

    return results

  } catch (error) {
    console.error('❌ שגיאה בשליחת הודעות:', error)
    results.errors.push('שגיאה כללית בשליחת הודעות')
    return results
  }
}

// יצירת תוכן ההודעות
function createMessageContent(data: any) {
  const baseMessage = `
שלום ${data.customerName}!

החבילה שלך הופקדה בהצלחה בלוקר החכם שלנו.

📦 פרטי החבילה:
• קוד מעקב: ${data.trackingCode}
• קוד פתיחה: ${data.unlockCode}
• תיאור: ${data.description}

📍 מיקום הלוקר:
• עיר: ${data.city}
• כתובת: ${data.street}
• מיקום מדויק: ${data.location}
• לוקר: ${data.lockerName}
• תא: ${data.cellCode}

🔓 הוראות איסוף:
1. הגע למיקום הלוקר
2. הזן את קוד המעקב: ${data.trackingCode}
3. הזן את קוד הפתיחה: ${data.unlockCode}
4. התא ייפתח אוטומטית
5. אסוף את החבילה

⏰ החבילה תהיה זמינה לאיסוף במשך 7 ימים.

📞 שירות לקוחות: ${data.companyPhone}
📧 אימייל: ${data.companyEmail}

תודה על השימוש בשירות ${data.companyName}!
  `

  return {
    email: {
      subject: `החבילה שלך מחכה - קוד מעקב ${data.trackingCode}`,
      html: baseMessage.replace(/\n/g, '<br>'),
      text: baseMessage
    },
    sms: `שלום ${data.customerName}! החבילה שלך הופקדה בלוקר. קוד מעקב: ${data.trackingCode}, קוד פתיחה: ${data.unlockCode}. מיקום: ${data.street}, ${data.city}. ${data.companyName}`,
    whatsapp: baseMessage
  }
}

// שליחת אימייל (stub - ניתן להחליף בשירות אמיתי)
async function sendEmail(to: string, content: any) {
  console.log('📧 [STUB] שליחת אימייל ל:', to)
  console.log('📧 [STUB] נושא:', content.subject)
  
  // כאן ניתן להוסיף אינטגרציה עם SendGrid, Mailgun וכו'
  // לעת עתה - סימולציה
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ [STUB] אימייל נשלח (סימולציה)')
      resolve(true)
    }, 1000)
  })
}

// יצירת קישור WhatsApp
function createWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}
