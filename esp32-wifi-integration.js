const http = require('http');
const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * מחלקה לניהול חיבור ל-ESP32 דרך WiFi
 */
class ESP32Controller {
  constructor() {
    this.esp32Devices = new Map(); // מפה של מכשירי ESP32 מחוברים
    this.statusUpdateInterval = null;
  }

  /**
   * רישום מכשיר ESP32 חדש
   * @param {string} lockerId - מזהה הלוקר
   * @param {string} esp32IP - כתובת IP של ה-ESP32
   * @param {number} esp32Port - פורט של ה-ESP32 (ברירת מחדל: 80)
   */
  registerESP32(lockerId, esp32IP, esp32Port = 80) {
    this.esp32Devices.set(lockerId, {
      ip: esp32IP,
      port: esp32Port,
      lastSeen: new Date(),
      status: 'connected',
      cells: {}
    });
    
    console.log(`📡 ESP32 נרשם: לוקר ${lockerId} בכתובת ${esp32IP}:${esp32Port}`);
    
    // בדיקת חיבור ראשונית
    this.checkESP32Connection(lockerId);
  }

  /**
   * שליחת פקודת פתיחה ל-ESP32
   * @param {string} lockerId - מזהה הלוקר
   * @param {string} cellId - מזהה התא
   * @returns {Promise<boolean>} - האם הפתיחה הצליחה
   */
  async unlockCell(lockerId, cellId) {
    const device = this.esp32Devices.get(lockerId);
    if (!device) {
      console.error(`❌ לוקר ${lockerId} לא נמצא`);
      return false;
    }

    try {
      // שליחת פקודת פתיחה ל-ESP32
      const response = await this.sendHTTPCommand(device, 'unlock', { cellId });
      
      if (response.success) {
        console.log(`🔓 תא ${cellId} נפתח בלוקר ${lockerId}`);
        
        // עדכון מצב התא
        device.cells[cellId] = {
          locked: false,
          opened: true,
          timestamp: new Date()
        };
        
        // התחלת מעקב אחר סגירת התא
        this.startCellCloseMonitoring(lockerId, cellId);
        
        return true;
      } else {
        console.error(`❌ שגיאה בפתיחת תא ${cellId}: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ שגיאה בתקשורת עם ESP32 ${lockerId}:`, error);
      return false;
    }
  }

  /**
   * שליחת פקודת נעילה ל-ESP32
   * @param {string} lockerId - מזהה הלוקר
   * @param {string} cellId - מזהה התא
   * @param {string} packageId - מזהה החבילה
   * @returns {Promise<boolean>} - האם הנעילה הצליחה
   */
  async lockCell(lockerId, cellId, packageId) {
    const device = this.esp32Devices.get(lockerId);
    if (!device) {
      console.error(`❌ לוקר ${lockerId} לא נמצא`);
      return false;
    }

    try {
      const response = await this.sendHTTPCommand(device, 'lock', { cellId, packageId });
      
      if (response.success) {
        console.log(`🔒 תא ${cellId} ננעל בלוקר ${lockerId} עם חבילה ${packageId}`);
        
        // עדכון מצב התא
        device.cells[cellId] = {
          locked: true,
          opened: false,
          packageId: packageId,
          timestamp: new Date()
        };
        
        return true;
      } else {
        console.error(`❌ שגיאה בנעילת תא ${cellId}: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ שגיאה בתקשורת עם ESP32 ${lockerId}:`, error);
      return false;
    }
  }

  /**
   * שליחת פקודה ל-ESP32 דרך HTTP
   * @param {object} device - פרטי ה-ESP32
   * @param {string} action - הפעולה (unlock/lock/status)
   * @param {object} params - פרמטרים נוספים
   * @returns {Promise<object>} - תגובה מה-ESP32
   */
  async sendHTTPCommand(device, action, params = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        action: action,
        ...params,
        timestamp: Date.now()
      });

      const options = {
        hostname: device.ip,
        port: device.port,
        path: '/locker',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000 // 5 שניות timeout
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            device.lastSeen = new Date();
            device.status = 'connected';
            resolve(response);
          } catch (error) {
            reject(new Error('תגובה לא תקינה מה-ESP32'));
          }
        });
      });

      req.on('error', (error) => {
        device.status = 'disconnected';
        reject(error);
      });

      req.on('timeout', () => {
        device.status = 'timeout';
        req.destroy();
        reject(new Error('Timeout בחיבור ל-ESP32'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * בדיקת חיבור ל-ESP32
   * @param {string} lockerId - מזהה הלוקר
   */
  async checkESP32Connection(lockerId) {
    const device = this.esp32Devices.get(lockerId);
    if (!device) return false;

    try {
      const response = await this.sendHTTPCommand(device, 'ping');
      console.log(`📶 לוקר ${lockerId} מחובר ותקין`);
      return true;
    } catch (error) {
      console.error(`📶 לוקר ${lockerId} לא מגיב:`, error.message);
      device.status = 'disconnected';
      return false;
    }
  }

  /**
   * התחלת מעקב אחר סגירת תא
   * @param {string} lockerId - מזהה הלוקר
   * @param {string} cellId - מזהה התא
   */
  startCellCloseMonitoring(lockerId, cellId) {
    const device = this.esp32Devices.get(lockerId);
    if (!device) return;

    // בדיקה כל 2 שניות אם התא נסגר
    const interval = setInterval(async () => {
      try {
        const response = await this.sendHTTPCommand(device, 'checkCell', { cellId });
        
        if (response.cellClosed) {
          console.log(`🚪 תא ${cellId} בלוקר ${lockerId} נסגר`);
          
          // עדכון מצב התא
          device.cells[cellId] = {
            ...device.cells[cellId],
            opened: false,
            closedAt: new Date()
          };
          
          // הפסקת המעקב
          clearInterval(interval);
          
          // שליחת עדכון לאפליקציה
          this.notifyAppOfCellClosure(lockerId, cellId);
        }
      } catch (error) {
        console.error(`❌ שגיאה בבדיקת סגירת תא ${cellId}:`, error);
        clearInterval(interval);
      }
    }, 2000);

    // הפסקת המעקב אחרי 5 דקות (במקרה שהתא לא נסגר)
    setTimeout(() => {
      clearInterval(interval);
      console.log(`⏰ הפסקת מעקב אחר תא ${cellId} בלוקר ${lockerId} - timeout`);
    }, 300000);
  }

  /**
   * הודעה לאפליקציה על סגירת תא
   * @param {string} lockerId - מזהה הלוקר
   * @param {string} cellId - מזהה התא
   */
  notifyAppOfCellClosure(lockerId, cellId) {
    // כאן נשלח הודעה לאפליקציה (דרך WebSocket או API)
    console.log(`📱 מעדכן את האפליקציה שתא ${cellId} בלוקר ${lockerId} נסגר`);
    
    // ניתן להוסיף כאן קוד לשליחת הודעה לאפליקציה הראשית
    // לדוגמה דרך WebSocket או HTTP POST
  }

  /**
   * קבלת סטטוס כל הלוקרים
   * @returns {object} - סטטוס כל הלוקרים
   */
  getAllStatus() {
    const status = {};
    
    for (const [lockerId, device] of this.esp32Devices) {
      status[lockerId] = {
        ip: device.ip,
        port: device.port,
        status: device.status,
        lastSeen: device.lastSeen,
        cells: device.cells,
        isOnline: (Date.now() - device.lastSeen.getTime()) < 30000
      };
    }
    
    return status;
  }

  /**
   * התחלת בדיקה תקופתית של חיבורים
   */
  startPeriodicHealthCheck() {
    this.statusUpdateInterval = setInterval(async () => {
      console.log('🔍 בודק חיבורי ESP32...');
      
      for (const lockerId of this.esp32Devices.keys()) {
        await this.checkESP32Connection(lockerId);
      }
    }, 30000); // כל 30 שניות
  }

  /**
   * הפסקת בדיקה תקופתית
   */
  stopPeriodicHealthCheck() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  /**
   * שליחת פקודה ל-ESP32
   * @param {string} lockerId - מזהה הלוקר
   * @param {string} command - הפקודה לשליחה
   */
  async sendCommand(lockerId, command) {
    const device = this.esp32Devices.get(lockerId);
    if (!device) {
      console.error(`❌ לוקר ${lockerId} לא נמצא`);
      return false;
    }

    try {
      await this.sendHTTPCommand(device, command);
      return true;
    } catch (error) {
      console.error(`❌ שגיאה בשליחת פקודה ללוקר ${lockerId}:`, error);
      return false;
    }
  }
}

// דוגמה לשימוש:
const esp32Controller = new ESP32Controller();

// רישום לוקרים (יש לעדכן לפי הכתובות האמיתיות)
esp32Controller.registerESP32('LOC001', '192.168.0.104', 80);
esp32Controller.registerESP32('LOC001', '192.168.0.105', 80);
// אם יש לך רק לוקר אחד כרגע, מחק או השבת את השורה השנייה:

// התחלת בדיקה תקופתית
esp32Controller.startPeriodicHealthCheck();

// ייצוא לשימוש במודולים אחרים
module.exports = esp32Controller; 

controllers["LOC001"].send(JSON.stringify({ type: "unlock" })); 

const ws = new WebSocket('ws://example.com/socket');

ws.on('message', async (msg) => {
  const data = JSON.parse(msg);

  if (data.type === 'status' && data.controllerId && data.cells) {
    // עדכן סטטוס לוקר
    await prisma.locker.update({
      where: { controllerId: data.controllerId },
      data: { lastSeen: new Date(), status: 'connected' }
    });

    // עדכן כל תא
    for (const cell of data.cells) {
      await prisma.cell.upsert({
        where: { lockerId_cellNumber: { lockerId: locker.id, cellNumber: cell.cellNumber } },
        update: {
          locked: cell.locked,
          hasPackage: cell.hasPackage,
          packageId: cell.packageId || null
        },
        create: {
          lockerId: locker.id,
          cellNumber: cell.cellNumber,
          locked: cell.locked,
          hasPackage: cell.hasPackage,
          packageId: cell.packageId || null
        }
      });
    }
  }
}); 