import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔍 בדיקת חיבור ל-Railway DB...')
    console.log('📋 DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('📋 DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 20) + '...')
    
    // בדיקת חיבור פשוטה
    await prisma.$connect()
    console.log('✅ חיבור ל-Prisma הצליח')
    
    // בדיקת query פשוטה
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query פשוט הצליח:', result)
    
    // בדיקת טבלאות
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('✅ טבלאות זמינות:', tables)
    
    return NextResponse.json({
      success: true,
      message: 'חיבור ל-Railway DB עובד',
      hasDatabase: !!process.env.DATABASE_URL,
      databasePreview: process.env.DATABASE_URL?.substring(0, 20) + '...',
      tablesCount: Array.isArray(tables) ? tables.length : 0,
      tables: tables,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ שגיאה בחיבור ל-Railway DB:', error)
    
    return NextResponse.json({
      success: false,
      error: 'שגיאה בחיבור ל-Railway DB',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      hasDatabase: !!process.env.DATABASE_URL,
      databasePreview: process.env.DATABASE_URL?.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
