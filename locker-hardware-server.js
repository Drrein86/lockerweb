const WebSocket = require('ws');
const http = require('http');

// ייבוא מחלקת ESP32
const ESP32Controller = require('./esp32-wifi-integration');

// יצירת HTTP server עבור מידע על המערכת
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    message: 'מערכת לוקר חכם - שרת חומרה עם ESP32',
    status: 'פעיל',
    lockers: ESP32Controller.getAllStatus(),
    timestamp: new Date().toISOString()
  }, null, 2));
});

// WebSocket server עבור תקשורת עם האפליקציה
const wss = new WebSocket.Server({ server });

// רישום מכשירי ESP32 (יש לעדכן כתובות IP)
ESP32Controller.registerESP32('LOC001', '192.168.1.100', 80);
ESP32Controller.registerESP32('LOC002', '192.168.1.101', 80);

// סטטוס לוקרים (משולב עם ESP32)
function getLockerStates() {
  const esp32Status = ESP32Controller.getAllStatus();
  
  // אם אין מכשירי ESP32, החזר נתונים דמו
  if (Object.keys(esp32Status).length === 0) {
    return {
      'LOC001': {
        cells: {
          'A1': { locked: true, hasPackage: true, packageId: 'PKG001' },
          'A2': { locked: false, hasPackage: false, packageId: null },
          'A3': { locked: true, hasPackage: true, packageId: 'PKG002' },
          'B1': { locked: false, hasPackage: false, packageId: null },
          'B2': { locked: true, hasPackage: true, packageId: 'PKG003' }
        }
      }
    };
  }
  
  return esp32Status;
}

