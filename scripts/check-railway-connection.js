// בדיקת חיבור ישיר ל-Railway DB

const { PrismaClient } = require('@prisma/client')

async function checkRailwayConnection() {
  console.log('🔍 בודק חיבור ישיר ל-Railway DB...')
  
  // חיבור ישיר עם URL של Railway
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:rPmoCrLwGpdnUrxpQHDCGGNboIHTJZJA@maglev.proxy.rlwy.net:49217/railway'
      }
    }
  })
  
  try {
    await prisma.$connect()
    console.log('✅ מחובר ל-Railway DB!')
    
    // בדיקת טבלאות קיימות
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    
    console.log('📊 טבלאות קיימות ב-Railway:')
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`)
    })
    
    // בדיקת משתמשים
    try {
      const userCount = await prisma.user.count()
      console.log(`👥 סה"כ משתמשים: ${userCount}`)
      
      if (userCount > 0) {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true
          }
        })
        
        console.log('👤 משתמשים במערכת:')
        users.forEach(user => {
          console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.status}`)
        })
      }
    } catch (error) {
      console.log('⚠️ טבלת User לא קיימת או ריקה')
    }
    
    // בדיקת דפי מערכת
    try {
      const pagesCount = await prisma.systemPage.count()
      console.log(`📄 סה"כ דפי מערכת: ${pagesCount}`)
    } catch (error) {
      console.log('⚠️ טבלת SystemPage לא קיימת')
    }
    
    console.log('')
    console.log('🎉 החיבור ל-Railway עובד!')
    
  } catch (error) {
    console.error('❌ שגיאה בחיבור ל-Railway:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRailwayConnection()
