const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

// רווח רנדומלי לצורך טריגר דיפלוי

// ייבוא מחלקת ESP32
const ESP32Controller = require('./esp32-wifi-integration');

// הגדרות סביבה
const PORT = process.env.PORT || 3002;
const USE_SSL = process.env.USE_SSL === 'true';
const SSL_KEY = process.env.SSL_KEY_PATH;
const SSL_CERT = process.env.SSL_CERT_PATH;
const ADMIN_SECRET = process.env.ADMIN_SECRET || '86428642';

// מפת חיבורים של לוקרים
const lockerConnections = new Map();
// מפת חיבורים של ממשקי ניהול
const adminConnections = new Set();

// רשימת לוקרים שמזוהים כעת
const registeredLockers = new Map();

// הגדרות לוקרים ברירת מחדל
const defaultLockers = [
  {
    id: 1,
    name: 'לוקר ראשי',
    location: 'כניסה ראשית',
    ip: '192.168.0.104',
    port: 80,
    deviceId: 'ESP32_001',
    cells: {
      1: { size: 'SMALL', locked: true, hasPackage: false, packageId: null },
      2: { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null },
      3: { size: 'LARGE', locked: true, hasPackage: false, packageId: null }
    }
  },
  {
    id: 2,
    name: 'לוקר משני',
    location: 'חדר דואר',
    ip: '192.168.0.105',
    port: 80,
    deviceId: 'ESP32_002',
    cells: {
      1: { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null },
      2: { size: 'LARGE', locked: true, hasPackage: false, packageId: null }
    }
  }
];

// אתחול לוקרים ברירת מחדל
defaultLockers.forEach(locker => {
  registeredLockers.set(locker.id, locker);
});

// מפת בקשות ממתינות לתגובה מה-ESP32
const pendingRequests = new Map();

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

// פונקציה לשליחת פקודה ללוקר עם המתנה לתגובה
function sendToLockerWithResponse(id, messageObj, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const conn = lockerConnections.get(id);
    if (!conn || conn.readyState !== WebSocket.OPEN) {
      console.log(`🚫 לוקר ${id} לא מחובר`);
      resolve({ success: false, message: `לוקר ${id} לא מחובר` });
      return;
    }

    // יצירת מזהה יחודי לבקשה
    const requestId = `${id}_${messageObj.type}_${Date.now()}`;
    
    // שמירת הבקשה במפה
    pendingRequests.set(requestId, {
      resolve,
      lockerId: id,
      messageObj,
      timestamp: Date.now()
    });
    
    // הוספת מזהה בקשה להודעה
    messageObj.requestId = requestId;
    
    // שליחת ההודעה
    conn.send(JSON.stringify(messageObj));
    console.log(`📤 נשלחה פקודה ללוקר ${id} עם מזהה ${requestId}`);
    
    // טיימאאוט - אם לא מגיעה תגובה בזמן
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        console.log(`⏰ תם הזמן לתגובה מלוקר ${id}`);
        resolve({ 
          success: false, 
          message: `תם הזמן לתגובה מלוקר ${id}`,
          timeout: true 
        });
      }
    }, timeoutMs);
  });
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
  // הגדרת CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // טיפול ב-OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // טיפול ב-POST לפתיחת תא
  if (req.method === 'POST' && req.url === '/api/unlock') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('📡 בקשת פתיחת תא מ-Vercel:', data);
        
        const { type, id, cell } = data;
        
        if (type === 'unlock' && id && cell) {
          // שליחת פקודת פתיחה ללוקר דרך WebSocket עם המתנה לתגובה
          const result = await sendToLockerWithResponse(id, {
            type: 'unlock',
            cell: cell
          });
          
          if (result.success) {
            console.log(`✅ תא ${cell} נפתח בלוקר ${id}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: true,
              message: `תא ${cell} נפתח בהצלחה בלוקר ${id}`,
              lockerId: id,
              cellId: cell,
              simulated: false
            }));
          } else {
            console.log(`❌ כשל בפתיחת תא ${cell} בלוקר ${id}: ${result.message}`);
            res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: false,
              message: result.message || `לוקר ${id} לא מחובר למערכת`,
              lockerId: id,
              cellId: cell,
              simulated: true
            }));
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            message: 'חסרים פרמטרים נדרשים (type, id, cell)',
            required: ['type', 'id', 'cell'],
            received: data
          }));
        }
      } catch (error) {
        console.error('❌ שגיאה בעיבוד בקשת פתיחה:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          message: 'שגיאה בשרת',
          error: error.message
        }));
      }
    });
    return;
  }

  // תגובה רגילה לבקשות GET אחרות
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    message: 'מערכת לוקר חכם - שרת חומרה עם ESP32',
    status: 'פעיל',
    lockers: getLockerStates(),
    timestamp: new Date().toISOString(),
    endpoints: {
      '/': 'מידע כללי על השרת',
      '/api/unlock': 'POST - פתיחת תא (type, id, cell)'
    }
  }, null, 2));
}

// WebSocket server עבור תקשורת עם האפליקציה והלוקרים
const wss = new WebSocket.Server({ server });

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
          // טיפול בפינג - החזרת פונג עם אותו ID אם קיים
          const pongResponse = {
            type: 'pong',
            ...(data.id && { id: data.id })
          };
          ws.send(JSON.stringify(pongResponse));
          console.log(`🏓 פינג התקבל מ-${lockerId || 'unknown'}, נשלח פונג:`, pongResponse);
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

        case 'unlockResponse':
        case 'lockResponse':
          // טיפול בתגובות מה-ESP32
          if (lockerId && data.requestId) {
            console.log(`📥 התקבלה תגובה מלוקר ${lockerId}:`, data);
            
            // חיפוש הבקשה הממתינה
            const pendingRequest = pendingRequests.get(data.requestId);
            if (pendingRequest) {
              pendingRequests.delete(data.requestId);
              
              // שליחת התגובה למי שממתין
              pendingRequest.resolve({
                success: data.success || false,
                message: data.success ? 
                  `תא ${data.cellId} ${data.type === 'unlockResponse' ? 'נפתח' : 'ננעל'} בהצלחה` :
                  `כשל ב${data.type === 'unlockResponse' ? 'פתיחת' : 'נעילת'} תא ${data.cellId}`,
                cellId: data.cellId,
                lockerId: data.lockerId,
                esp32Response: data
              });
              
              console.log(`✅ תגובה עובדה לבקשה ${data.requestId}`);
            } else {
              console.log(`⚠️ לא נמצאה בקשה ממתינה למזהה ${data.requestId}`);
            }
          } else {
            console.log(`⚠️ תגובה מלוקר ללא מזהה בקשה:`, data);
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