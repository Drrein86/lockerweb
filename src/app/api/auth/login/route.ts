import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // בדיקת קלט
    if (!email || !password) {
      return NextResponse.json(
        { error: 'חסרים פרטי התחברות' },
        { status: 400 }
      )
    }

    // חיפוש המשתמש
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'משתמש לא נמצא' },
        { status: 401 }
      )
    }

    // בדיקת סיסמה
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'סיסמה שגויה' },
        { status: 401 }
      )
    }

    // יצירת טוקן
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // החזרת פרטי המשתמש והטוקן
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error('שגיאה בהתחברות:', error)
    return NextResponse.json(
      { error: 'שגיאת שרת' },
      { status: 500 }
    )
  }
} 