// סקריפט להרצת migration ב-Railway דרך API

const axios = require('axios')

async function runMigrationOnRailway() {
  console.log('🚀 מריץ migration ב-Railway דרך API...')
  
  try {
    const railwayUrl = 'https://lockerweb-production.up.railway.app'
    
    console.log(`📡 יוצר קשר עם: ${railwayUrl}/api/admin/migrate`)
    
    const response = await axios.post(`${railwayUrl}/api/admin/migrate`, {
      authorization: 'migrate-railway-2025'
    }, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Railway-Migration-Script'
      }
    })
    
    if (response.data.success) {
      console.log('✅ Migration הושלם בהצלחה ב-Railway!')
      console.log('')
      console.log('👤 פרטי אדמין:')
      console.log('📧 מייל:', response.data.admin.email)
      console.log('🔒 סיסמא:', response.data.admin.password)
      console.log('')
      console.log(`🌐 קישור להתחברות: ${railwayUrl}/auth/signin`)
      console.log('')
      console.log('🎉 המערכת מוכנה לשימוש!')
    } else {
      console.log('❌ שגיאה במיגרציה:', response.data.error)
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ שגיאה מהשרת:', error.response.data)
      console.log('📊 סטטוס:', error.response.status)
    } else if (error.request) {
      console.log('❌ לא הצלחתי להתחבר לשרת Railway')
      console.log('💡 ודא שהאפליקציה פועלת ב-Railway')
      console.log('🔗 נסה לגשת ל: https://lockerweb-production.up.railway.app')
    } else {
      console.log('❌ שגיאה:', error.message)
    }
  }
}

// בדיקה אם הסקריפט רץ ישירות
if (require.main === module) {
  runMigrationOnRailway()
}

module.exports = { runMigrationOnRailway }
