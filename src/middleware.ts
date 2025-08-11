import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const token = req.cookies.get('auth-token')?.value

  // דפים שלא דורשים אימות
  const publicPaths = [
    '/',
    '/auth/signin',
    '/auth/register',
    '/auth/error',
    '/customer',
    '/customer/packages',
    '/customer/track',
    '/customer/pickup',
    '/customer/qr',
    '/customer/history',
    '/demo/locker',
    '/demo/package',
    '/demo/customer',
    '/demo/courier',
    '/demo/business',
  ]

  // בדיקה אם זה נתיב ציבורי
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // אם אין טוקן, הפניה לדף התחברות
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // קבלת פרטי המשתמש מהטוקן
  const user = await getUserFromToken(token)
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // אם המשתמש לא אושר, חסימה
  if (user.status !== 'ACTIVE' as any && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/auth/pending-approval', req.url))
  }

  // בדיקת גישה לדפי אדמין
  if (pathname.startsWith('/admin')) {
    if (user.role === 'ADMIN') {
      return NextResponse.next()
    }
    
    if ((user.role as any) === 'MANAGEMENT') {
      const allowedPaths = ['/admin/lockers', '/admin/packages', '/admin/reports']
      const hasAccess = allowedPaths.some(path => pathname.startsWith(path))
      if (!hasAccess) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    } else {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // בדיקת גישה לדפי שליח
  if (pathname.startsWith('/courier')) {
    if (user.role !== 'COURIER' && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // בדיקת גישה לדפי עסק
  if (pathname.startsWith('/business')) {
    if (user.role !== 'BUSINESS' && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
