import { WebSocket, WebSocketServer } from 'ws';
import { createServer, Server } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import esp32Controller from './esp32-controller';

// טעינת משתני סביבה
config();

// טיפוסים
interface LockerCell {
  locked: boolean;
  opened: boolean;
  hasPackage: boolean;
  packageId?: string;
  lastUpdate: Date;
}

interface LockerConnection extends WebSocket {
  lockerId?: string;
  isAdmin?: boolean;
  lastSeen?: Date;
  cells?: Record<string, LockerCell>;
  isAlive?: boolean;
  reconnectAttempts?: number;
}

interface WebSocketMessage {
  type: string;
  id?: string;
  client?: string;
  secret?: string;
  lockerId?: string;
  cellId?: string;
  packageId?: string;
  cells?: Record<string, LockerCell>;
  clientToken?: string;
}

// קונפיגורציה
const CONFIG = {
  PORT: process.env.PORT || 3003,
  USE_SSL: process.env.USE_SSL === 'true',
  SSL_KEY: process.env.SSL_KEY_PATH,
  SSL_CERT: process.env.SSL_CERT_PATH,
  ADMIN_SECRET: process.env.ADMIN_SECRET || 'default_secret',
  HEARTBEAT_INTERVAL: 30000,
  STATUS_BROADCAST_INTERVAL: 30000,
  ESP32_MONITORING_INTERVAL: 60000,
  ALLOWED_LOCKER_IDS: ['LOC632', 'LOC720'],
  ESP32_DEVICES: [
    process.env.ESP32_LOCKER1_IP || '192.168.0.104',
    process.env.ESP32_LOCKER2_IP || '192.168.0.105'
  ],
  RECONNECT_ATTEMPTS: 3
};

class WebSocketManager {
  private server: Server;
  private wss: WebSocketServer;
  private lockerConnections: Map<string, LockerConnection>;
  private adminConnections: Set<LockerConnection>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private statusInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.lockerConnections = new Map();
    this.adminConnections = new Set();
    
    // יצירת שרת HTTP/HTTPS
    if (CONFIG.USE_SSL && CONFIG.SSL_KEY && CONFIG.SSL_CERT) {
      const options = {
        key: readFileSync(CONFIG.SSL_KEY),
        cert: readFileSync(CONFIG.SSL_CERT)
      };
      this.server = createHttpsServer(options, this.handleHttpRequest.bind(this));
      this.logEvent('server_init', '🔒 שרת HTTPS הופעל');
    } else {
      this.server = createServer(this.handleHttpRequest.bind(this));
      this.logEvent('server_init', 'ℹ️ שרת HTTP הופעל (ללא SSL)');
    }

    // יצירת שרת WebSocket
    this.wss = new WebSocketServer({ server: this.server });
    this.setupWebSocketServer();
    
