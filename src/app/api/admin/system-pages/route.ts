import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - קבלת כל דפי המערכת
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
    }

    // בדיקה אם יש דפים במסד הנתונים
    const existingPages = await prisma.systemPage.findMany()
    
    // אם אין דפים, ניצור אותם
    if (existingPages.length === 0) {
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
        { route: '/courier/history', title: 'היסטוריית משלוחים', category: 'שליח', requiresRole: 'COURIER' },
        
        // דפי לקוח
        { route: '/customer', title: 'דף לקוח ראשי', category: 'לקוח' },
        { route: '/customer/packages', title: 'החבילות שלי', category: 'לקוח' },
        { route: '/customer/track', title: 'מעקב חבילה', category: 'לקוח' },
        { route: '/customer/pickup', title: 'איסוף חבילה', category: 'לקוח' },
        { route: '/customer/qr', title: 'QR לאיסוף', category: 'לקוח' },
        { route: '/customer/history', title: 'היסטוריית חבילות', category: 'לקוח' },
        
        // דפי עסק
        { route: '/business', title: 'דף עסק ראשי', category: 'עסק', requiresRole: 'BUSINESS' },
        { route: '/business/send', title: 'שליחת חבילה', category: 'עסק', requiresRole: 'BUSINESS' },
        { route: '/business/packages', title: 'החבילות שלי', category: 'עסק', requiresRole: 'BUSINESS' },
        { route: '/business/analytics', title: 'אנליטיקה', category: 'עסק', requiresRole: 'BUSINESS' },
        { route: '/business/customers', title: 'לקוחות', category: 'עסק', requiresRole: 'BUSINESS' },
        { route: '/business/billing', title: 'חיובים', category: 'עסק', requiresRole: 'BUSINESS' },
        
        // דפי דמו
        { route: '/demo/locker', title: 'דמו לוקר', category: 'דמו' },
        { route: '/demo/package', title: 'דמו חבילה', category: 'דמו' },
        { route: '/demo/customer', title: 'דמו לקוח', category: 'דמו' },
        { route: '/demo/courier', title: 'דמו שליח', category: 'דמו' },
        { route: '/demo/business', title: 'דמו עסק', category: 'דמו' },
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
    }

    const pages = await prisma.systemPage.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' },
      ],
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('שגיאה בטעינת דפי מערכת:', error)
    return NextResponse.json({ error: 'שגיאה בטעינת דפי מערכת' }, { status: 500 })
  }
}

// POST - יצירת דף מערכת חדש (רק לאדמין)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
    }

    const { route, title, description, category, requiresRole } = await request.json()

    if (!route || !title || !category) {
      return NextResponse.json({ error: 'חסרים נתונים נדרשים' }, { status: 400 })
    }

    const page = await prisma.systemPage.create({
      data: {
        route,
        title,
        description,
        category,
        requiresRole: requiresRole || null,
        isActive: true,
      },
    })

    return NextResponse.json({ page })
  } catch (error) {
    console.error('שגיאה ביצירת דף מערכת:', error)
    return NextResponse.json({ error: 'שגיאה ביצירת דף מערכת' }, { status: 500 })
  }
}
