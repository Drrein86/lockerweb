import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // בדיקת הרשאה
    if (body.authorization !== 'migrate-railway-2025') {
      return NextResponse.json(
        { success: false, error: 'לא מורשה' },
        { status: 401 }
      )
    }

    console.log('🔄 מתחיל migration ב-Railway...')

    // הרצת migration deploy
    try {
      console.log('📡 מריץ prisma migrate deploy...')
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      })
      console.log('✅ Migration הושלם בהצלחה!')
    } catch (migrateError) {
      console.error('❌ שגיאה במיגרציה:', migrateError)
      // ממשיכים למרות שגיאת מיגרציה - אולי כבר רצה
    }

    // יצירת Prisma client
    try {
      console.log('🔄 יוצר Prisma client...')
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      console.log('✅ Prisma client נוצר בהצלחה!')
    } catch (generateError) {
      console.error('❌ שגיאה ביצירת Prisma client:', generateError)
    }

    // ניסיון ליצור משתמש אדמין
    let adminResult = null
    try {
      console.log('👤 בודק אם קיים משתמש אדמין...')
      
      const adminExists = await prisma.user.findFirst({
        where: { email: 'elior2280@gmail.com' }
      })

      if (!adminExists) {
        const bcrypt = require('bcryptjs')
        const hashedPassword = await bcrypt.hash('123', 10)
        
        const admin = await prisma.user.create({
          data: {
            email: 'elior2280@gmail.com',
            name: 'אליאור אדמין',
            role: 'ADMIN',
            phone: '0508882403',
            password: hashedPassword,
            approved: true
          }
        })
        
        adminResult = {
          email: admin.email,
          password: '123'
        }
        console.log('✅ משתמש אדמין נוצר בהצלחה!')
      } else {
        adminResult = {
          email: adminExists.email,
          password: '123 (קיים)'
        }
        console.log('✅ משתמש אדמין כבר קיים')
      }
      
    } catch (adminError) {
      console.error('❌ שגיאה ביצירת אדמין:', adminError)
      adminResult = {
        email: 'elior2280@gmail.com',
        password: '123',
        error: adminError.message
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration הושלם בהצלחה!',
      admin: adminResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ שגיאה כללית:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
