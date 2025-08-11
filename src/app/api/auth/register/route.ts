import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, role } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'כל השדות נדרשים' },
        { status: 400 }
      )
    }

    // בדיקת תקינות מייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'כתובת מייל לא תקינה' },
        { status: 400 }
      )
    }

    // בדיקת אורך סיסמא (מינימום בפיתוח)
    if (password.length < 3) {
      return NextResponse.json(
        { error: 'סיסמא קצרה מדי (מינימום 3 תווים)' },
        { status: 400 }
      )
    }

    const result = await registerUser({
      email,
      password,
      firstName,
      lastName,
      role
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'המשתמש נוצר בהצלחה וממתין לאישור',
      user: result.user
    })
  } catch (error) {
    console.error('שגיאה בהרשמה:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
}
