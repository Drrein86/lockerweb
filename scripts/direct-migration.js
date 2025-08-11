// הרצת migration ישירות עם Railway

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function runDirectMigration() {
  console.log('🚀 מתחיל migration ישיר ל-Railway...')
  
  const prisma = new PrismaClient()
  
  try {
    // בדיקת חיבור
    console.log('📡 בודק חיבור ל-Railway DB...')
    await prisma.$connect()
    console.log('✅ מחובר ל-Railway DB!')
    
    // בדיקת טבלאות קיימות
    console.log('🔍 בודק טבלאות קיימות...')
    
    try {
      const userCount = await prisma.user.count()
      console.log(`👥 נמצאו ${userCount} משתמשים קיימים`)
    } catch (error) {
      console.log('❌ טבלת User לא קיימת, יוצר...')
      
      // יצירת enum types
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGEMENT', 'COURIER', 'BUSINESS', 'CUSTOMER_SERVICE');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
      
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
      
      // יצירת טבלת User
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" SERIAL PRIMARY KEY,
          "email" VARCHAR(255) UNIQUE NOT NULL,
          "password" VARCHAR(255) NOT NULL,
          "googleId" VARCHAR(255) UNIQUE,
          "firstName" VARCHAR(255) NOT NULL,
          "lastName" VARCHAR(255) NOT NULL,
          "phone" VARCHAR(255),
          "profileImage" VARCHAR(255),
          "role" "UserRole" NOT NULL,
          "status" "UserStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
          "lastLoginAt" TIMESTAMP,
          "isApproved" BOOLEAN NOT NULL DEFAULT false,
          "approvedBy" INTEGER,
          "approvedAt" TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
      
      console.log('✅ טבלת User נוצרה!')
    }
    
    // בדיקת משתמש אדמין
    console.log('👑 בודק משתמש אדמין...')
    let admin = await prisma.user.findUnique({
      where: { email: 'elior2280@gmail.com' }
    })
    
    if (!admin) {
      console.log('🆕 יוצר משתמש אדמין...')
      const hashedPassword = await bcrypt.hash('123', 12)
      
      admin = await prisma.user.create({
        data: {
          email: 'elior2280@gmail.com',
          password: hashedPassword,
          firstName: 'אליאור',
          lastName: 'אדמין',
          role: 'ADMIN',
          status: 'ACTIVE',
          isApproved: true,
          approvedAt: new Date(),
        }
      })
      
      console.log('✅ משתמש אדמין נוצר!')
    } else {
      console.log('✅ משתמש אדמין כבר קיים!')
    }
    
    console.log('')
    console.log('🎉 Migration הושלם בהצלחה!')
    console.log('👤 פרטי אדמין:')
    console.log('📧 מייל: elior2280@gmail.com')
    console.log('🔒 סיסמא: 123')
    console.log('')
    
  } catch (error) {
    console.error('❌ שגיאה במהלך migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runDirectMigration()