// פונקציה לשליחת עדכון סטטוס לכל הלקוחות המחוברים
function broadcastStatus() {
  const message = {
    type: 'lockerUpdate',
    data: getLockerStates(),
    timestamp: Date.now()
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// פונקציה לפתיחת תא (ESP32 או סימולציה)
async function unlockCell(lockerId, cellId) {
  console.log(`🔓 מנסה לפתוח תא ${cellId} בלוקר ${lockerId}`);
  
  try {
    // ניסיון פתיחה דרך ESP32
    const success = await ESP32Controller.unlockCell(lockerId, cellId);
    
    if (success) {
      console.log(`✅ תא ${cellId} נפתח בלוקר ${lockerId} (ESP32)`);
      
      // שליחת עדכון לכל הלקוחות
      broadcastStatus();
      
      return true;
    } else {
      console.log(`⚠️ ESP32 לא זמין, משתמש בסימולציה`);
      return unlockCellSimulation(lockerId, cellId);
    }
  } catch (error) {
    console.error(`❌ שגיאה בפתיחת תא ${cellId}:`, error);
    
    // fallback לסימולציה
    return unlockCellSimulation(lockerId, cellId);
  }
}

// פונקציה לנעילת תא (ESP32 או סימולציה)
async function lockCell(lockerId, cellId, packageId) {
  console.log(`🔒 מנסה לנעול תא ${cellId} בלוקר ${lockerId} עם חבילה ${packageId}`);
  
  try {
    // ניסיון נעילה דרך ESP32
    const success = await ESP32Controller.lockCell(lockerId, cellId, packageId);
    
    if (success) {
      console.log(`✅ תא ${cellId} ננעל בלוקר ${lockerId} (ESP32)`);
      
      // שליחת עדכון לכל הלקוחות
      broadcastStatus();
      
      return true;
    } else {
      console.log(`⚠️ ESP32 לא זמין, משתמש בסימולציה`);
      return lockCellSimulation(lockerId, cellId, packageId);
    }
  } catch (error) {
    console.error(`❌ שגיאה בנעילת תא ${cellId}:`, error);
    
    // fallback לסימולציה
    return lockCellSimulation(lockerId, cellId, packageId);
  }
}

// פונקציות סימולציה (לפיתוח ובדיקה)
function unlockCellSimulation(lockerId, cellId) {
  console.log(`🎭 סימולציה: פותח תא ${cellId} בלוקר ${lockerId}`);
  
  // עדכון סטטוס סימולציה
  const lockerStates = getLockerStates();
  if (lockerStates[lockerId] && lockerStates[lockerId].cells[cellId]) {
    lockerStates[lockerId].cells[cellId].locked = false;
    lockerStates[lockerId].cells[cellId].hasPackage = false;
    lockerStates[lockerId].cells[cellId].packageId = null;
    
    // שליחת עדכון לכל הלקוחות
    broadcastStatus();
    
    console.log(`✅ סימולציה: תא ${cellId} בלוקר ${lockerId} נפתח`);
    return true;
  }
  
  console.log(`❌ סימולציה: תא ${cellId} בלוקר ${lockerId} לא נמצא`);
  return false;
}

function lockCellSimulation(lockerId, cellId, packageId) {
  console.log(`🎭 סימולציה: נועל תא ${cellId} בלוקר ${lockerId} עם חבילה ${packageId}`);
  
  // עדכון סטטוס סימולציה
  const lockerStates = getLockerStates();
  if (lockerStates[lockerId] && lockerStates[lockerId].cells[cellId]) {
    lockerStates[lockerId].cells[cellId].locked = true;
    lockerStates[lockerId].cells[cellId].hasPackage = true;
    lockerStates[lockerId].cells[cellId].packageId = packageId;
    
    // שליחת עדכון לכל הלקוחות
    broadcastStatus();
    
    console.log(`✅ סימולציה: תא ${cellId} בלוקר ${lockerId} ננעל`);
    return true;
  }
  
  console.log(`❌ סימולציה: תא ${cellId} בלוקר ${lockerId} לא נמצא`);
  return false;
}

// מעקב אחר עדכוני ESP32
function startESP32Monitoring() {
  // בדיקה תקופתית של חיבורי ESP32
  setInterval(() => {
    console.log('🔍 בודק חיבורי ESP32...');
    
    const status = ESP32Controller.getAllStatus();
    let connectedDevices = 0;
    
    for (const [lockerId, device] of Object.entries(status)) {
      if (device.isOnline) {
        connectedDevices++;
        console.log(`📡 לוקר ${lockerId} מחובר (${device.ip})`);
      } else {
        console.log(`📡 לוקר ${lockerId} לא מגיב (${device.ip})`);
      }
    }
    
    console.log(`📊 סה"כ ${connectedDevices} לוקרים מחוברים`);
  }, 60000); // כל דקה
}

// טיפול בחיבורי WebSocket
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🔌 לקוח חדש התחבר: ${clientIp}`);
  
  // שליחת סטטוס נוכחי ללקוח החדש
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'מחובר למערכת הלוקר החכם (עם ESP32)',
    data: getLockerStates(),
    esp32Status: ESP32Controller.getAllStatus(),
    timestamp: Date.now()
  }));
  
  // טיפול בהודעות מהלקוח
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 הודעה התקבלה:', data);
      
      switch (data.type) {
        case 'unlock':
          const unlockSuccess = await unlockCell(data.lockerId, data.cellId);
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            success: unlockSuccess,
            lockerId: data.lockerId,
            cellId: data.cellId,
            method: unlockSuccess ? 'ESP32' : 'simulation',
            timestamp: Date.now()
          }));
          break;
          
        case 'lock':
          const lockSuccess = await lockCell(data.lockerId, data.cellId, data.packageId);
          ws.send(JSON.stringify({
            type: 'lockResponse',
            success: lockSuccess,
            lockerId: data.lockerId, 
            cellId: data.cellId,
            packageId: data.packageId,
            method: lockSuccess ? 'ESP32' : 'simulation',
            timestamp: Date.now()
          }));
          break;
          
        case 'getStatus':
          ws.send(JSON.stringify({
            type: 'statusResponse',
            data: getLockerStates(),
            esp32Status: ESP32Controller.getAllStatus(),
            timestamp: Date.now()
          }));
          break;
          
        case 'esp32Status':
          ws.send(JSON.stringify({
            type: 'esp32StatusResponse',
            data: ESP32Controller.getAllStatus(),
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

// התחלת מעקב ESP32
startESP32Monitoring();

// הפעלת השרת
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 שרת חומרה פועל על פורט ${PORT}`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
  console.log(`📊 מידע מערכת: http://localhost:${PORT}`);
  console.log('🔗 מחובר ומחכה לחיבורים מהאפליקציה...');
  console.log('📡 תמיכה במכשירי ESP32 דרך WiFi');
});

// טיפול בסגירה נאותה
process.on('SIGINT', () => {
  console.log('\n🛑 סוגר את השרת...');
  
  // הפסקת מעקב ESP32
  ESP32Controller.stopPeriodicHealthCheck();
  
  server.close(() => {
    console.log('✅ השרת נסגר בהצלחה');
    process.exit(0);
  });
});

// ייצוא לשימוש חיצוני
module.exports = { 
  unlockCell, 
  lockCell, 
  getLockerStates,
  ESP32Controller 
}; 