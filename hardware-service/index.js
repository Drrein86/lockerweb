const express = require('express');
const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');

console.log('🚀 מתחיל Hardware Microservice - ללא נגיעה בשרת הראשי');

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

// WebSocket Server לESP32 - פורט שונה כדי לא להתנגש
const ESP32_WS_PORT = 8081;
const API_PORT = 8080;

// מפת חיבורי ESP32
const espConnections = new Map();

class HardwareMicroservice {
  constructor() {
    this.setupWebSocketServer();
    this.setupAPIServer();
    console.log('✅ Hardware Microservice מוכן - עובד בצד השרת הראשי');
  }

  setupWebSocketServer() {
    console.log(`🌐 יוצר WebSocket Server לESP32 על פורט ${ESP32_WS_PORT}`);
    
    const wss = new WebSocket.Server({ port: ESP32_WS_PORT });

    wss.on('connection', (ws, req) => {
      console.log('🔌 ESP32 התחבר ל-Hardware Microservice');
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          console.log('📨 הודעה מESP32:', message);
          await this.handleESP32Message(ws, message);
        } catch (error) {
          console.error('❌ שגיאה בעיבוד הודעה מESP32:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 ESP32 התנתק מה-Hardware Microservice');
        // מוצא ומסיר מהמפה
        for (const [id, connection] of espConnections.entries()) {
          if (connection.ws === ws) {
            espConnections.delete(id);
            console.log(`📤 הסרת לוקר ${id} מהחיבורים`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('❌ שגיאת WebSocket:', error);
      });
    });

    console.log(`✅ WebSocket Server לESP32 פועל על פורט ${ESP32_WS_PORT}`);
  }

  async handleESP32Message(ws, message) {
    const { type, id } = message;
    console.log(`🔄 מעבד הודעה מסוג ${type} מלוקר ${id}`);

    try {
      switch (type) {
        case 'register':
          await this.handleESP32Registration(ws, message);
          break;

        case 'pong':
          await this.handlePongResponse(message);
          break;

        case 'cellLocked':
          await this.handleCellLocked(message);
          break;

        case 'cellOpened':
          await this.handleCellOpened(message);
          break;

        case 'ping':
          // פינג מESP32 - שולח pong חזרה
          this.sendToESP32(id, { type: 'pong', timestamp: Date.now() });
          break;

        default:
          console.log(`🔔 הודעה לא מוכרת מESP32: ${type}`);
      }
    } catch (error) {
      console.error(`❌ שגיאה בטיפול בהודעה ${type}:`, error);
    }
  }

  async handleESP32Registration(ws, message) {
    const { id } = message;
    console.log(`📝 רושם לוקר ${id} במicroservice`);
    
    // שמירה בחיבורים
    espConnections.set(id, { 
      ws, 
      lastSeen: new Date(),
      deviceId: id 
    });

    // עדכון DB שהלוקר online
    try {
      await this.updateLockerStatus(id, 'ONLINE');
      console.log(`✅ לוקר ${id} רשום ופעיל`);
      
      // שליחת אישור חזרה לESP32
      ws.send(JSON.stringify({
        type: 'registered',
        id: id,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error(`❌ שגיאה ברישום לוקר ${id}:`, error);
    }
  }

  async updateLockerStatus(lockerId, status) {
    try {
      await prisma.locker.updateMany({
        where: { deviceId: lockerId },
        data: { 
          status: status as any,
          lastSeen: new Date() 
        }
      });
      console.log(`📊 עודכן סטטוס לוקר ${lockerId} ל-${status}`);
    } catch (error) {
      console.error('❌ שגיאה בעדכון סטטוס לוקר:', error);
    }
  }

  async handlePongResponse(message) {
    const { id, cell } = message;
    console.log(`🏓 התקבל PONG מלוקר ${id}, תא ${cell}`);
    
    try {
      // עדכון שהתא נעל
      await prisma.cell.updateMany({
        where: { 
          cellNumber: parseInt(cell),
          locker: { deviceId: id }
        },
        data: { 
          isLocked: true,
          status: 'AVAILABLE' as any,
          lastClosedAt: new Date()
        }
      });
      console.log(`🔒 תא ${cell} בלוקר ${id} עודכן כנעול`);
    } catch (error) {
      console.error('❌ שגיאה בעדכון תא נעול:', error);
    }
  }

  async handleCellOpened(message) {
    const { id, cell } = message;
    console.log(`🔓 תא ${cell} נפתח בלוקר ${id}`);
    
    try {
      await prisma.cell.updateMany({
        where: { 
          cellNumber: parseInt(cell),
          locker: { deviceId: id }
        },
        data: { 
          isLocked: false,
          lastOpenedAt: new Date(),
          openCount: { increment: 1 }
        }
      });
      console.log(`📊 תא ${cell} בלוקר ${id} עודכן כפתוח`);
    } catch (error) {
      console.error('❌ שגיאה בעדכון תא פתוח:', error);
    }
  }

  sendToESP32(lockerId, message) {
    const connection = espConnections.get(lockerId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
      console.log(`📤 נשלח ל-ESP32 ${lockerId}:`, message);
      return { success: true };
    } else {
      console.log(`❌ לוקר ${lockerId} לא מחובר`);
      return { success: false, error: 'לוקר לא מחובר' };
    }
  }

  setupAPIServer() {
    // API לפתיחת תא
    app.post('/hardware/unlock', (req, res) => {
      const { lockerId, cellNumber } = req.body;
      console.log(`🔓 בקשת פתיחה: לוקר ${lockerId}, תא ${cellNumber}`);
      
      const result = this.sendToESP32(lockerId, {
        type: 'unlock',
        id: lockerId,
        cell: cellNumber
      });

      if (result.success) {
        res.json({ 
          success: true, 
          message: `פקודת פתיחה נשלחה לתא ${cellNumber}` 
        });
      } else {
        res.status(404).json({ 
          error: `לוקר ${lockerId} לא מחובר` 
        });
      }
    });

    // API לנעילת תא
    app.post('/hardware/lock', (req, res) => {
      const { lockerId, cellNumber } = req.body;
      console.log(`🔒 בקשת נעילה: לוקר ${lockerId}, תא ${cellNumber}`);
      
      const result = this.sendToESP32(lockerId, {
        type: 'lock',
        id: lockerId,
        cell: cellNumber
      });

      if (result.success) {
        res.json({ 
          success: true, 
          message: `פקודת נעילה נשלחה לתא ${cellNumber}` 
        });
      } else {
        res.status(404).json({ 
          error: `לוקר ${lockerId} לא מחובר` 
        });
      }
    });

    // API לסטטוס חיבורים
    app.get('/hardware/status', (req, res) => {
      const connections = Array.from(espConnections.entries()).map(([id, conn]) => ({
        lockerId: id,
        connected: conn.ws.readyState === WebSocket.OPEN,
        lastSeen: conn.lastSeen
      }));

      res.json({
        service: 'Hardware Microservice',
        connectedLockers: connections.length,
        lockers: connections,
        timestamp: new Date().toISOString()
      });
    });

    // בדיקת בריאות
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Hardware Microservice',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    app.listen(API_PORT, () => {
      console.log(`🚀 Hardware API Server פועל על פורט ${API_PORT}`);
      console.log(`📍 נקודות קצה:`);
      console.log(`   POST /hardware/unlock - פתיחת תא`);
      console.log(`   POST /hardware/lock - נעילת תא`);
      console.log(`   GET /hardware/status - סטטוס חיבורים`);
      console.log(`   GET /health - בדיקת בריאות`);
    });
  }
}

// הפעלת המicroservice
console.log('🎯 מתחיל Hardware Microservice...');
new HardwareMicroservice();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 נסגר Hardware Microservice...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 נסגר Hardware Microservice...');
  await prisma.$disconnect();
  process.exit(0);
});
