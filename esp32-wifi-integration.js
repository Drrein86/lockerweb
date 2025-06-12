const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');

let prisma;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.warn('⚠️ לא ניתן להתחבר לדאטהבייס, המערכת תעבוד במצב מוגבל');
  prisma = null;
}

/**
 * מחלקה לניהול חיבור ל-ESP32 דרך WebSocket
 */
class ESP32Controller {
  constructor() {
    this.lockerConnections = new Map(); // מפה של חיבורי WebSocket לפי מזהה לוקר
    this.statusUpdateInterval = null;
  }

  /**
   * רישום מכשיר ESP32 חדש
   * @param {string} lockerId - מזהה הלוקר
   * @param {WebSocket} ws - חיבור ה-WebSocket
   */
  registerESP32(lockerId, ws) {
    this.lockerConnections.set(lockerId, {
      ws,
      lastSeen: new Date(),
      status: 'connected',
      cells: {}
    });
    
    console.log(`📡 ESP32 נרשם: לוקר ${lockerId}`);
    
    // הגדרת טיפול בסגירת חיבור
    ws.on('close', () => {
      console.log(`📡 ESP32 ${lockerId} התנתק`);
      this.lockerConnections.delete(lockerId);
    });
    
    // הגדרת טיפול בשגיאות
    ws.on('error', (error) => {
      console.error(`❌ שגיאת WebSocket עם לוקר ${lockerId}:`, error);
      this.lockerConnections.get(lockerId).status = 'error';
    });
  }

  /**
   * שליחת פקודת פתיחה ל-ESP32
   * @param {string} lockerId - מזהה הלוקר
   * @param {string} cellId - מזהה התא
   * @returns {Promise<boolean>} - האם הפתיחה הצליחה
   */
  async unlockCell(lockerId, cellId) {
    const connection = this.lockerConnections.get(lockerId);
    if (!connection) {
      console.error(`❌ לוקר ${lockerId} לא נמצא`);
      return false;
    }

    try {
      // שליחת פקודת פתיחה דרך WebSocket
      connection.ws.send(JSON.stringify({
        type: 'unlock',
        cellId: cellId
      }));
      
      console.log(`🔓 נשלחה פקודת פתיחה לתא ${cellId} בלוקר ${lockerId}`);
      
      // עדכון מצב התא
      connection.cells[cellId] = {
        locked: false,
        opened: true,
        timestamp: new Date()
      };
      
      return true;
    } catch (error) {
      console.error(`❌ שגיאה בשליחת פקודת פתיחה ללוקר ${lockerId}:`, error);
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
    const connection = this.lockerConnections.get(lockerId);
    if (!connection) {
      console.error(`❌ לוקר ${lockerId} לא נמצא`);
      return false;
    }

    try {
      // שליחת פקודת נעילה דרך WebSocket
      connection.ws.send(JSON.stringify({
        type: 'lock',
        cellId: cellId,
        packageId: packageId
      }));
      
      console.log(`🔒 נשלחה פקודת נעילה לתא ${cellId} בלוקר ${lockerId} עם חבילה ${packageId}`);
      
      // עדכון מצב התא
      connection.cells[cellId] = {
        locked: true,
        opened: false,
        packageId: packageId,
        timestamp: new Date()
      };
      
      return true;
    } catch (error) {
      console.error(`❌ שגיאה בשליחת פקודת נעילה ללוקר ${lockerId}:`, error);
      return false;
    }
  }

  /**
   * קבלת סטטוס כל הלוקרים
   * @returns {object} - סטטוס כל הלוקרים
   */
  getAllStatus() {
    const status = {};
    
    for (const [lockerId, connection] of this.lockerConnections) {
      status[lockerId] = {
        status: connection.status,
        lastSeen: connection.lastSeen,
        cells: connection.cells,
        isOnline: connection.ws.readyState === WebSocket.OPEN
      };
    }
    
    return status;
  }

  /**
   * התחלת בדיקה תקופתית של חיבורים
   */
  startPeriodicHealthCheck() {
    this.statusUpdateInterval = setInterval(() => {
      console.log('🔍 בודק חיבורי ESP32...');
      
      for (const [lockerId, connection] of this.lockerConnections) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify({ type: 'ping' }));
          console.log(`📶 לוקר ${lockerId} מחובר ותקין`);
        } else {
          console.log(`📶 לוקר ${lockerId} לא מגיב`);
          connection.status = 'disconnected';
        }
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
}

// יצירת מופע יחיד של המחלקה
const esp32Controller = new ESP32Controller();

// התחלת בדיקה תקופתית
esp32Controller.startPeriodicHealthCheck();

// ייצוא לשימוש במודולים אחרים
module.exports = esp32Controller; 