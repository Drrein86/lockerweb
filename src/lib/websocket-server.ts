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
  ws?: WebSocket;
}

interface WebSocketMessage {
  type: string;
  id?: string;
  client?: string;
  secret?: string;
  lockerId?: string;
  cellId?: string;
  cellCode?: string;
  cell?: string;
  packageId?: string;
  cells?: Record<string, LockerCell>;
  clientToken?: string;
  status?: string;
  reason?: string;
}

// קונפיגורציה
const CONFIG = {
  PORT: process.env.PORT || 3003,
  USE_SSL: process.env.USE_SSL === 'true',
  SSL_KEY: process.env.SSL_KEY_PATH,
  SSL_CERT: process.env.SSL_CERT_PATH,
  ADMIN_SECRET: process.env.ADMIN_SECRET || '86428642',
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
    const clientIP = (ws as any)._socket?.remoteAddress || 'unknown';
    const clientPort = (ws as any)._socket?.remotePort || 0;
    
    console.log('🔌 חיבור חדש התקבל:', {
      clientIP,
      clientPort,
      timestamp: new Date().toISOString(),
      totalConnections: this.wss.clients.size
    });
    
    this.logEvent('connection', '🔌 חיבור חדש התקבל', {
      clientIP,
      clientPort,
      timestamp: new Date().toISOString()
    });
    
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
      
      // לוג מפורט לכל הודעה
      console.log('📨 התקבלה הודעה:', {
        type: data.type,
        id: data.id,
        lockerId: data.lockerId,
        cellId: data.cellId,
        cellCode: data.cellCode,
        client: data.client,
        timestamp: new Date().toISOString(),
        clientType: ws.isAdmin ? 'admin' : (ws.lockerId ? 'locker' : 'unknown'),
        messageContent: JSON.stringify(data).substring(0, 200) // רק 200 תווים ראשונים
      });
      
      this.logEvent('message', '📨 התקבלה הודעה', data);
      
      switch (data.type) {
        case 'register':
          console.log('📝 עיבוד הודעת רישום לוקר');
          this.handleLockerRegistration(ws, data);
          break;
          
        case 'identify':
          console.log('👤 עיבוד הודעת זיהוי מנהל');
          this.handleAdminIdentification(ws, data);
          break;
          
        case 'statusUpdate':
          console.log('📊 עיבוד עדכון סטטוס');
          this.handleStatusUpdate(ws, data);
          break;
          
        case 'getStatus':
          console.log('📊 עיבוד בקשת סטטוס');
          this.handleGetStatus(ws, data);
          break;
          
        case 'unlock':
        case 'openCell':
          console.log('🔓 עיבוד בקשת פתיחת תא - התקבלה הודעת unlock/openCell!');
          console.log('🔓 פרטי הבקשה:', {
            lockerId: data.lockerId,
            cellId: data.cellId || data.cellCode,
            cellCode: data.cellCode,
            isAdmin: ws.isAdmin,
            timestamp: new Date().toISOString(),
            hasLockerId: !!data.lockerId,
            hasCellId: !!(data.cellId || data.cellCode)
          });
          
          // אם זה ממנהל, נטפל כ-unlock רגיל
          if (ws.isAdmin) {
            this.handleUnlockCommand(ws, data);
                  } else {
          // אם זה מלקוח, נטפל כ-openByClient
          console.log('📦 מטפל בבקשת פתיחה מלקוח');
          this.handleClientOpenRequest(ws, {
            ...data,
            type: 'openByClient',
            cellId: data.cellId || data.cellCode,
            packageId: data.packageId || `CLIENT-${Date.now()}`,
            clientToken: data.clientToken || 'CLIENT-TOKEN'
          });
        }
          break;
          
        case 'lock':
          console.log('🔒 עיבוד בקשת נעילת תא');
          this.handleLockCommand(ws, data);
          break;
          
        case 'openByClient':
          console.log('📦 עיבוד בקשת פתיחה מלקוח');
          console.log('📦 פרטי הבקשה:', {
            lockerId: data.lockerId,
            cellId: data.cellId,
            packageId: data.packageId,
            clientToken: data.clientToken
          });
          this.handleClientOpenRequest(ws, data);
          break;
          
        case 'openSuccess':
        case 'openFailed':
          console.log('📦 עיבוד תגובת פתיחה מהלוקר');
          this.handleOpenResponse(ws, data);
          break;
          
        case 'cellClosed':
          console.log('🔒 עיבוד הודעת סגירת תא');
          this.handleCellClosed(ws, data);
          break;
          
        case 'failedToUnlock':
          console.log('❌ עיבוד הודעת כישלון פתיחה');
          this.handleFailedToUnlock(ws, data);
          break;
          
        case 'ping':
          // טיפול בפינג - החזרת פונג עם אותו ID אם קיים
          const pongResponse = {
            type: 'pong',
            ...(data.id && { id: data.id })
          };
          ws.send(JSON.stringify(pongResponse));
          const clientId = ws.lockerId || (ws.isAdmin ? 'admin-panel' : 'unknown');
          this.logEvent('ping', `🏓 פינג התקבל מ-${clientId}`, { id: data.id });
          console.log(`📨 התקבלה הודעת WebSocket: type=${data.type}${data.id ? `, id=${data.id}` : ''}`);
          break;
          
        case 'pong':
          // טיפול בפונג - לוג בלבד
          if (data.id) {
            console.log(`🏓 פונג התקבל עם ID: ${data.id}`);
          } else {
            console.log(`🏓 פונג התקבל ללא ID (תקין)`);
          }
          break;
          
        default:
          console.log(`⚠️ סוג הודעה לא מוכר: ${data.type}`);
          console.log(`⚠️ תוכן ההודעה:`, JSON.stringify(data));
          this.logEvent('unknown_message', `⚠️ סוג הודעה לא מוכר: ${data.type}`, data);
          break;
      }
      
    } catch (error) {
      console.error('❌ שגיאה בעיבוד הודעה:', error);
      this.logEvent('error', '❌ שגיאה בעיבוד הודעה', { 
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        messageContent: msg.toString().substring(0, 200) // רק 200 תווים ראשונים
      });
    }
  }

  /**
   * טיפול ברישום לוקר חדש
   */
  private async handleLockerRegistration(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    const clientIP = (ws as any)._socket?.remoteAddress || 'unknown';
    const clientPort = (ws as any)._socket?.remotePort || 0;
    
    console.log('📝 עיבוד רישום לוקר:', {
      lockerId: data.id,
      clientIP,
      clientPort,
      isAllowed: data.id && CONFIG.ALLOWED_LOCKER_IDS.includes(data.id),
      allowedLockers: CONFIG.ALLOWED_LOCKER_IDS,
      cells: data.cells,
      timestamp: new Date().toISOString()
    });
    
    if (data.id && CONFIG.ALLOWED_LOCKER_IDS.includes(data.id)) {
      try {
        // עדכון או יצירת לוקר ב-DB
        // במצב Mock - רק לוג הרישום
        
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
        
        console.log(`📡 נרשם לוקר ${data.id} מכתובת ${clientIP}`);
        this.logEvent('register', `📡 נרשם לוקר ${data.id} מכתובת ${clientIP}`, {
          lockerId: data.id,
          clientIP,
          clientPort,
          timestamp: new Date().toISOString()
        });
        
        this.broadcastStatus();
      } catch (error) {
        console.error(`❌ שגיאה ברישום לוקר ${data.id}:`, error);
        this.logEvent('error', `❌ שגיאה ברישום לוקר ${data.id}`, { 
          error: error instanceof Error ? error.message : 'שגיאה לא ידועה',
          lockerId: data.id,
          clientIP,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.log('❌ רישום לוקר נדחה:', {
        lockerId: data.id,
        isAllowed: data.id && CONFIG.ALLOWED_LOCKER_IDS.includes(data.id),
        allowedLockers: CONFIG.ALLOWED_LOCKER_IDS,
        clientIP,
        timestamp: new Date().toISOString()
      });
      this.logEvent('register_rejected', `❌ רישום לוקר נדחה`, {
        lockerId: data.id,
        clientIP,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * טיפול בזיהוי ממשק ניהול
   */
  private handleAdminIdentification(ws: LockerConnection, data: WebSocketMessage): void {
    const clientIP = (ws as any)._socket?.remoteAddress || 'unknown';
    
    console.log('🔍 בדיקת זיהוי מנהל:', {
      client: data.client,
      secret: data.secret,
      expectedSecret: CONFIG.ADMIN_SECRET,
      isMatch: data.client === 'web-admin' && data.secret === CONFIG.ADMIN_SECRET,
      clientIP,
      timestamp: new Date().toISOString()
    });
    
    if (data.client === 'web-admin' && data.secret === CONFIG.ADMIN_SECRET) {
      ws.isAdmin = true;
      this.adminConnections.add(ws);
      
      console.log('✅ ממשק ניהול לוקרים מזוהה התחבר');
      this.logEvent('admin', '✅ ממשק ניהול לוקרים מזוהה התחבר', {
        clientIP,
        timestamp: new Date().toISOString()
      });
      
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
      console.log('❌ זיהוי מנהל נכשל:', {
        client: data.client,
        secret: data.secret,
        expectedSecret: CONFIG.ADMIN_SECRET,
        clientIP,
        timestamp: new Date().toISOString()
      });
      this.logEvent('warning', '⚠️ ניסיון זיהוי ממשק ניהול נכשל', {
        clientIP,
        timestamp: new Date().toISOString()
      });
      ws.close();
    }
  }

  /**
   * טיפול בבקשת סטטוס
   */
  private handleGetStatus(ws: LockerConnection, data: WebSocketMessage): void {
    console.log('📊 שליחת סטטוס למנהל:', {
      adminConnections: this.adminConnections.size,
      lockerConnections: this.lockerConnections.size,
      timestamp: new Date().toISOString()
    });
    
    const status = {
      type: 'statusResponse',
      success: true,
      connectedLockers: this.lockerConnections.size,
      lockers: this.getLockerStates(),
      serverTime: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(status));
    console.log('📤 נשלח סטטוס למנהל');
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
    const cellId = data.cellId || data.cellCode;
    
    console.log('🔍 בדיקת בקשה לפתיחת תא:', {
      isAdmin: ws.isAdmin,
      lockerId: data.lockerId,
      cellId: cellId,
      cellCode: data.cellCode,
      hasLockerId: !!data.lockerId,
      hasCellId: !!(cellId || data.cellCode),
      timestamp: new Date().toISOString()
    });

    if (ws.isAdmin && data.lockerId && (cellId || data.cellCode)) {
      console.log('✅ תנאי פתיחת תא תקין - ממשיך');
    } else {
      console.log('❌ תנאי פתיחת תא לא תקין:', {
        isAdmin: ws.isAdmin,
        hasLockerId: !!data.lockerId,
        hasCellId: !!(cellId || data.cellCode)
      });
    }
    
    if (ws.isAdmin && data.lockerId && (cellId || data.cellCode)) {
      try {
        // במצב Mock - בדיקה בסיסית
        this.logEvent('unlock_request', `🔓 בקשת פתיחה לתא ${cellId || data.cellCode} בלוקר ${data.lockerId}`, {
          lockerId: data.lockerId,
          cellId: cellId || data.cellCode,
          timestamp: new Date().toISOString(),
          adminIP: (ws as any)._socket?.remoteAddress || 'unknown'
        });

        console.log(`📤 שולח פקודת פתיחה ללוקר ${data.lockerId} לתא ${cellId || data.cellCode}`);

        // שליחת פקודה ללוקר
        const success = this.sendToLockerInternal(data.lockerId, {
          type: 'unlock',
          cellId: cellId || data.cellCode
        });

        if (success) {
          this.logEvent('unlock_success', `✅ נפתח תא ${cellId || data.cellCode} בלוקר ${data.lockerId}`, {
            lockerId: data.lockerId,
            cellId: cellId || data.cellCode,
            timestamp: new Date().toISOString()
          });
          console.log(`✅ פתיחת תא ${cellId || data.cellCode} בלוקר ${data.lockerId} הצליחה`);
          
          // שליחת תגובה למנהל
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            status: 'success',
            lockerId: data.lockerId,
            cellId: cellId || data.cellCode,
            message: `תא ${cellId || data.cellCode} נפתח בהצלחה`
          }));
        } else {
          this.logEvent('unlock_failed', `❌ כישלון בפתיחת תא ${cellId || data.cellCode} - לוקר לא מחובר`, {
            lockerId: data.lockerId,
            cellId: cellId || data.cellCode,
            timestamp: new Date().toISOString(),
            availableLockers: Array.from(this.lockerConnections.keys())
          });
          console.log(`❌ כישלון בפתיחת תא ${cellId || data.cellCode} - לוקר ${data.lockerId} לא מחובר`);
          
          // שליחת תגובת שגיאה למנהל
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            status: 'failed',
            lockerId: data.lockerId,
            cellId: cellId || data.cellCode,
            message: 'הלוקר לא מחובר למערכת'
          }));
        }
              } catch (error) {
          this.logEvent('error', `❌ שגיאה בפתיחת תא ${cellId || data.cellCode}`, { 
            error: error instanceof Error ? error.message : 'שגיאה לא ידועה',
            lockerId: data.lockerId,
            cellId: cellId || data.cellCode,
            timestamp: new Date().toISOString()
          });
          console.error(`❌ שגיאה בפתיחת תא ${cellId || data.cellCode}:`, error);
        }
      } else {
        console.log('⚠️ בקשה לא תקינה לפתיחת תא:', {
          isAdmin: ws.isAdmin,
          lockerId: data.lockerId,
          cellId: cellId,
          cellCode: data.cellCode
        });
        this.logEvent('unlock_invalid_request', `⚠️ בקשה לא תקינה לפתיחת תא`, {
          isAdmin: ws.isAdmin,
          lockerId: data.lockerId,
          cellId: cellId || data.cellCode,
          timestamp: new Date().toISOString()
        });
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
        const success = this.sendToLockerInternal(data.lockerId, {
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
    
    console.log('🔐 בדיקת טוקן לקוח:', {
      packageId,
      hasToken: !!clientToken,
      tokenLength: clientToken?.length || 0
    });
    
    // כרגע - בדיקה בסיסית שהטוקן קיים
    if (!clientToken) {
      console.log('❌ טוקן לקוח חסר');
      this.logEvent('auth_failed', `❌ טוקן לקוח חסר לחבילה ${packageId}`);
      return false;
    }
    
    // בדיקה בסיסית - הטוקן צריך להיות באורך סביר
    if (clientToken.length < 6) {
      console.log('❌ טוקן לקוח קצר מדי');
      this.logEvent('auth_failed', `❌ טוקן לקוח לא תקין לחבילה ${packageId}`);
      return false;
    }
    
    console.log('✅ טוקן לקוח תקין');
    this.logEvent('auth_success', `✅ אימות לקוח הצליח לחבילה ${packageId}`);
    return true;
  }

  /**
   * טיפול בהודעת כישלון פתיחה מהלוקר
   */
  private async handleFailedToUnlock(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    try {
      const lockerId = data.id;
      const cell = data.cell;
      const reason = data.reason;

      this.logEvent('unlock_failed', `❌ כישלון בפתיחת תא ${cell} בלוקר ${lockerId}`, {
        lockerId,
        cell,
        reason
      });

      // שליחת עדכון למנהלים
      this.broadcastToAdmins({
        type: 'cellOperationResult',
        lockerId,
        cell,
        operation: 'unlock',
        success: false,
        reason,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logEvent('error', `❌ שגיאה בעיבוד הודעת כישלון פתיחה`, { error });
    }
  }

  /**
   * טיפול בהודעת סגירת תא מהלוקר
   */
  private async handleCellClosed(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    try {
      const lockerId = data.id;
      const cell = data.cell;
      const status = data.status;

      this.logEvent('cell_closed', `🔒 תא ${cell} בלוקר ${lockerId} ${status === 'closed' ? 'נסגר' : 'נפתח'}`, {
        lockerId,
        cell,
        status
      });

      // עדכון סטטוס התא במטמון המקומי
      if (ws.cells && cell) {
        ws.cells[cell] = {
          locked: status === 'closed',
          opened: status === 'open',
          hasPackage: false,
          lastUpdate: new Date()
        };
      }

      // שליחת עדכון למנהלים
      this.broadcastToAdmins({
        type: 'cellStatusUpdate',
        lockerId,
        cell,
        status,
        timestamp: Date.now()
      });

      // שליחת אישור סגירה ל-ESP32
      if (status === 'closed') {
        const confirmMessage = {
          type: 'confirmClose',
          id: lockerId,
          cell: cell
        };
        
        ws.send(JSON.stringify(confirmMessage));
        this.logEvent('confirm_close', `✅ נשלח אישור סגירה לתא ${cell} בלוקר ${lockerId}`, {
          lockerId,
          cell
        });
      }

    } catch (error) {
      this.logEvent('error', `❌ שגיאה בעיבוד הודעת סגירת תא`, { error });
    }
  }

  /**
   * טיפול בתגובת פתיחה מהלוקר
   */
  private async handleOpenResponse(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    console.log('📦 התקבלה תגובת פתיחה מהלוקר:', {
      type: data.type,
      lockerId: data.lockerId,
      cellId: data.cellId,
      packageId: data.packageId,
      timestamp: new Date().toISOString(),
      source: 'Railway'
    });
    
    try {
      const isSuccess = data.type === 'openSuccess';
      const lockerId = data.lockerId;
      const cellId = data.cellId;
      const packageId = data.packageId;
      const clientToken = data.clientToken;

      console.log('🔍 עיבוד תגובת פתיחה:', {
        isSuccess,
        lockerId,
        cellId,
        packageId,
        hasClientToken: !!clientToken
      });

      this.logEvent('open_response', `📦 תגובת פתיחה מהלוקר ${lockerId}`, {
        success: isSuccess,
        lockerId,
        cellId,
        packageId,
        clientToken
      });

      // שליחת עדכון למנהלים
      this.broadcastToAdmins({
        type: 'cellOperationResult',
        lockerId,
        cellId,
        operation: 'open',
        success: isSuccess,
        packageId,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logEvent('error', `❌ שגיאה בעיבוד תגובת פתיחה`, { error });
    }
  }

  /**
   * טיפול בבקשה מלקוח לפתיחת תא
   */
  private async handleClientOpenRequest(ws: LockerConnection, data: WebSocketMessage): Promise<void> {
    console.log('🔍 בדיקת בקשה מלקוח לפתיחת תא:', {
      hasLockerId: !!data.lockerId,
      hasCellId: !!data.cellId,
      hasPackageId: !!data.packageId,
      lockerId: data.lockerId,
      cellId: data.cellId,
      packageId: data.packageId,
      timestamp: new Date().toISOString(),
      source: 'Railway'
    });
    
    if (data.lockerId && data.cellId && data.packageId) {
      try {
        // בדיקת אימות לקוח
        console.log('🔐 בדיקת אימות לקוח:', {
          packageId: data.packageId,
          hasClientToken: !!data.clientToken,
          clientTokenLength: data.clientToken?.length || 0
        });
        
        const tokenValid = this.validateClientToken(data.packageId, data.clientToken);
        if (!tokenValid) {
          console.log('❌ אימות לקוח נכשל');
          ws.send(JSON.stringify({
            type: 'unlockResponse',
            status: 'error',
            error: 'Invalid client token'
          }));
          return;
        }
        
        console.log('✅ אימות לקוח הצליח');

        // בדוק אם הלוקר מחובר
        console.log(`📤 שולח פקודת openByClient ללוקר ${data.lockerId} לתא ${data.cellId}`);
        const unlockMessage = {
          type: 'openByClient',
          lockerId: data.lockerId,
          cellId: data.cellId,
          packageId: data.packageId,
          clientToken: data.clientToken
        };
        console.log('📤 הודעת openByClient:', unlockMessage);
        console.log('🔍 בדיקת חיבורי לוקרים:', {
          totalConnections: this.lockerConnections.size,
          lockerExists: this.lockerConnections.has(data.lockerId),
          connectedLockers: Array.from(this.lockerConnections.keys())
        });
        const success = this.sendToLockerInternal(data.lockerId, unlockMessage);

        if (success) {
          console.log(`✅ פקודת openByClient נשלחה בהצלחה ללוקר ${data.lockerId}`);
          this.logEvent('client_unlock', `📦 לקוח פתח תא ${data.cellId} בלוקר ${data.lockerId}`, {
            lockerId: data.lockerId,
            cellId: data.cellId,
            packageId: data.packageId
          });

          // החזר אישור ללקוח
          const response = {
            type: 'unlockResponse',
            status: 'success',
            lockerId: data.lockerId,
            cellId: data.cellId,
            message: `תא ${data.cellId} נפתח בהצלחה`
          };
          console.log('📤 מחזיר תגובה ללקוח:', response);
          ws.send(JSON.stringify(response));
          
          // שליחת עדכון למנהלים
          this.broadcastToAdmins({
            type: 'cellOperationResult',
            lockerId: data.lockerId,
            cellId: data.cellId,
            operation: 'open',
            success: true,
            packageId: data.packageId,
            timestamp: Date.now()
          });
        } else {
          console.log(`❌ לוקר ${data.lockerId} לא מחובר - לא ניתן לשלוח פקודת openByClient`);
          this.logEvent('client_unlock_failed', `❌ לוקר ${data.lockerId} לא מחובר`);
          const errorResponse = {
            type: 'unlockResponse',
            status: 'failed',
            reason: 'Locker not connected',
            message: 'הלוקר לא מחובר למערכת'
          };
          console.log('📤 מחזיר תגובת שגיאה ללקוח:', errorResponse);
          ws.send(JSON.stringify(errorResponse));
          
          // שליחת עדכון שגיאה למנהלים
          this.broadcastToAdmins({
            type: 'cellOperationResult',
            lockerId: data.lockerId,
            cellId: data.cellId,
            operation: 'open',
            success: false,
            packageId: data.packageId,
            error: 'Locker not connected',
            timestamp: Date.now()
          });
        }

      } catch (error) {
        console.error('❌ שגיאה בפתיחת תא ע"י לקוח:', error);
        this.logEvent('error', `❌ שגיאה בפתיחת תא ע"י לקוח`, { error });
        ws.send(JSON.stringify({
          type: 'unlockResponse',
          status: 'error',
          error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
        }));
      }
          } else {
        console.log('⚠️ בקשה לא תקינה מלקוח - חסרים פרמטרים');
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
    const clientIP = (ws as any)._socket?.remoteAddress || 'unknown';
    const clientPort = (ws as any)._socket?.remotePort || 0;
    
    console.log('🔌 ניתוק חיבור:', {
      isAdmin: ws.isAdmin,
      lockerId: ws.lockerId,
      clientIP,
      clientPort,
      timestamp: new Date().toISOString(),
      totalConnections: this.wss.clients.size
    });
    
    if (ws.isAdmin) {
      this.adminConnections.delete(ws);
      console.log('👤 ממשק ניהול לוקרים התנתק');
      this.logEvent('disconnect', '👤 ממשק ניהול לוקרים התנתק', {
        clientIP,
        clientPort,
        timestamp: new Date().toISOString()
      });
    } else if (ws.lockerId) {
      try {
        // במצב Mock - רק לוג ההתנתקות
        console.log(`🔌 נותק לוקר ${ws.lockerId}`);
        
        this.logEvent('locker_disconnect', `🔌 נותק לוקר ${ws.lockerId}`, {
          lockerId: ws.lockerId,
          lastSeen: ws.lastSeen,
          clientIP,
          clientPort,
          timestamp: new Date().toISOString()
        });

        this.lockerConnections.delete(ws.lockerId);
        this.logEvent('disconnect', `🔌 נותק לוקר ${ws.lockerId}`);
        this.broadcastStatus();
      } catch (error) {
        console.error(`❌ שגיאה בעדכון סטטוס לוקר ${ws.lockerId}:`, error);
        this.logEvent('error', `❌ שגיאה בעדכון סטטוס לוקר ${ws.lockerId}`, { error });
      }
    } else {
      console.log('🔌 חיבור לא מזוהה התנתק');
      this.logEvent('disconnect', '🔌 חיבור לא מזוהה התנתק', {
        clientIP,
        clientPort,
        timestamp: new Date().toISOString()
      });
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
  private sendToLockerInternal(id: string, messageObj: any): boolean {
    const conn = this.lockerConnections.get(id);
    
    console.log('📤 ניסיון שליחה ללוקר:', {
      lockerId: id,
      messageType: messageObj.type,
      hasConnection: !!conn,
      connectionState: conn?.readyState,
      totalConnections: this.lockerConnections.size,
      connectedLockers: Array.from(this.lockerConnections.keys()),
      timestamp: new Date().toISOString()
    });
    
    this.logEvent('send_attempt', `📤 ניסיון שליחה ללוקר ${id}`, {
      lockerId: id,
      messageType: messageObj.type,
      hasConnection: !!conn,
      connectionState: conn?.readyState,
      totalConnections: this.lockerConnections.size,
      connectedLockers: Array.from(this.lockerConnections.keys())
    });
    
    if (conn?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(messageObj);
      conn.send(messageStr);
      
      console.log('✅ הודעה נשלחה ללוקר:', {
        lockerId: id,
        messageType: messageObj.type,
        messageLength: messageStr.length,
        timestamp: new Date().toISOString()
      });
      
      this.logEvent('send_success', `✅ הודעה נשלחה ללוקר ${id}`, {
        lockerId: id,
        messageType: messageObj.type
      });
      return true;
    } else {
      console.log('❌ לוקר לא מחובר:', {
        lockerId: id,
        hasConnection: !!conn,
        connectionState: conn?.readyState,
        availableLockers: Array.from(this.lockerConnections.keys()),
        timestamp: new Date().toISOString()
      });
      
      this.logEvent('send_failed', `🚫 לוקר ${id} לא מחובר`, {
        lockerId: id,
        hasConnection: !!conn,
        connectionState: conn?.readyState,
        availableLockers: Array.from(this.lockerConnections.keys())
      });
      return false;
    }
  }

  /**
   * שליחת הודעה ללוקר ספציפי (מתודה ציבורית)
   */
  public sendToLocker(id: string, messageObj: any): boolean {
    return this.sendToLockerInternal(id, messageObj);
  }

  /**
   * שליחת הודעה ללוקר עם תוצאה מפורטת
   */
  public async sendMessageToLocker(id: string, messageObj: any): Promise<{ success: boolean; error?: string }> {
    try {
      const success = this.sendToLockerInternal(id, messageObj);
      if (success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `לוקר ${id} לא מחובר או לא זמין` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה' 
      };
    }
  }

  /**
   * שליחת הודעה ללוקר עם המתנה לתגובה
   */
  public async sendToLockerWithResponse(id: string, messageObj: any, timeout: number = 10000): Promise<any> {
    this.logEvent('send_with_response', `📤 ניסיון שליחה עם תגובה ללוקר ${id}`, {
      lockerId: id,
      messageType: messageObj.type,
      totalConnections: this.lockerConnections.size,
      availableLockers: Array.from(this.lockerConnections.keys())
    });
    
    const connection = this.lockerConnections.get(id);
    if (!connection) {
      this.logEvent('send_failed_no_connection', `🚫 לוקר ${id} לא נמצא ברשימת החיבורים`, {
        lockerId: id,
        availableLockers: Array.from(this.lockerConnections.keys())
      });
      return { success: false, message: 'Locker not found in connections' };
    }
    
    if (connection.readyState !== WebSocket.OPEN) {
      this.logEvent('send_failed_not_open', `🚫 לוקר ${id} לא מחובר (סטטוס: ${connection.readyState})`, {
        lockerId: id,
        connectionState: connection.readyState
      });
      return { success: false, message: `Locker not connected (state: ${connection.readyState})` };
    }

    // שליחת ההודעה
    connection.send(JSON.stringify(messageObj));
    
    this.logEvent('send_success_with_response', `✅ הודעה נשלחה ללוקר ${id}`, {
      lockerId: id,
      messageType: messageObj.type
    });
    
    // כרגע נחזיר הצלחה בלי לחכות לתגובה
    // TODO: להוסיף מערכת המתנה לתגובה
    return { success: true, message: 'Message sent to locker' };
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
    
    console.log('📤 שולח עדכון סטטוס למנהלים:', {
      adminConnections: this.adminConnections.size,
      messageType: message.type,
      timestamp: new Date().toISOString()
    });
    
    let sentCount = 0;
    for (const client of this.adminConnections) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        sentCount++;
      }
    }
    
    console.log(`📤 נשלח עדכון סטטוס ל-${sentCount} מנהלים`);
  }

  /**
   * קבלת סטטוס כל הלוקרים
   */
  private getLockerStates(): Record<string, any> {
    const states: Record<string, any> = {};
    
    console.log('📊 בדיקת סטטוס לוקרים:', {
      totalConnections: this.lockerConnections.size,
      connectedLockers: Array.from(this.lockerConnections.keys()),
      timestamp: new Date().toISOString()
    });
    
    this.logEvent('status_check', `📊 בדיקת סטטוס לוקרים`, {
      totalConnections: this.lockerConnections.size,
      connectedLockers: Array.from(this.lockerConnections.keys())
    });
    
    for (const [id, ws] of this.lockerConnections) {
      const isOnline = ws.readyState === WebSocket.OPEN;
      states[id] = {
        isOnline,
        lastSeen: ws.lastSeen || new Date(),
        cells: ws.cells || {},
        connectionState: ws.readyState
      };
      
      console.log(`📡 סטטוס לוקר ${id}:`, {
        isOnline,
        connectionState: ws.readyState,
        lastSeen: ws.lastSeen,
        cellsCount: Object.keys(ws.cells || {}).length
      });
      
      this.logEvent('locker_status', `📡 סטטוס לוקר ${id}`, {
        lockerId: id,
        isOnline,
        connectionState: ws.readyState,
        lastSeen: ws.lastSeen
      });
    }
    
    return states;
  }

  /**
   * התחלת משימות תקופתיות
   */
  private startPeriodicTasks(): void {
    // בדיקת חיבורים חיים
    this.heartbeatInterval = setInterval(() => {
      console.log('💓 בדיקת חיבורים חיים:', {
        totalClients: this.wss.clients.size,
        timestamp: new Date().toISOString()
      });
      
      let terminatedCount = 0;
      this.wss.clients.forEach((ws: LockerConnection) => {
        if (!ws.isAlive) {
          console.log('💔 ניתוק חיבור לא מגיב');
          this.logEvent('heartbeat', '💔 ניתוק חיבור לא מגיב');
          ws.terminate();
          terminatedCount++;
        } else {
          ws.isAlive = false;
          ws.ping();
        }
      });
      
      if (terminatedCount > 0) {
        console.log(`💔 נותקו ${terminatedCount} חיבורים לא מגיבים`);
      }
    }, CONFIG.HEARTBEAT_INTERVAL);

    // שליחת עדכוני סטטוס
    this.statusInterval = setInterval(() => {
      console.log('📊 שליחת עדכון סטטוס אוטומטי');
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
    console.log('🔍 בודק חיבורי ESP32...');
    this.logEvent('monitoring', '🔍 בדיקת חיבורי ESP32');
    
    const status = esp32Controller.getAllStatus();
    let connectedDevices = 0;
    
    console.log('📊 סטטוס מכשירי ESP32:', {
      totalDevices: Object.keys(status).length,
      devices: Object.keys(status),
      timestamp: new Date().toISOString()
    });
    
    for (const [lockerId, device] of Object.entries(status)) {
      if (device.isOnline) {
        connectedDevices++;
        console.log(`✅ לוקר ${lockerId} מחובר (${device.ip})`);
        this.logEvent('device_status', `✅ לוקר ${lockerId} מחובר`, {
          lockerId,
          ip: device.ip,
          status: 'ONLINE',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`❌ לוקר ${lockerId} לא מגיב (${device.ip})`);
        this.logEvent('device_status', `❌ לוקר ${lockerId} לא מגיב`, {
          lockerId,
          ip: device.ip,
          status: 'offline',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log(`📊 סה"כ לוקרים מחוברים: ${connectedDevices}/${Object.keys(status).length}`);
    this.logEvent('monitoring_summary', '📊 סה"כ לוקרים מחוברים', {
      connectedDevices,
      totalDevices: Object.keys(status).length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * הפעלת השרת
   */
  public start(): void {
    this.server.listen(CONFIG.PORT, () => {
      console.log('🚀 שרת הלוקרים פועל:', {
        port: CONFIG.PORT,
        ssl: CONFIG.USE_SSL,
        esp32_devices: CONFIG.ESP32_DEVICES,
        allowed_locker_ids: CONFIG.ALLOWED_LOCKER_IDS,
        timestamp: new Date().toISOString()
      });
      
      this.logEvent('server_start', `🚀 שרת הלוקרים פועל על פורט ${CONFIG.PORT}`, {
        port: CONFIG.PORT,
        ssl: CONFIG.USE_SSL,
        esp32_devices: CONFIG.ESP32_DEVICES,
        allowed_locker_ids: CONFIG.ALLOWED_LOCKER_IDS
      });
      
      console.log(`🚀 שרת WebSocket פועל על פורט ${CONFIG.PORT}`);
      console.log(`📡 לוקרים מורשים: ${CONFIG.ALLOWED_LOCKER_IDS.join(', ')}`);
      console.log(`🔧 מצב SSL: ${CONFIG.USE_SSL ? 'פעיל' : 'לא פעיל'}`);
    });

    // טיפול בסגירה נאותה
    process.on('SIGINT', () => {
      console.log('🛑 קבלת אות SIGINT - סגירת שרת...');
      this.stop();
    });
  }

  /**
   * עצירת השרת
   */
  public stop(): void {
    console.log('🛑 מתחיל סגירת שרת...', {
      lockerConnections: this.lockerConnections.size,
      adminConnections: this.adminConnections.size,
      timestamp: new Date().toISOString()
    });
    
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
    
    console.log('✅ ניקוי טיימרים וחיבורים הושלם');
    
    // סגירת שרת
    this.server.close(() => {
      console.log('✅ השרת נסגר בהצלחה');
      this.logEvent('server_stop', '✅ השרת נסגר בהצלחה');
      process.exit(0);
    });
  }

  /**
   * רישום לוג
   */
  private logEvent(type: string, message: string, data: any = {}): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      message,
      ...data
    };
    
    console.log(JSON.stringify(logEntry));
  }

  /**
   * שליחת עדכון למנהלים
   */
  private broadcastToAdmins(message: any): void {
    console.log('📤 שולח עדכון למנהלים:', {
      messageType: message.type,
      adminConnections: this.adminConnections.size,
      timestamp: new Date().toISOString()
    });
    
    let sentCount = 0;
    for (const client of this.adminConnections) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        sentCount++;
      }
    }
    
    console.log(`📤 נשלח עדכון ל-${sentCount} מנהלים`);
  }
}

// יצירת מופע יחיד של המחלקה
const wsManager = new WebSocketManager();

// הפעלה אוטומטית של השרת בסביבת development או production
if (typeof window === 'undefined') {
  // רק בצד השרת
  console.log('🚀 מפעיל שרת WebSocket אוטומטית...', {
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
  try {
    wsManager.start();
    console.log('✅ שרת WebSocket הופעל בהצלחה');
  } catch (error) {
    console.error('❌ שגיאה בהפעלת שרת WebSocket:', error);
  }
}

// ייצוא לשימוש במודולים אחרים
export default wsManager; 