import wsManager from './lib/websocket-server';

console.log('🚀 מתחיל שרת WebSocket...');

// הפעלת השרת
try {
  wsManager.start();
  console.log('✅ שרת WebSocket הופעל בהצלחה');
} catch (error) {
  console.error('❌ שגיאה בהפעלת שרת WebSocket:', error);
  process.exit(1);
} 