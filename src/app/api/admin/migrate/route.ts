import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // בדיקת authorization
    const { authorization } = await request.json()
    const isAuthorized = authorization === 'migrate-railway-2025' ||
                        request.headers.get('host')?.includes('railway.app')
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 מתחיל migration ב-Railway...')

    // יצירת הטבלאות החדשות אם לא קיימות
    const { prisma } = await import('@/lib/prisma')

    // בדיקה אם הטבלאות החדשות קיימות
    const tablesExist = await checkTables(prisma)
    
    if (!tablesExist.User) {
      console.log('👤 יוצר טבלת משתמשים...')
      await createUserTable(prisma)
    }
    
    if (!tablesExist.UserPermission) {
      console.log('🔐 יוצר טבלת הרשאות...')
      await createUserPermissionTable(prisma)
    }
    
    if (!tablesExist.SystemPage) {
      console.log('📄 יוצר טבלת דפי מערכת...')
      await createSystemPageTable(prisma)
    }

    // יצירת משתמש אדמין אם לא קיים
    const adminExists = await prisma.user.findUnique({
      where: { email: 'elior2280@gmail.com' }
    })

    if (!adminExists) {
      console.log('👑 יוצר משתמש אדמין...')
      
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash('123', 12)
      
      await prisma.user.create({
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
    }

    // יצירת דפי מערכת אם לא קיימים
    const pagesCount = await prisma.systemPage.count()
    if (pagesCount === 0) {
      console.log('📄 יוצר דפי מערכת...')
      await createSystemPages(prisma)
    }

    console.log('✅ Migration הושלם בהצלחה!')

    return NextResponse.json({
      success: true,
      message: 'Migration הושלם בהצלחה ב-Railway',
      admin: {
        email: 'elior2280@gmail.com',
        password: '123'
      }
    })

  } catch (error) {
    console.error('❌ שגיאה במהלך migration:', error)
    return NextResponse.json({
      error: 'שגיאה במהלך migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function checkTables(prisma: any) {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'UserPermission', 'SystemPage')
    `
    
    const existingTables = new Set((result as any[]).map(row => row.table_name))
    
    return {
      User: existingTables.has('User'),
      UserPermission: existingTables.has('UserPermission'),
      SystemPage: existingTables.has('SystemPage')
    }
  } catch (error) {
    console.error('שגיאה בבדיקת טבלאות:', error)
    return { User: false, UserPermission: false, SystemPage: false }
  }
}

async function createUserTable(prisma: any) {
  await prisma.$executeRaw`
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGEMENT', 'COURIER', 'BUSINESS', 'CUSTOMER_SERVICE');
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL');
    
    CREATE TABLE "User" (
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
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("approvedBy") REFERENCES "User"("id")
    );
  `
}

async function createUserPermissionTable(prisma: any) {
  await prisma.$executeRaw`
    CREATE TABLE "UserPermission" (
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
    
    CREATE INDEX "UserPermission_pageRoute_idx" ON "UserPermission"("pageRoute");
  `
}

async function createSystemPageTable(prisma: any) {
  await prisma.$executeRaw`
    CREATE TABLE "SystemPage" (
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
}

async function createSystemPages(prisma: any) {
  const defaultPages = [
    { route: '/admin', title: 'דף אדמין ראשי', category: 'ניהול', requiresRole: 'ADMIN' },
    { route: '/admin/lockers', title: 'ניהול לוקרים', category: 'ניהול', requiresRole: 'MANAGEMENT' },
    { route: '/admin/packages', title: 'ניהול חבילות', category: 'ניהול', requiresRole: 'MANAGEMENT' },
    { route: '/admin/settings', title: 'הגדרות', category: 'ניהול', requiresRole: 'ADMIN' },
    { route: '/admin/users', title: 'ניהול משתמשים', category: 'ניהול', requiresRole: 'ADMIN' },
    { route: '/courier', title: 'דף שליח ראשי', category: 'שליח', requiresRole: 'COURIER' },
    { route: '/business', title: 'דף עסק ראשי', category: 'עסק', requiresRole: 'BUSINESS' },
  ]

  for (const page of defaultPages) {
    await prisma.systemPage.create({
      data: {
        route: page.route,
        title: page.title,
        category: page.category,
        requiresRole: page.requiresRole as any || null,
        isActive: true,
      }
    })
  }
}
