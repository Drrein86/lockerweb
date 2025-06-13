const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

// ייבוא מחלקת ESP32
const ESP32Controller = require('./esp32-wifi-integration');

// הגדרות סביבה
const PORT = process.env.PORT || 8080;
const USE_SSL = process.env.USE_SSL === 'true';
const SSL_KEY = process.env.SSL_KEY_PATH;
const SSL_CERT = process.env.SSL_CERT_PATH;

// מפת חיבורים של לוקרים
const lockerConnections = new Map();

// יצירת HTTP/HTTPS server עבור מידע על המערכת
let server;
if (USE_SSL && SSL_KEY && SSL_CERT) {
  const options = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT)
  };
  server = https.createServer(options, handleRequest);
  console.log('🔒 שרת HTTPS הופעל');
} else {
  server = http.createServer(handleRequest);
  console.log('ℹ️ שרת HTTP הופעל (ללא SSL)');
}

function handleRequest(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    message: 'מערכת לוקר חכם - שרת חומרה עם ESP32',
    status: 'פעיל',
    lockers: ESP32Controller.getAllStatus(),
    timestamp: new Date().toISOString()
  }, null, 2));
}

// WebSocket server עבור תקשורת עם האפליקציה והלוקרים
const wss = new WebSocket.Server({ server });

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
  setInterval(() => {
    logEvent('monitoring', '🔍 בדיקת חיבורי ESP32');
    
    const status = ESP32Controller.getAllStatus();
    let connectedDevices = 0;
    
    for (const [lockerId, device] of Object.entries(status)) {
      if (device.isOnline) {
        connectedDevices++;
        logEvent('device_status', `📡 לוקר ${lockerId} מחובר`, {
          lockerId,
          ip: device.ip,
          status: 'online'
        });
      } else {
        logEvent('device_status', `📡 לוקר ${lockerId} לא מגיב`, {
          lockerId,
          ip: device.ip,
          status: 'offline'
        });
      }
    }
    
    logEvent('monitoring_summary', `📊 סה"כ לוקרים מחוברים`, {
      connectedDevices,
      totalDevices: Object.keys(status).length
    });
  }, 60000); // כל דקה
}

// טיפול בחיבורי WebSocket
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🔌 לקוח חדש התחבר: ${clientIp}`);
  
  // טיפול בהודעות מהלקוח
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 הודעה התקבלה:', data);
      
      switch (data.type) {
        case 'register':
          // רישום ESP32 חדש
          ESP32Controller.registerESP32(data.id, ws);
          ws.send(JSON.stringify({
            type: 'registerResponse',
            success: true,
            message: 'נרשם בהצלחה',
            timestamp: Date.now()
          }));
          break;
          
        case 'unlock':
          // פתיחת תא
          const unlockSuccess = await ESP32Controller.unlockCell(data.lockerId, data.cellId);
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            success: unlockSuccess,
            lockerId: data.lockerId,
            cellId: data.cellId,
            timestamp: Date.now()
          }));
          break;
          
        case 'lock':
          // נעילת תא
          const lockSuccess = await ESP32Controller.lockCell(data.lockerId, data.cellId, data.packageId);
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
          // קבלת סטטוס כל הלוקרים
          ws.send(JSON.stringify({
            type: 'statusResponse',
            data: ESP32Controller.getAllStatus(),
            timestamp: Date.now()
          }));
          break;
          
        case 'pong':
          // תגובה לבדיקת חיבור
          console.log(`📶 התקבל pong מלוקר ${data.id}`);
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
    // הסרת החיבור מהמפה אם זה ESP32
    for (const [lockerId, lockerWs] of lockerConnections.entries()) {
      if (lockerWs === ws) {
        lockerConnections.delete(lockerId);
        console.log(`📡 ESP32 ${lockerId} התנתק`);
        break;
      }
    }
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
server.listen(PORT, () => {
  const esp32_devices = [
    process.env.ESP32_LOCKER1_IP || '192.168.0.104',
    process.env.ESP32_LOCKER2_IP || '192.168.0.105'
  ];
  
  logEvent('server_start', `🚀 שרת הלוקרים פועל על פורט ${PORT}`, {
    port: PORT,
    ssl: USE_SSL,
    esp32_devices
  });
  startESP32Monitoring();
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

// שיפור הלוגים
function logEvent(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    type,
    message,
    ...data
  }));
} 