// יצירת החשבון של אליאור ותיקון הכל ב-Railway

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function setupEliorAdmin() {
  console.log('👑 מגדיר את החשבון של אליאור ב-Railway...')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:rPmoCrLwGpdnUrxpQHDCGGNboIHTJZJA@maglev.proxy.rlwy.net:49217/railway'
      }
    }
  })
  
  try {
    await prisma.$connect()
    console.log('✅ מחובר ל-Railway DB!')
    
    // 1. יצירת טבלאות הרשאות אם לא קיימות
    console.log('🔐 יוצר טבלאות הרשאות...')
    
    // יצירת enum לתפקידים אם לא קיים
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGEMENT', 'COURIER', 'BUSINESS', 'CUSTOMER_SERVICE');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
      console.log('✅ UserRole enum נוצר')
    } catch (error) {
      console.log('⚠️ UserRole enum כבר קיים')
    }
    
    // יצירת enum לסטטוס אם לא קיים  
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
      console.log('✅ UserStatus enum נוצר')
    } catch (error) {
      console.log('⚠️ UserStatus enum כבר קיים')
    }
    
    // בדיקה אם User כבר כולל את השדות החדשים
    try {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);
      `
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255) UNIQUE;
      `
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" DEFAULT 'CUSTOMER_SERVICE';
      `
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "UserStatus" DEFAULT 'PENDING_APPROVAL';
      `
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN DEFAULT false;
      `
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedBy" INTEGER;
      `
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;
      `
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP;
      `
      console.log('✅ עמודות User עודכנו')
    } catch (error) {
      console.log('⚠️ עמודות User כבר קיימות')
    }
    
    // יצירת טבלת UserPermission
    try {
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
      console.log('✅ טבלת UserPermission נוצרה')
    } catch (error) {
      console.log('⚠️ טבלת UserPermission כבר קיימת')
    }
    
    // יצירת טבלת SystemPage
    try {
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
      console.log('✅ טבלת SystemPage נוצרה')
    } catch (error) {
      console.log('⚠️ טבלת SystemPage כבר קיימת')
    }
    
    // 2. יצירת החשבון של אליאור
    console.log('👤 יוצר את החשבון של אליאור...')
    
    const hashedPassword = await bcrypt.hash('123', 12)
    
    const eliorAdmin = await prisma.$executeRaw`
      INSERT INTO "User" (
        "email", "password", "firstName", "lastName", 
        "role", "status", "isApproved", "approvedAt", "createdAt", "updatedAt"
      )
      VALUES (
        'elior2280@gmail.com', ${hashedPassword}, 'אליאור', 'אדמין',
        'ADMIN', 'ACTIVE', true, NOW(), NOW(), NOW()
      )
      ON CONFLICT ("email") DO UPDATE SET
        "password" = ${hashedPassword},
        "role" = 'ADMIN',
        "status" = 'ACTIVE',
        "isApproved" = true,
        "approvedAt" = NOW(),
        "updatedAt" = NOW();
    `
    
    console.log('✅ החשבון של אליאור נוצר/עודכן!')
    
    // 3. יצירת דפי המערכת
    console.log('📚 יוצר דפי מערכת...')
    
    const pages = [
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
    
    for (const page of pages) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "SystemPage" ("route", "title", "category", "requiresRole", "createdAt", "updatedAt")
          VALUES (${page.route}, ${page.title}, ${page.category}, ${page.requiresRole}, NOW(), NOW())
          ON CONFLICT ("route") DO UPDATE SET 
            "title" = ${page.title},
            "category" = ${page.category},
            "requiresRole" = ${page.requiresRole},
            "updatedAt" = NOW();
        `
      } catch (error) {
        console.log(`⚠️ דף ${page.route} כבר קיים`)
      }
    }
    
    console.log(`✅ ${pages.length} דפי מערכת נוצרו/עודכנו!`)
    
    // בדיקה סופית
    console.log('')
    console.log('🔍 בדיקה סופית...')
    
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`
    const pageCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "SystemPage"`
    const permissionCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "UserPermission"`
    
    console.log(`👥 משתמשים: ${userCount[0].count}`)
    console.log(`📄 דפי מערכת: ${pageCount[0].count}`)
    console.log(`🔐 הרשאות: ${permissionCount[0].count}`)
    
    console.log('')
    console.log('🎉 הכל מוכן ב-Railway!')
    console.log('👤 פרטי התחברות:')
    console.log('📧 מייל: elior2280@gmail.com')
    console.log('🔒 סיסמא: 123')
    console.log('🌐 קישור: https://lockerweb-production.up.railway.app/auth/signin')
    
  } catch (error) {
    console.error('❌ שגיאה בהגדרה:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupEliorAdmin()
