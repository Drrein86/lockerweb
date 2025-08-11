// יצירת טבלאות הרשאות ב-Railway

const { PrismaClient } = require('@prisma/client')

async function createPermissionsTables() {
  console.log('🔐 יוצר טבלאות הרשאות ב-Railway...')
  
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    console.log('✅ מחובר ל-Railway DB!')
    
    // יצירת טבלת UserPermission
    console.log('📄 יוצר טבלת UserPermission...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserPermission" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "pageRoute" VARCHAR(255) NOT NULL,
        "canView" BOOLEAN NOT NULL DEFAULT false,
        "canEdit" BOOLEAN NOT NULL DEFAULT false,
        "canDelete" BOOLEAN NOT NULL DEFAULT false,
        "canCreate" BOOLEAN NOT NULL DEFAULT false,
        "description" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        UNIQUE("userId", "pageRoute")
      );
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "UserPermission_pageRoute_idx" ON "UserPermission"("pageRoute");
    `
    
    console.log('✅ טבלת UserPermission נוצרה!')
    
    // יצירת טבלת SystemPage
    console.log('📄 יוצר טבלת SystemPage...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SystemPage" (
        "id" SERIAL PRIMARY KEY,
        "route" VARCHAR(255) UNIQUE NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(255) NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "requiresRole" "UserRole",
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    console.log('✅ טבלת SystemPage נוצרה!')
    
    // יצירת דפי מערכת ברירת מחדל
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
    
    for (const page of defaultPages) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "SystemPage" ("route", "title", "category", "requiresRole")
          VALUES (${page.route}, ${page.title}, ${page.category}, ${page.requiresRole})
          ON CONFLICT ("route") DO NOTHING;
        `
      } catch (error) {
        console.log(`⚠️ שגיאה ביצירת דף ${page.route}:`, error.message)
      }
    }
    
    console.log(`✅ ${defaultPages.length} דפי מערכת נוצרו!`)
    
    console.log('')
    console.log('🎉 טבלאות הרשאות נוצרו בהצלחה ב-Railway!')
    console.log('🔐 המערכת מוכנה לניהול הרשאות!')
    
  } catch (error) {
    console.error('❌ שגיאה ביצירת טבלאות הרשאות:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPermissionsTables()
