// סקריפט להרצת migration ב-Railway

const { execSync } = require('child_process')

async function runRailwayMigration() {
  console.log('🚀 מריץ migration ב-Railway...')
  
  try {
    // הגדרת משתני סביבה לRailway
    process.env.NODE_ENV = 'production'
    
    console.log('📡 מתחבר ל-Railway database...')
    
    // הרצת migration
    console.log('🔄 מריץ prisma migrate deploy...')
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    console.log('✅ Migration הושלם בהצלחה!')
    
    // יצירת Prisma client
    console.log('🔄 יוצר Prisma client...')
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    console.log('✅ Prisma client נוצר בהצלחה!')
    
    // יצירת משתמש אדמין
    console.log('👤 יוצר משתמש אדמין...')
    const response = await fetch('https://lockerweb-production.up.railway.app/api/setup-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization: 'setup-admin-2025'
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ משתמש אדמין נוצר בהצלחה!')
      console.log('📧 מייל: elior2280@gmail.com')
      console.log('🔒 סיסמא: 123')
    } else {
      console.log('❌ שגיאה ביצירת אדמין:', result.error)
    }
    
  } catch (error) {
    console.error('❌ שגיאה במהלך התהליך:', error.message)
    process.exit(1)
  }
}

// בדיקה אם הסקריפט רץ ישירות
if (require.main === module) {
  runRailwayMigration()
}

module.exports = { runRailwayMigration }
