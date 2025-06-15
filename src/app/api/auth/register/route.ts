import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // בדיקת קלט
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'חסרים פרטי הרשמה' },
        { status: 400 }
      )
    }

    // בדיקה אם המשתמש כבר קיים
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'כתובת האימייל כבר קיימת במערכת' },
        { status: 400 }
      )
    }

    // הצפנת הסיסמה
    const hashedPassword = await bcrypt.hash(password, 10)

    // יצירת משתמש חדש
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER', // ברירת מחדל - לקוח
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('שגיאה בהרשמה:', error)
    return NextResponse.json(
      { error: 'שגיאת שרת' },
      { status: 500 }
    )
  }
} 