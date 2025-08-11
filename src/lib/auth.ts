import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

// הצפנת סיסמא
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// בדיקת סיסמא
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// יצירת JWT טוקן
export function createToken(userId: number, email: string, role: string): string {
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      iat: Date.now() / 1000 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// אימות JWT טוקן
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// התחברות משתמש
export async function loginUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { success: false, error: 'משתמש לא נמצא' }
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return { success: false, error: 'סיסמא שגויה' }
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, error: 'החשבון ממתין לאישור אדמין' }
    }

    // עדכון זמן כניסה אחרון
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    const token = createToken(user.id, user.email, user.role)

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    }
  } catch (error) {
    console.error('שגיאה בהתחברות:', error)
    return { success: false, error: 'שגיאה בהתחברות' }
  }
}

// הרשמת משתמש חדש
export async function registerUser(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
}) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      return { success: false, error: 'משתמש עם מייל זה כבר קיים' }
    }

    const hashedPassword = await hashPassword(userData.password)
    const isAdmin = userData.email === 'elior2280@gmail.com'

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: isAdmin ? 'ADMIN' : (userData.role as any) || 'MANAGEMENT',
        status: (isAdmin ? 'ACTIVE' : 'PENDING_APPROVAL') as any,
      }
    })

    return { success: true, user: { id: user.id, email: user.email } }
  } catch (error) {
    console.error('שגיאה בהרשמה:', error)
    return { success: false, error: 'שגיאה בהרשמה' }
  }
}

// קבלת משתמש מטוקן
export async function getUserFromToken(token: string) {
  try {
    const decoded = verifyToken(token) as any
    if (!decoded || !decoded.userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    return user
  } catch (error) {
    console.error('שגיאה בקבלת משתמש מטוקן:', error)
    return null
  }
}
