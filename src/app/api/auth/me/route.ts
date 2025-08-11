import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'טוקן לא תקין' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        isApproved: user.isApproved,
        permissions: user.permissions
      }
    })
  } catch (error) {
    console.error('שגיאה בקבלת פרטי משתמש:', error)
    return NextResponse.json(
      { error: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
}
