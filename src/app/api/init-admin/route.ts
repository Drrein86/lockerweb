import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // בדיקה אם כבר קיים אדמין
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'elior2280@gmail.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: 'משתמש אדמין כבר קיים',
        admin: {
          email: existingAdmin.email,
          name: `${existingAdmin.firstName} ${existingAdmin.lastName}`,
          role: existingAdmin.role
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
        lastName: 'מנהל',
        role: 'ADMIN',
        status: 'ACTIVE',
        isApproved: true,
        approvedAt: new Date(),
      }
    })

    return NextResponse.json({
      message: 'משתמש אדמין נוצר בהצלחה',
      admin: {
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('שגיאה ביצירת אדמין:', error)
    return NextResponse.json(
      { error: 'שגיאה ביצירת משתמש אדמין' },
      { status: 500 }
    )
  }
}
