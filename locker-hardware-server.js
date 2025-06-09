const WebSocket = require('ws');
const http = require('http');

// יצירת HTTP server עבור מידע על המערכת
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    message: 'מערכת לוקר חכם - שרת חומרה',
    status: 'פעיל',
    lockers: lockerStates,
    timestamp: new Date().toISOString()
  }, null, 2));
});

// WebSocket server עבור תקשורת עם האפליקציה
const wss = new WebSocket.Server({ server });

// סטטוס לוקרים (דמוי - יש להחליף בקוד אמיתי לחומרה)
const lockerStates = {
  'LOC001': {
    cells: {
      'A1': { locked: true, hasPackage: true, packageId: 'PKG001' },
      'A2': { locked: false, hasPackage: false, packageId: null },
      'A3': { locked: true, hasPackage: true, packageId: 'PKG002' },
      'B1': { locked: false, hasPackage: false, packageId: null },
      'B2': { locked: true, hasPackage: true, packageId: 'PKG003' }
    }
  },
  'LOC002': {
    cells: {
      'A1': { locked: false, hasPackage: false, packageId: null },
      'A2': { locked: false, hasPackage: false, packageId: null },
      'B1': { locked: true, hasPackage: true, packageId: 'PKG004' }
    }
  }
};

// פונקציה לשליחת עדכון סטטוס לכל הלקוחות המחוברים
function broadcastStatus() {
  const message = {
    type: 'lockerUpdate',
    data: lockerStates,
    timestamp: Date.now()
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// פונקציה לפתיחת תא (יש להחליף בקוד אמיתי לחומרה)
function unlockCell(lockerId, cellId) {
  console.log(`🔓 פותח תא ${cellId} בלוקר ${lockerId}`);
  
  // כאן יש להוסיף קוד אמיתי לשליחת פקודה לחומרה
  // לדוגמה: GPIO פינים, Serial, I2C, וכו'
  
  // עדכון סטטוס
  if (lockerStates[lockerId] && lockerStates[lockerId].cells[cellId]) {
    lockerStates[lockerId].cells[cellId].locked = false;
    lockerStates[lockerId].cells[cellId].hasPackage = false;
    lockerStates[lockerId].cells[cellId].packageId = null;
    
    // שליחת עדכון לכל הלקוחות
    broadcastStatus();
    
    console.log(`✅ תא ${cellId} בלוקר ${lockerId} נפתח בהצלחה`);
    return true;
  }
  
  console.log(`❌ שגיאה: תא ${cellId} בלוקר ${lockerId} לא נמצא`);
  return false;
}

// פונקציה לנעילת תא (יש להחליף בקוד אמיתי לחומרה)
function lockCell(lockerId, cellId, packageId) {
  console.log(`🔒 נועל תא ${cellId} בלוקר ${lockerId} עם חבילה ${packageId}`);
  
  // כאן יש להוסיף קוד אמיתי לשליחת פקודה לחומרה
  
  // עדכון סטטוס
  if (lockerStates[lockerId] && lockerStates[lockerId].cells[cellId]) {
    lockerStates[lockerId].cells[cellId].locked = true;
    lockerStates[lockerId].cells[cellId].hasPackage = true;
    lockerStates[lockerId].cells[cellId].packageId = packageId;
    
    // שליחת עדכון לכל הלקוחות
    broadcastStatus();
    
    console.log(`✅ תא ${cellId} בלוקר ${lockerId} ננעל בהצלחה`);
    return true;
  }
  
  console.log(`❌ שגיאה: תא ${cellId} בלוקר ${lockerId} לא נמצא`);
  return false;
}

// טיפול בחיבורי WebSocket
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🔌 לקוח חדש התחבר: ${clientIp}`);
  
  // שליחת סטטוס נוכחי ללקוח החדש
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'מחובר למערכת הלוקר החכם',
    data: lockerStates,
    timestamp: Date.now()
  }));
  
  // טיפול בהודעות מהלקוח
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 הודעה התקבלה:', data);
      
      switch (data.type) {
        case 'unlock':
          const unlockSuccess = unlockCell(data.lockerId, data.cellId);
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            success: unlockSuccess,
            lockerId: data.lockerId,
            cellId: data.cellId,
            timestamp: Date.now()
          }));
          break;
          
        case 'lock':
          const lockSuccess = lockCell(data.lockerId, data.cellId, data.packageId);
          ws.send(JSON.stringify({
            type: 'lockResponse',
            success: lockSuccess,
            lockerId: data.lockerId, 
            cellId: data.cellId,
            packageId: data.packageId,
            timestamp: Date.now()
          }));
          break;
          
        case 'getStatus':
          ws.send(JSON.stringify({
            type: 'statusResponse',
            data: lockerStates,
            timestamp: Date.now()
          }));
          break;
          
        default:
          console.log('❓ סוג הודעה לא מוכר:', data.type);
      }
    } catch (error) {
      console.error('❌ שגיאה בעיבוד הודעה:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'שגיאה בעיבוד הבקשה',
        timestamp: Date.now()
      }));
    }
  });
  
  // טיפול בניתוק
  ws.on('close', () => {
    console.log(`🔌 לקוח התנתק: ${clientIp}`);
  });
  
  // טיפול בשגיאות
  ws.on('error', (error) => {
    console.error(`❌ שגיאת WebSocket עם ${clientIp}:`, error);
  });
});

// שליחת עדכון סטטוס אוטומטי כל 30 שניות
setInterval(() => {
  console.log('📊 שליחת עדכון סטטוס אוטומטי');
  broadcastStatus();
}, 30000);

// הפעלת השרת
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 שרת חומרה פועל על פורט ${PORT}`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
  console.log(`📊 מידע מערכת: http://localhost:${PORT}`);
  console.log('🔗 מחובר ומחכה לחיבורים מהאפליקציה...');
});

// טיפול בסגירה נאותה
process.on('SIGINT', () => {
  console.log('\n🛑 סוגר את השרת...');
  server.close(() => {
    console.log('✅ השרת נסגר בהצלחה');
    process.exit(0);
  });
});

// ייצוא לשימוש חיצוני
module.exports = { unlockCell, lockCell, lockerStates }; 