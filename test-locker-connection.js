const WebSocket = require('ws');

// הגדרות
const SERVER_URL = 'ws://localhost:8080';
const LOCKER_ID = 'LOC123';

console.log('🧪 בדיקת חיבור לוקר ל-WebSocket');
console.log(`📡 מתחבר ל: ${SERVER_URL}`);
console.log(`🔧 מזהה לוקר: ${LOCKER_ID}`);

// יצירת חיבור WebSocket
const ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
  console.log('✅ חיבור WebSocket נוצר בהצלחה');
  
  // שליחת הודעת זיהוי
  const identifyMessage = {
    type: 'identify',
    client: 'locker',
    id: LOCKER_ID
  };
  
  console.log('📤 שולח הודעת זיהוי:', identifyMessage);
  ws.send(JSON.stringify(identifyMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 התקבלה הודעה מהשרת:', message);
    
    // אם זיהוי הצליח, שלח עדכון תאים
    if (message.type === 'identified') {
      console.log('🎉 זיהוי הצליח! שולח עדכון תאים...');
      
      const cellUpdate = {
        type: 'cellUpdate',
        cells: {
          '1': {
            locked: false,
            opened: false,
            hasPackage: false,
            packageId: null,
            lastUpdate: new Date()
          },
          '2': {
            locked: true,
            opened: false,
            hasPackage: true,
            packageId: 'PKG001',
            lastUpdate: new Date()
          },
          '3': {
            locked: false,
            opened: true,
            hasPackage: false,
            packageId: null,
            lastUpdate: new Date()
          }
        }
      };
      
      console.log('📤 שולח עדכון תאים:', cellUpdate);
      ws.send(JSON.stringify(cellUpdate));
    }
  } catch (error) {
    console.error('❌ שגיאה בעיבוד הודעה:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ שגיאת WebSocket:', error);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 חיבור נסגר. קוד: ${code}, סיבה: ${reason}`);
});

// סגירה אחרי 30 שניות
setTimeout(() => {
  console.log('⏰ סוגר חיבור אחרי 30 שניות');
  ws.close();
  process.exit(0);
}, 30000);

// טיפול בסגירה נאותה
process.on('SIGINT', () => {
  console.log('\n🛑 סוגר חיבור...');
  ws.close();
  process.exit(0);
}); 