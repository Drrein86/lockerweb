const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

// רווח רנדומלי לצורך טריגר דיפלוי

// ייבוא מחלקת ESP32
const ESP32Controller = require('./esp32-wifi-integration');

// הגדרות סביבה
const PORT = process.env.PORT || 3000;
const USE_SSL = process.env.USE_SSL === 'true';
const SSL_KEY = process.env.SSL_KEY_PATH;
const SSL_CERT = process.env.SSL_CERT_PATH;
const ADMIN_SECRET = process.env.ADMIN_SECRET || '86428642';

// מפת חיבורים של לוקרים
const lockerConnections = new Map();
// מפת חיבורים של ממשקי ניהול
const adminConnections = new Set();

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
    lockers: getLockerStates(),
    timestamp: new Date().toISOString()
  }, null, 2));
}

// WebSocket server עבור תקשורת עם האפליקציה והלוקרים
const wss = new WebSocket.Server({ server });

// פונקציה לשליחת הודעה ללוקר ספציפי
function sendToLocker(id, messageObj) {
  const conn = lockerConnections.get(id);
  if (conn && conn.readyState === WebSocket.OPEN) {
    conn.send(JSON.stringify(messageObj));
    return true;
  } else {
    console.log(`🚫 לוקר ${id} לא מחובר`);
    return false;
  }
}

// פונקציה לשליחת עדכון סטטוס לכל ממשקי הניהול
function broadcastStatus() {
  const message = {
    type: 'lockerUpdate',
    data: {
      message: 'מערכת לוקר חכם - שרת חומרה עם ESP32',
      status: 'פעיל',
      lockers: getLockerStates(),
      timestamp: Date.now()
    },
    timestamp: Date.now()
  };
  
  adminConnections.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// סטטוס לוקרים
function getLockerStates() {
  const states = {};
  
  // מיפוי כל הלוקרים המחוברים
  lockerConnections.forEach((ws, id) => {
    states[id] = {
      isOnline: ws.readyState === WebSocket.OPEN,
      lastSeen: ws.lastSeen || new Date(),
      cells: ws.cells || {}
    };
  });
  
  return states;
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

// טיפול בחיבור חדש
wss.on('connection', (ws, req) => {
  console.log('🔌 חיבור חדש התקבל');
  let isAdmin = false;
  let lockerId = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 התקבלה הודעה:', data);

      // טיפול בהודעת זיהוי
      if (data.type === 'identify') {
        if (data.client === 'web-admin') {
          if (data.secret === ADMIN_SECRET) {
            console.log('✅ ממשק ניהול לוקרים מזוהה התחבר');
            isAdmin = true;
            adminConnections.add(ws);
            ws.send(JSON.stringify({
              type: 'authSuccess',
              message: 'התחברת בהצלחה כמנהל'
            }));
            // שליחת סטטוס נוכחי
            broadcastStatus();
          } else {
            console.log('❌ ניסיון התחברות כמנהל נכשל - סיסמה שגויה');
            ws.send(JSON.stringify({
              type: 'error',
              message: 'סיסמת מנהל שגויה'
            }));
            ws.close();
          }
        } else if (data.client === 'locker') {
          // טיפול בזיהוי לוקר
          if (!data.id) {
            console.log('❌ לוקר ניסה להתחבר ללא ID');
            ws.send(JSON.stringify({
              type: 'error',
              message: 'חסר מזהה לוקר (ID)'
            }));
            return; // לא מנתקים, רק שולחים שגיאה
          }

          // בדיקה שה-ID מורשה (מתחיל ב-LOC)
          if (!data.id.startsWith('LOC')) {
            console.log(`❌ לוקר ${data.id} לא מורשה`);
            ws.send(JSON.stringify({
              type: 'error',
              message: `לוקר ${data.id} לא מורשה במערכת`
            }));
            ws.close();
            return;
          }

          // רישום הלוקר
          lockerId = data.id;
          lockerConnections.set(lockerId, ws);
          ws.lastSeen = new Date();
          ws.cells = data.cells || {};
          
          // לוג הצלחה
          console.log(`✅ Locker identified: ${data.id}`);
          console.log(`📡 נרשם לוקר ${lockerId}`);
          
          // שליחת אישור ללוקר
          ws.send(JSON.stringify({
            type: 'identified',
            message: `לוקר ${lockerId} זוהה בהצלחה`,
            lockerId: lockerId
          }));
          
          // עדכון כל הממשקים
          broadcastStatus();
        }
        return;
      }

      // טיפול בהודעת רישום לוקר
      if (data.type === 'register') {
        if (data.id && data.id.startsWith('LOC')) {
          lockerId = data.id;
          lockerConnections.set(lockerId, ws);
          ws.lastSeen = new Date();
          ws.cells = data.cells || {};
          ws.ip = data.ip;
          console.log(`📡 נרשם לוקר ${lockerId} מכתובת ${data.ip}`);
          
          // שליחת אישור רישום ללוקר
          ws.send(JSON.stringify({
            type: 'registerSuccess',
            message: `נרשמת בהצלחה כלוקר ${lockerId}`
          }));
          
          // עדכון כל הממשקים
          broadcastStatus();
          return;
        }
      }

      // בדיקת הרשאות לפני ביצוע פעולות אחרות
      if (!isAdmin && !lockerId) {
        console.log('❌ ניסיון גישה ללא הרשאות');
        ws.send(JSON.stringify({
          type: 'error',
          message: 'אין הרשאות מתאימות'
        }));
        return;
      }

      // טיפול בפקודות אחרות
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'unlock':
          if (isAdmin) {
            const success = await unlockCell(data.lockerId, data.cellId);
            ws.send(JSON.stringify({
              type: 'unlockResponse',
              success,
              cellId: data.cellId
            }));
          }
          break;

        case 'lock':
          if (isAdmin) {
            const success = await lockCell(data.lockerId, data.cellId, data.packageId);
            ws.send(JSON.stringify({
              type: 'lockResponse',
              success,
              cellId: data.cellId
            }));
          }
          break;

        case 'statusUpdate':
          if (lockerId) {
            ws.cells = data.cells || {};
            ws.lastSeen = new Date();
            console.log(`🔄 עודכן סטטוס לוקר ${lockerId}`);
            broadcastStatus();
          }
          break;

        case 'cellUpdate':
          if (lockerId) {
            ws.cells = data.cells || {};
            ws.lastSeen = new Date();
            console.log(`🔄 עודכנו תאים בלוקר ${lockerId}`, { 
              cellCount: Object.keys(data.cells || {}).length 
            });
            broadcastStatus();
          }
          break;
      }
    } catch (error) {
      console.error('❌ שגיאה בעיבוד הודעה:', error);
    }
  });

  ws.on('close', () => {
    if (isAdmin) {
      adminConnections.delete(ws);
      console.log('👤 ממשק ניהול לוקרים התנתק');
    } else if (lockerId) {
      lockerConnections.delete(lockerId);
      console.log(`🔌 נותק לוקר ${lockerId}`);
      broadcastStatus();
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ שגיאת WebSocket:', error);
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

// trigger - שינוי יזום לצורך דיפלוי 