    // התחלת מעקב תקופתי
    this.startPeriodicTasks();
  }

  /**
   * טיפול בבקשות HTTP
   */
  private handleHttpRequest(req: any, res: any): void {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      message: 'מערכת לוקר חכם - שרת חומרה עם ESP32',
      status: 'פעיל',
      lockers: this.getLockerStates(),
      timestamp: new Date().toISOString()
    }, null, 2));
  }

  /**
   * הגדרת שרת WebSocket
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', this.handleNewConnection.bind(this));
  }

  /**
   * טיפול בחיבור חדש
   */
  private handleNewConnection(ws: LockerConnection): void {
    this.logEvent('connection', '📡 חיבור WebSocket חדש התקבל');
    
    // הגדרת מצב התחלתי
    ws.isAlive = true;
    
    // הגדרת מאזינים
    ws.on('message', (msg) => this.handleMessage(ws, msg));
    ws.on('close', () => this.handleClose(ws));
    ws.on('error', (error) => this.handleError(ws, error));
    ws.on('pong', () => { ws.isAlive = true; });
  }

  /**
   * טיפול בהודעות נכנסות
   */
  private handleMessage(ws: LockerConnection, msg: any): void {
    try {
      const data: WebSocketMessage = JSON.parse(msg.toString());
      this.logEvent('message', '📨 התקבלה הודעה', data);
      
      switch (data.type) {
        case 'register':
          this.handleLockerRegistration(ws, data);
          break;
          
        case 'identify':
          this.handleAdminIdentification(ws, data);
          break;
          
        case 'statusUpdate':
          this.handleStatusUpdate(ws, data);
          break;
          
        case 'unlock':
          this.handleUnlockCommand(ws, data);
          break;
          
        case 'lock':
          this.handleLockCommand(ws, data);
          break;
          
        case 'openByClient':
          this.handleClientOpenRequest(ws, data);
          break;
      }
      
    } catch (error) {
      this.logEvent('error', '❌ שגיאה בעיבוד הודעה', { error });
    }
  }

  /**
   * טיפול ברישום לוקר חדש
   */
  private async handleLockerRegistration(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    if (data.id && CONFIG.ALLOWED_LOCKER_IDS.includes(data.id)) {
      try {
        // עדכון או יצירת לוקר ב-DB
        // במצב Mock - רק לוג הרישום
        const clientIP = (ws as any)._socket?.remoteAddress || 'unknown';
        const clientPort = (ws as any)._socket?.remotePort || 0;
        
        this.logEvent('register_mock', `📝 נרשם לוקר ${data.id}`, {
          lockerId: data.id,
          ip: clientIP,
          port: clientPort,
          status: 'ONLINE'
        });

        ws.lockerId = data.id;
        ws.lastSeen = new Date();
        ws.cells = data.cells || {};
        
        this.lockerConnections.set(data.id, ws);
        this.logEvent('register', `📡 נרשם לוקר ${data.id}`);
        this.broadcastStatus();
      } catch (error) {
        this.logEvent('error', `❌ שגיאה ברישום לוקר ${data.id}`, { error });
      }
    }
  }

  /**
   * טיפול בזיהוי ממשק ניהול
   */
  private handleAdminIdentification(ws: LockerConnection, data: WebSocketMessage): void {
    if (data.client === 'web-admin' && data.secret === CONFIG.ADMIN_SECRET) {
      ws.isAdmin = true;
      this.adminConnections.add(ws);
      
      this.logEvent('admin', '👤 נרשם ממשק ניהול חדש');
      
      // שליחת סטטוס ראשוני
      const message = {
        type: 'lockerUpdate',
        data: {
          message: 'מערכת לוקר חכם - שרת חומרה עם ESP32',
          status: 'פעיל',
          lockers: this.getLockerStates(),
          timestamp: new Date().toISOString()
        }
      };
      
      ws.send(JSON.stringify(message));
    } else {
      this.logEvent('warning', '⚠️ ניסיון זיהוי ממשק ניהול נכשל');
      ws.close();
    }
  }

  /**
   * טיפול בעדכון סטטוס
   */
  private async handleStatusUpdate(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    if (ws.lockerId && data.cells) {
      try {
        // במצב Mock - רק עדכון מקומי
        this.logEvent('status_update', `📝 עדכון סטטוס לוקר ${ws.lockerId}`, {
          lockerId: ws.lockerId,
          cellsCount: Object.keys(data.cells).length
        });

        // עדכון סטטוס התאים במטמון המקומי
        for (const [cellId, cellData] of Object.entries(data.cells)) {
          this.logEvent('cell_update', `📝 עדכון תא ${cellId}`, {
            lockerId: ws.lockerId,
            cellId,
            locked: cellData.locked,
            opened: cellData.opened
          });
        }

        ws.cells = data.cells;
        ws.lastSeen = new Date();
        this.broadcastStatus();
      } catch (error) {
        this.logEvent('error', `❌ שגיאה בעדכון סטטוס לוקר ${ws.lockerId}`, { error });
      }
    }
  }

  /**
   * טיפול בפקודת פתיחה
   */
  private async handleUnlockCommand(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    if (ws.isAdmin && data.lockerId && data.cellId) {
      try {
        // במצב Mock - בדיקה בסיסית
        this.logEvent('unlock_request', `🔓 בקשת פתיחה לתא ${data.cellId} בלוקר ${data.lockerId}`);

        // שליחת פקודה ללוקר
        const success = this.sendToLocker(data.lockerId, {
          type: 'unlock',
          cellId: data.cellId
        });

        if (success) {
        this.logEvent('unlock', `🔓 נפתח תא ${data.cellId} בלוקר ${data.lockerId}`);
        } else {
          this.logEvent('unlock_failed', `❌ כישלון בפתיחת תא ${data.cellId} - לוקר לא מחובר`);
        }
      } catch (error) {
        this.logEvent('error', `❌ שגיאה בפתיחת תא ${data.cellId}`, { error });
      }
    }
  }

  /**
   * טיפול בפקודת נעילה
   */
  private async handleLockCommand(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    if (ws.isAdmin && data.lockerId && data.cellId && data.packageId) {
      try {
        // במצב Mock - בדיקה בסיסית
        this.logEvent('lock_request', `🔒 בקשת נעילה לתא ${data.cellId} בלוקר ${data.lockerId} עם חבילה ${data.packageId}`);

        // שליחת פקודה ללוקר
        const success = this.sendToLocker(data.lockerId, {
          type: 'lock',
          cellId: data.cellId,
          packageId: data.packageId
        });

        if (success) {
        this.logEvent('lock', `🔒 ננעל תא ${data.cellId} בלוקר ${data.lockerId}`);
        } else {
          this.logEvent('lock_failed', `❌ כישלון בנעילת תא ${data.cellId} - לוקר לא מחובר`);
        }
      } catch (error) {
        this.logEvent('error', `❌ שגיאה בנעילת תא ${data.cellId}`, { error });
      }
    }
  }

  /**
   * בדיקת אימות לקוח
   */
  private validateClientToken(packageId: string, clientToken?: string): boolean {
    // כאן תוכל להוסיף לוגיקה מורכבת יותר לבדיקת הטוקן
    // לדוגמה: בדיקה מול מסד נתונים, הצלבה עם packageId וכו'
    
    // כרגע - בדיקה בסיסית שהטוקן קיים
    if (!clientToken) {
      this.logEvent('auth_failed', `❌ טוקן לקוח חסר לחבילה ${packageId}`);
      return false;
    }
    
    // בדיקה בסיסית - הטוקן צריך להיות באורך סביר
    if (clientToken.length < 6) {
      this.logEvent('auth_failed', `❌ טוקן לקוח לא תקין לחבילה ${packageId}`);
      return false;
    }
    
    this.logEvent('auth_success', `✅ אימות לקוח הצליח לחבילה ${packageId}`);
    return true;
  }

  /**
   * טיפול בבקשה מלקוח לפתיחת תא
   */
  private async handleClientOpenRequest(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    if (data.lockerId && data.cellId && data.packageId) {
      try {
        // בדיקת אימות לקוח
        if (!this.validateClientToken(data.packageId, data.clientToken)) {
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            status: 'error',
            error: 'Invalid client token'
          }));
          return;
        }

        // בדוק אם הלוקר מחובר
        const success = this.sendToLocker(data.lockerId, {
          type: 'unlock',
          cellId: data.cellId,
          from: 'client',
          packageId: data.packageId
        });

        if (success) {
          this.logEvent('client_unlock', `📦 לקוח פתח תא ${data.cellId} בלוקר ${data.lockerId}`, {
            lockerId: data.lockerId,
            cellId: data.cellId,
            packageId: data.packageId
          });

          // החזר אישור ללקוח (אם זה רלוונטי)
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            status: 'success',
            lockerId: data.lockerId,
            cellId: data.cellId
          }));
        } else {
          this.logEvent('client_unlock_failed', `❌ לוקר ${data.lockerId} לא מחובר`);
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            status: 'failed',
            reason: 'Locker not connected'
          }));
        }

      } catch (error) {
        this.logEvent('error', `❌ שגיאה בפתיחת תא ע"י לקוח`, { error });
        ws.send(JSON.stringify({
          type: 'unlockResponse',
          status: 'error',
          error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
        }));
      }
    } else {
      this.logEvent('warning', `⚠️ בקשה לא תקינה מלקוח`, data);
      ws.send(JSON.stringify({
        type: 'unlockResponse',
        status: 'error',
        error: 'Missing lockerId / cellId / packageId'
      }));
    }
  }

  /**
   * טיפול בסגירת חיבור
   */
  private async handleClose(ws: LockerConnection): Promise<void> {
    if (ws.isAdmin) {
      this.adminConnections.delete(ws);
      this.logEvent('disconnect', '👤 ממשק ניהול התנתק');
    } else if (ws.lockerId) {
      try {
        // במצב Mock - רק לוג ההתנתקות
        this.logEvent('locker_disconnect', `📡 לוקר ${ws.lockerId} התנתק`, {
          lockerId: ws.lockerId,
          lastSeen: ws.lastSeen
        });

        this.lockerConnections.delete(ws.lockerId);
        this.logEvent('disconnect', `📡 לוקר ${ws.lockerId} התנתק`);
        this.broadcastStatus();
      } catch (error) {
        this.logEvent('error', `❌ שגיאה בעדכון סטטוס לוקר ${ws.lockerId}`, { error });
      }
    }
  }

  /**
   * טיפול בשגיאות
   */
  private handleError(ws: LockerConnection, error: Error): void {
          this.logEvent('error', '❌ שגיאת WebSocket', { error: error instanceof Error ? error.message : 'שגיאה לא ידועה' });
  }

  /**
   * שליחת הודעה ללוקר ספציפי
   */
  private sendToLocker(id: string, messageObj: any): boolean {
    const conn = this.lockerConnections.get(id);
    if (conn?.readyState === WebSocket.OPEN) {
      conn.send(JSON.stringify(messageObj));
      return true;
    } else {
      this.logEvent('warning', `🚫 לוקר ${id} לא מחובר`);
      return false;
    }
  }

  /**
   * שליחת עדכון סטטוס לכל ממשקי הניהול
   */
  private broadcastStatus(): void {
    const message = {
      type: 'lockerUpdate',
      data: this.getLockerStates(),
      timestamp: Date.now()
    };
    
    for (const client of this.adminConnections) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }

  /**
   * קבלת סטטוס כל הלוקרים
   */
  private getLockerStates(): Record<string, any> {
    const states: Record<string, any> = {};
    
    for (const [id, ws] of this.lockerConnections) {
      states[id] = {
        isOnline: ws.readyState === WebSocket.OPEN,
        lastSeen: ws.lastSeen || new Date(),
        cells: ws.cells || {}
      };
    }
    
    return states;
  }

  /**
   * התחלת משימות תקופתיות
   */
  private startPeriodicTasks(): void {
    // בדיקת חיבורים חיים
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: LockerConnection) => {
        if (!ws.isAlive) {
          this.logEvent('heartbeat', '💔 ניתוק חיבור לא מגיב');
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, CONFIG.HEARTBEAT_INTERVAL);

    // שליחת עדכוני סטטוס
    this.statusInterval = setInterval(() => {
      this.logEvent('status', '📊 שליחת עדכון סטטוס אוטומטי');
      this.broadcastStatus();
    }, CONFIG.STATUS_BROADCAST_INTERVAL);

    // מעקב אחר ESP32
    this.monitoringInterval = setInterval(() => {
      this.monitorESP32Devices();
    }, CONFIG.ESP32_MONITORING_INTERVAL);
  }

  /**
   * מעקב אחר מכשירי ESP32
   */
  private monitorESP32Devices(): void {
    this.logEvent('monitoring', '🔍 בדיקת חיבורי ESP32');
    
    const status = esp32Controller.getAllStatus();
    let connectedDevices = 0;
    
    for (const [lockerId, device] of Object.entries(status)) {
      if (device.isOnline) {
        connectedDevices++;
        this.logEvent('device_status', `📡 לוקר ${lockerId} מחובר`, {
          lockerId,
          ip: device.ip,
          status: 'ONLINE'
        });
      } else {
        this.logEvent('device_status', `📡 לוקר ${lockerId} לא מגיב`, {
          lockerId,
          ip: device.ip,
          status: 'offline'
        });
      }
    }
    
    this.logEvent('monitoring_summary', '📊 סה"כ לוקרים מחוברים', {
      connectedDevices,
      totalDevices: Object.keys(status).length
    });
  }

  /**
   * הפעלת השרת
   */
  public start(): void {
    this.server.listen(CONFIG.PORT, () => {
      this.logEvent('server_start', `🚀 שרת הלוקרים פועל על פורט ${CONFIG.PORT}`, {
        port: CONFIG.PORT,
        ssl: CONFIG.USE_SSL,
        esp32_devices: CONFIG.ESP32_DEVICES
      });
    });

    // טיפול בסגירה נאותה
    process.on('SIGINT', () => {
      this.stop();
    });
  }

  /**
   * עצירת השרת
   */
  public stop(): void {
    // סגירת חיבורים
    for (const [_, connection] of this.lockerConnections) {
      connection.close();
    }
    this.lockerConnections.clear();

    for (const connection of this.adminConnections) {
      connection.close();
    }
    this.adminConnections.clear();

    // ניקוי טיימרים
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // עצירת מעקב ESP32
    esp32Controller.stopPeriodicHealthCheck();
    
    // סגירת שרת
    this.server.close(() => {
      this.logEvent('server_stop', '✅ השרת נסגר בהצלחה');
      process.exit(0);
    });
  }

  /**
   * רישום לוג
   */
  private logEvent(type: string, message: string, data: any = {}): void {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
      timestamp,
      type,
      message,
      ...data
    }));
  }

  /**
   * שליחת עדכון למנהלים
   */
  private broadcastToAdmins(message: any): void {
    for (const client of this.adminConnections) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }
}

// יצירת מופע יחיד של המחלקה
const wsManager = new WebSocketManager();

// ייצוא לשימוש במודולים אחרים
export default wsManager; 