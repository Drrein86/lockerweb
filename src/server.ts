// קובץ הפעלה אופציונלי להרצה לוקלית בלבד (לא נטען במהלך build ב-Vercel)
import wsManager from './lib/websocket-server';

if (process.env.NODE_ENV !== 'production') {
  console.log('🚀 מתחיל שרת WebSocket (development only)...');
  try {
    wsManager.start();
    console.log('✅ שרת WebSocket הופעל בהצלחה');
  } catch (error) {
    console.error('❌ שגיאה בהפעלת שרת WebSocket:', error);
  }
}