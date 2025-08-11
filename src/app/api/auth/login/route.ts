import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'מייל וסיסמא נדרשים' },
        { status: 400 }
      )
    }

    const result = await loginUser(email, password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // יצירת response עם cookie
    const response = NextResponse.json({
      success: true,
      user: result.user
    })

    // הגדרת JWT בתור cookie
    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 ימים
      path: '/',
    })

    return response
  } catch (error) {
    console.error('שגיאה בהתחברות:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
}
