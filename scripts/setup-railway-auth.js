// סקריפט להגדרת מערכת האימות ב-Railway

const axios = require('axios')

async function setupRailwayAuth() {
  console.log('🚀 מגדיר מערכת אימות ב-Railway...')
  
  try {
    // URL של האפליקציה ב-Railway
    const railwayUrl = process.env.RAILWAY_URL || 'https://lockerweb-production.up.railway.app'
    
    console.log(`📡 יוצר קשר עם: ${railwayUrl}`)
    
    // יצירת משתמש אדמין
    const response = await axios.post(`${railwayUrl}/api/setup-admin`, {
      authorization: 'setup-admin-2025'
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Railway-Setup-Script'
      }
    })
    
    if (response.data.success) {
      console.log('✅ הגדרת אימות הושלמה בהצלחה!')
      console.log('👤 פרטי אדמין:', response.data.admin)
      console.log('')
      console.log('🔑 פרטי התחברות:')
      console.log('📧 מייל: elior2280@gmail.com')
      console.log('🔒 סיסמא: 123')
      console.log('')
      console.log(`🌐 קישור להתחברות: ${railwayUrl}/auth/signin`)
    } else {
      console.log('❌ שגיאה בהגדרה:', response.data.error)
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ שגיאה מהשרת:', error.response.data)
    } else if (error.request) {
      console.log('❌ לא הצלחתי להתחבר לשרת')
      console.log('💡 ודא שהאפליקציה פועלת ב-Railway')
    } else {
      console.log('❌ שגיאה:', error.message)
    }
  }
}

// בדיקה אם הסקריפט רץ ישירות
if (require.main === module) {
  setupRailwayAuth()
}

module.exports = { setupRailwayAuth }
