// קובץ הפעלה אופציונלי להרצה לוקלית בלבד
// לא נטען במהלך build ב-Vercel

console.log('🚀 מתחיל שרת WebSocket...');

// הפעלת השרת רק בסביבת development
if (process.env.NODE_ENV === 'development') {
  try {
    const wsManager = require('./lib/websocket-server').default;
    wsManager.start();
    console.log('✅ שרת WebSocket הופעל בהצלחה');
  } catch (error) {
    console.error('❌ שגיאה בהפעלת שרת WebSocket:', error);
  }
} else {
  console.log('ℹ️ שרת WebSocket לא מופעל בסביבת production');
} 