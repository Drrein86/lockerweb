const express = require('express');
const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// WebSocket Server לESP32
const wss = new WebSocket.Server({ port: 8081 });

// Map לחיבורי ESP32
const espConnections = new Map();

class HardwareService {
  constructor() {
    this.setupWebSocket();
    this.setupAPI();
  }

  setupWebSocket() {
    wss.on('connection', (ws, req) => {
      console.log('🔌 ESP32 connected');
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleESP32Message(ws, message);
        } catch (error) {
          console.error('❌ שגיאה בעיבוד הודעה מESP32:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 ESP32 disconnected');
        // Remove from connections map
        for (const [id, connection] of espConnections.entries()) {
          if (connection.ws === ws) {
            espConnections.delete(id);
            break;
          }
        }
      });
    });
  }

  async handleESP32Message(ws, message) {
    const { type, id } = message;

    switch (type) {
      case 'register':
        espConnections.set(id, { ws, lastSeen: new Date() });
        await this.updateLockerStatus(id, 'ONLINE');
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

      default:
        console.log('🔔 הודעה לא מוכרת מESP32:', message);
    }
  }

  async updateLockerStatus(lockerId, status) {
    try {
      await prisma.locker.updateMany({
        where: { deviceId: lockerId },
        data: { 
          status: status,
          lastSeen: new Date() 
        }
      });
      console.log(`📊 עדכון סטטוס לוקר ${lockerId}: ${status}`);
    } catch (error) {
      console.error('❌ שגיאה בעדכון סטטוס לוקר:', error);
    }
  }

  async handlePongResponse(message) {
    const { id, cell } = message;
    try {
      // עדכון שהתא נעל
      await prisma.cell.updateMany({
        where: { 
          cellNumber: parseInt(cell),
          locker: { deviceId: id }
        },
        data: { 
          isLocked: true,
          status: 'AVAILABLE',
          lastClosedAt: new Date()
        }
      });
      console.log(`🔒 תא ${cell} בלוקר ${id} נעול`);
    } catch (error) {
      console.error('❌ שגיאה בעדכון תא נעול:', error);
    }
  }

  async handleCellOpened(message) {
    const { id, cell } = message;
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
      console.log(`🔓 תא ${cell} בלוקר ${id} נפתח`);
    } catch (error) {
      console.error('❌ שגיאה בעדכון תא פתוח:', error);
    }
  }

  // API לשליחת פקודות לESP32
  setupAPI() {
    app.use(express.json());

    // פתיחת תא
    app.post('/hardware/unlock', (req, res) => {
      const { lockerId, cellNumber } = req.body;
      
      const connection = espConnections.get(lockerId);
      if (!connection) {
        return res.status(404).json({ 
          error: `לוקר ${lockerId} לא מחובר` 
        });
      }

      const unlockMessage = {
        type: 'unlock',
        id: lockerId,
        cell: cellNumber
      };

      connection.ws.send(JSON.stringify(unlockMessage));
      console.log(`📤 נשלחה פקודת פתיחה: לוקר ${lockerId}, תא ${cellNumber}`);
      
      res.json({ 
        success: true, 
        message: `פקודת פתיחה נשלחה לתא ${cellNumber}` 
      });
    });

    // נעילת תא
    app.post('/hardware/lock', (req, res) => {
      const { lockerId, cellNumber } = req.body;
      
      const connection = espConnections.get(lockerId);
      if (!connection) {
        return res.status(404).json({ 
          error: `לוקר ${lockerId} לא מחובר` 
        });
      }

      const lockMessage = {
        type: 'lock',
        id: lockerId,
        cell: cellNumber
      };

      connection.ws.send(JSON.stringify(lockMessage));
      console.log(`📤 נשלחה פקודת נעילה: לוקר ${lockerId}, תא ${cellNumber}`);
      
      res.json({ 
        success: true, 
        message: `פקודת נעילה נשלחה לתא ${cellNumber}` 
      });
    });

    // סטטוס חיבורים
    app.get('/hardware/status', (req, res) => {
      const connections = Array.from(espConnections.entries()).map(([id, conn]) => ({
        lockerId: id,
        connected: true,
        lastSeen: conn.lastSeen
      }));

      res.json({
        connectedLockers: connections.length,
        lockers: connections
      });
    });

    const PORT = process.env.HARDWARE_PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🤖 Hardware Service running on port ${PORT}`);
      console.log(`🌐 WebSocket Server running on port 8081`);
    });
  }
}

// הפעלת השירות
new HardwareService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
