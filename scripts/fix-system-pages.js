// תיקון וחיצור דפי מערכת ב-Railway

const { PrismaClient } = require('@prisma/client')

async function fixSystemPages() {
  console.log('🔧 מתקן ויוצר דפי מערכת ב-Railway...')
  
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    console.log('✅ מחובר ל-Railway DB!')
    
    // יצירת דפי מערכת עם כל השדות
    console.log('📚 יוצר דפי מערכת...')
    
    const defaultPages = [
      { route: '/admin', title: 'דף אדמין ראשי', category: 'ניהול', requiresRole: 'ADMIN' },
      { route: '/admin/lockers', title: 'ניהול לוקרים', category: 'ניהול', requiresRole: 'MANAGEMENT' },
      { route: '/admin/packages', title: 'ניהול חבילות', category: 'ניהול', requiresRole: 'MANAGEMENT' },
      { route: '/admin/settings', title: 'הגדרות', category: 'ניהול', requiresRole: 'ADMIN' },
      { route: '/admin/users', title: 'ניהול משתמשים', category: 'ניהול', requiresRole: 'ADMIN' },
      { route: '/admin/logs', title: 'לוגים', category: 'ניהול', requiresRole: 'ADMIN' },
      { route: '/admin/reports', title: 'דוחות', category: 'ניהול', requiresRole: 'MANAGEMENT' },
      { route: '/courier', title: 'דף שליח ראשי', category: 'שליח', requiresRole: 'COURIER' },
      { route: '/courier/scan-qr', title: 'סריקת QR', category: 'שליח', requiresRole: 'COURIER' },
      { route: '/business', title: 'דף עסק ראשי', category: 'עסק', requiresRole: 'BUSINESS' },
      { route: '/business/send', title: 'שליחת חבילה', category: 'עסק', requiresRole: 'BUSINESS' },
    ]
    
    const now = new Date()
    
    for (const page of defaultPages) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "SystemPage" ("route", "title", "category", "requiresRole", "createdAt", "updatedAt")
          VALUES (${page.route}, ${page.title}, ${page.category}, ${page.requiresRole}, ${now}, ${now})
          ON CONFLICT ("route") DO UPDATE SET 
            "title" = ${page.title},
            "category" = ${page.category},
            "requiresRole" = ${page.requiresRole},
            "updatedAt" = ${now};
        `
        console.log(`✅ דף ${page.route} נוצר/עודכן`)
      } catch (error) {
        console.log(`⚠️ שגיאה ביצירת דף ${page.route}:`, error.message)
      }
    }
    
    console.log('')
    console.log(`🎉 ${defaultPages.length} דפי מערכת נוצרו/עודכנו בהצלחה!`)
    
    // בדיקה
    const pagesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "SystemPage"`
    console.log(`📊 סה"כ דפי מערכת במאגר: ${pagesCount[0].count}`)
    
  } catch (error) {
    console.error('❌ שגיאה בתיקון דפי מערכת:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSystemPages()
