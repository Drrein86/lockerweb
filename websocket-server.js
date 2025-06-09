const WebSocket = require('ws');

// יצירת שרת WebSocket
const wss = new WebSocket.Server({ port: 8081 });

// מפה של חיבורים פעילים
const activeConnections = new Map();

console.log('🔗 שרת WebSocket פועל על פורט 8081');
console.log('📡 ממתין לחיבורי לוקרים...');

wss.on('connection', function connection(ws, req) {
  console.log('🔌 התחבר לוקר חדש');

  ws.on('message', function message(data) {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 הודעה התקבלה:', message);

      if (message.type === 'register' && message.lockerId) {
        const lockerId = parseInt(message.lockerId);
        activeConnections.set(lockerId, ws);
        
        console.log(`✅ לוקר ${lockerId} נרשם בהצלחה`);
        
        // שליחת אישור רישום
        ws.send(JSON.stringify({
          type: 'registered',
          lockerId,
          status: 'success',
          timestamp: new Date().toISOString()
        }));
      }
      
      // הדהוד הודעות אחרות
      else {
        ws.send(JSON.stringify({
          type: 'echo',
          originalMessage: message,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ שגיאה בעיבוד הודעה:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'שגיאה בעיבוד הודעה',
        timestamp: new Date().toISOString()
      }));
    }
  });

  ws.on('close', function close() {
    // הסרת החיבור מהמפה
    for (const [lockerId, connection] of activeConnections.entries()) {
      if (connection === ws) {
        activeConnections.delete(lockerId);
        console.log(`🔌 לוקר ${lockerId} התנתק`);
        break;
      }
    }
  });

  ws.on('error', function error(err) {
    console.error('❌ שגיאת WebSocket:', err);
  });

  // שליחת הודעת ברוכים הבאים
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'ברוכים הבאים למערכת הלוקרים החכמים',
    timestamp: new Date().toISOString()
  }));
});

// פונקציה לשליחת פקודת פתיחה
function openLockerCell(lockerId, cellCode) {
  const connection = activeConnections.get(lockerId);
  
  if (!connection || connection.readyState !== WebSocket.OPEN) {
    console.error(`❌ לוקר ${lockerId} לא מחובר`);
    return false;
  }

  try {
    const command = {
      type: 'open_cell',
      action: 'open',
      cell: cellCode,
      timestamp: new Date().toISOString()
    };

    connection.send(JSON.stringify(command));
    console.log(`🔓 נשלחה פקודת פתיחה ללוקר ${lockerId}, תא ${cellCode}`);
    return true;
    
  } catch (error) {
    console.error('❌ שגיאה בשליחת פקודה:', error);
    return false;
  }
}

// פונקציה להצגת סטטוס
function showStatus() {
  console.log('\n📊 סטטוס שרת WebSocket:');
  console.log(`🔗 לוקרים מחוברים: ${activeConnections.size}`);
  
  if (activeConnections.size > 0) {
    console.log('📋 רשימת לוקרים מחוברים:');
    for (const lockerId of activeConnections.keys()) {
      console.log(`   - לוקר ${lockerId}`);
    }
  }
  console.log('');
}

// הצגת סטטוס כל 30 שניות
setInterval(showStatus, 30000);

// טיפול בסגירת השרת
process.on('SIGINT', () => {
  console.log('\n🛑 סוגר שרת WebSocket...');
  wss.close(() => {
    console.log('✅ שרת WebSocket נסגר');
    process.exit(0);
  });
});

// ייצוא פונקציות לשימוש חיצוני
module.exports = {
  openLockerCell,
  getConnectedLockers: () => Array.from(activeConnections.keys()),
  isLockerConnected: (lockerId) => {
    const connection = activeConnections.get(lockerId);
    return connection !== undefined && connection.readyState === WebSocket.OPEN;
  }
}; 