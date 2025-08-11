import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// API endpoint ליצירת משתמש אדמין ראשוני ב-Railway
export async function POST(request: NextRequest) {
  try {
    // בדיקת authorization - רק ב-Railway או עם secret key
    const { authorization } = await request.json()
    const isRailwayRequest = request.headers.get('host')?.includes('railway.app') || 
                            request.headers.get('host')?.includes('lockerweb')
    
    if (!isRailwayRequest && authorization !== 'setup-admin-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // בדיקה אם כבר קיים אדמין
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'elior2280@gmail.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'משתמש אדמין כבר קיים ב-Railway',
        admin: {
          email: existingAdmin.email,
          name: `${existingAdmin.firstName} ${existingAdmin.lastName}`,
          role: existingAdmin.role,
          isApproved: existingAdmin.isApproved
        }
      })
    }

    // יצירת סיסמא מוצפנת
    const hashedPassword = await hashPassword('123')

    // יצירת משתמש אדמין
    const admin = await prisma.user.create({
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

    // יצירת דפי מערכת אוטומטית
    await createSystemPages()

    return NextResponse.json({
      success: true,
      message: 'משתמש אדמין נוצר בהצלחה ב-Railway',
      admin: {
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
        role: admin.role,
        id: admin.id
      }
    })
  } catch (error) {
    console.error('שגיאה ביצירת אדמין ב-Railway:', error)
    return NextResponse.json(
      { 
        error: 'שגיאה ביצירת משתמש אדמין',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// יצירת דפי מערכת אוטומטית
async function createSystemPages() {
  try {
    const existingPages = await prisma.systemPage.count()
    if (existingPages > 0) {
      return // כבר קיימים דפים
    }

    const defaultPages = [
      // דפי ניהול
      { route: '/admin', title: 'דף אדמין ראשי', category: 'ניהול', requiresRole: 'ADMIN' },
      { route: '/admin/lockers', title: 'ניהול לוקרים', category: 'ניהול', requiresRole: 'MANAGEMENT' },
      { route: '/admin/packages', title: 'ניהול חבילות', category: 'ניהול', requiresRole: 'MANAGEMENT' },
      { route: '/admin/settings', title: 'הגדרות', category: 'ניהול', requiresRole: 'ADMIN' },
      { route: '/admin/logs', title: 'לוגים', category: 'ניהול', requiresRole: 'ADMIN' },
      { route: '/admin/reports', title: 'דוחות', category: 'ניהול', requiresRole: 'MANAGEMENT' },
      { route: '/admin/users', title: 'ניהול משתמשים', category: 'ניהול', requiresRole: 'ADMIN' },
      
      // דפי שליח
      { route: '/courier', title: 'דף שליח ראשי', category: 'שליח', requiresRole: 'COURIER' },
      { route: '/courier/deliveries', title: 'המשלוחים שלי', category: 'שליח', requiresRole: 'COURIER' },
      { route: '/courier/pickup', title: 'איסוף חבילות', category: 'שליח', requiresRole: 'COURIER' },
      { route: '/courier/delivery', title: 'מסירת חבילות', category: 'שליח', requiresRole: 'COURIER' },
      { route: '/courier/scan', title: 'סריקת QR', category: 'שליח', requiresRole: 'COURIER' },
      
      // דפי עסק
      { route: '/business', title: 'דף עסק ראשי', category: 'עסק', requiresRole: 'BUSINESS' },
      { route: '/business/send', title: 'שליחת חבילה', category: 'עסק', requiresRole: 'BUSINESS' },
      { route: '/business/packages', title: 'החבילות שלי', category: 'עסק', requiresRole: 'BUSINESS' },
      { route: '/business/analytics', title: 'אנליטיקה', category: 'עסק', requiresRole: 'BUSINESS' },
    ]

    await prisma.systemPage.createMany({
      data: defaultPages.map(page => ({
        route: page.route,
        title: page.title,
        category: page.category,
        requiresRole: page.requiresRole as any || null,
        isActive: true,
      })),
    })

    console.log('✅ דפי מערכת נוצרו בהצלחה')
  } catch (error) {
    console.error('שגיאה ביצירת דפי מערכת:', error)
  }
}
