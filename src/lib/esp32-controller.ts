import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';

// קונפיגורציה
const CONFIG = {
  PING_INTERVAL: 30000,          // 30 שניות
  CONNECTION_TIMEOUT: 60000,     // 60 שניות
  ALLOWED_LOCKER_IDS: ['LOC632', 'LOC720'], // רשימת לוקרים מורשים
  RECONNECT_ATTEMPTS: 3,         // מספר ניסיונות חיבור מחדש
  DEBUG_MODE: process.env.NODE_ENV === 'development'
};

// טיפוסים
interface LockerCell {
  locked: boolean;
  opened: boolean;
  packageId?: string;
  timestamp: Date;
}

interface LockerConnection {
  ws: WebSocket;
  lastSeen: Date;
  status: 'connected' | 'disconnected' | 'error';
  cells: Record<string, LockerCell>;
  ip?: string;
  reconnectAttempts: number;
}

/**
 * מחלקה לניהול חיבור ל-ESP32 דרך WebSocket
 */
class ESP32Controller {
  private lockerConnections: Map<string, LockerConnection>;
  private statusUpdateInterval: NodeJS.Timeout | null;
  private prisma: PrismaClient | null;
  private adminConnections: Set<WebSocket>;

  constructor() {
    this.lockerConnections = new Map();
    this.statusUpdateInterval = null;
    this.adminConnections = new Set();
    
    try {
      this.prisma = new PrismaClient();
      this.log('✅ התחברות למסד הנתונים הצליחה');
    } catch (error) {
      this.log('⚠️ לא ניתן להתחבר לדאטהבייס, המערכת תעבוד במצב מוגבל', 'warn');
      this.prisma = null;
    }

    // התחלת בדיקה תקופתית
    this.startPeriodicHealthCheck();
  }

  /**
   * רישום מכשיר ESP32 חדש
   */
  public registerESP32(lockerId: string, ws: WebSocket, ip?: string): boolean {
    // בדיקת הרשאות
    if (!this.validateLocker(lockerId, ws)) {
      return false;
    }

    // רישום החיבור
    this.lockerConnections.set(lockerId, {
      ws,
      lastSeen: new Date(),
      status: 'connected',
      cells: {},
      ip,
      reconnectAttempts: 0
    });
    
    this.log(`📡 נרשם לוקר ${lockerId}${ip ? ` (IP: ${ip})` : ''}`);
    
    // הגדרת מאזינים
    this.setupWebSocketListeners(lockerId, ws);
    
    // שליחת עדכון למנהלים
    this.broadcastToAdmins({
      type: 'register',
      id: lockerId,
      ip,
      status: 'online'
    });

    return true;
  }

  /**
   * רישום חיבור ממשק ניהול
   */
  public registerAdminConnection(ws: WebSocket): void {
    this.adminConnections.add(ws);
    this.log('👤 נרשם חיבור ממשק ניהול חדש');

    // שליחת סטטוס ראשוני
    ws.send(JSON.stringify({
      type: 'status',
      lockers: this.getAllStatus()
    }));

    ws.on('close', () => {
      this.adminConnections.delete(ws);
      this.log('👤 חיבור ממשק ניהול נותק');
    });
  }

  /**
   * פתיחת תא בלוקר
   */
  public async unlockCell(lockerId: string, cellId: string): Promise<boolean> {
    const connection = this.lockerConnections.get(lockerId);
    if (!this.validateConnection(lockerId, connection)) {
      return false;
    }

    try {
      // בדיקה שהחיבור קיים ופעיל
      if (!connection || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
        this.log(`❌ החיבור ללוקר ${lockerId} לא זמין`, 'error');
        return false;
      }

      // שליחת פקודת פתיחה
      connection.ws.send(JSON.stringify({
        type: 'unlock',
        cellId
      }));
      
      this.log(`🔓 נשלחה פקודת פתיחה לתא ${cellId} בלוקר ${lockerId}`);
      
      // עדכון סטטוס מקומי
      connection.cells[cellId] = {
        locked: false,
        opened: true,
        timestamp: new Date()
      };

      // עדכון במסד הנתונים
      await this.updateCellInDB(lockerId, cellId, false);
      
      // שליחת עדכון למנהלים
      this.broadcastToAdmins({
        type: 'cellUpdate',
        lockerId,
        cellId,
        locked: false,
        opened: true
      });

      return true;
    } catch (error) {
      this.log(`❌ שגיאה בשליחת פקודת פתיחה ללוקר ${lockerId}: ${error}`, 'error');
      return false;
    }
  }

  /**
   * נעילת תא בלוקר
   */
  public async lockCell(lockerId: string, cellId: string, packageId?: string): Promise<boolean> {
    const connection = this.lockerConnections.get(lockerId);
    if (!this.validateConnection(lockerId, connection)) {
      return false;
    }

    try {
      // בדיקה שהחיבור קיים ופעיל
      if (!connection || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
        this.log(`❌ החיבור ללוקר ${lockerId} לא זמין`, 'error');
        return false;
      }

      // שליחת פקודת נעילה
      connection.ws.send(JSON.stringify({
        type: 'lock',
        cellId,
        packageId
      }));
      
      this.log(`🔒 נשלחה פקודת נעילה לתא ${cellId} בלוקר ${lockerId}${packageId ? ` עם חבילה ${packageId}` : ''}`);
      
      // עדכון סטטוס מקומי
      connection.cells[cellId] = {
        locked: true,
        opened: false,
        packageId,
        timestamp: new Date()
      };

      // עדכון במסד הנתונים
      await this.updateCellInDB(lockerId, cellId, true, packageId);
      
      // שליחת עדכון למנהלים
      this.broadcastToAdmins({
        type: 'cellUpdate',
        lockerId,
        cellId,
        locked: true,
        opened: false,
        packageId
      });

      return true;
    } catch (error) {
      this.log(`❌ שגיאה בשליחת פקודת נעילה ללוקר ${lockerId}: ${error}`, 'error');
      return false;
    }
  }

  /**
   * קבלת סטטוס כל הלוקרים
   */
  public getAllStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [lockerId, connection] of this.lockerConnections) {
      status[lockerId] = {
        isOnline: connection.ws.readyState === WebSocket.OPEN,
        lastSeen: connection.lastSeen,
        cells: connection.cells || {}
      };
    }
    
    return status;
  }

  /**
   * התחלת בדיקה תקופתית של חיבורים
   */
  private startPeriodicHealthCheck(): void {
    this.statusUpdateInterval = setInterval(() => {
      this.log('🔍 בודק חיבורי ESP32...');
      
      for (const [lockerId, connection] of this.lockerConnections) {
        // בדיקת timeout
        const timeSinceLastSeen = Date.now() - connection.lastSeen.getTime();
        if (timeSinceLastSeen > CONFIG.CONNECTION_TIMEOUT) {
          this.handleDisconnection(lockerId, connection);
          continue;
        }

        // שליחת ping
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify({ type: 'ping' }));
          this.log(`📶 לוקר ${lockerId} תקין`);
        } else {
          this.log(`📶 לוקר ${lockerId} לא מגיב`);
          connection.status = 'disconnected';
          
          // ניסיון חיבור מחדש
          if (connection.reconnectAttempts < CONFIG.RECONNECT_ATTEMPTS) {
            this.attemptReconnect(lockerId, connection);
          }
        }
      }

      // שליחת עדכון סטטוס למנהלים
      this.broadcastToAdmins({
        type: 'status',
        lockers: this.getAllStatus()
      });
    }, CONFIG.PING_INTERVAL);
  }

  /**
   * הפסקת בדיקה תקופתית
   */
  public stopPeriodicHealthCheck(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  /**
   * וולידציה של לוקר
   */
  private validateLocker(lockerId: string, ws: WebSocket): boolean {
    // בדיקת הרשאות
    if (!CONFIG.ALLOWED_LOCKER_IDS.includes(lockerId)) {
      this.log(`⚠️ ניסיון חיבור של לוקר לא מורשה: ${lockerId}`, 'warn');
      ws.close();
      return false;
    }

    // בדיקת תקינות WebSocket
    if (!ws || typeof ws !== 'object') {
      this.log(`❌ חיבור WebSocket לא תקין עבור לוקר ${lockerId}`, 'error');
      return false;
    }

    // בדיקת מתודות נדרשות
    if (typeof ws.on !== 'function' || typeof ws.send !== 'function' || typeof ws.close !== 'function') {
      this.log(`❌ חיבור WebSocket חסר מתודות נדרשות עבור לוקר ${lockerId}`, 'error');
      return false;
    }

    return true;
  }

  /**
   * וולידציה של חיבור קיים
   */
  private validateConnection(lockerId: string, connection?: LockerConnection): boolean {
    if (!connection) {
      this.log(`❌ לוקר ${lockerId} לא נמצא`, 'error');
      return false;
    }

    if (connection.ws.readyState !== WebSocket.OPEN) {
      this.log(`⚠️ החיבור ללוקר ${lockerId} סגור`, 'warn');
      return false;
    }

    return true;
  }

  /**
   * הגדרת מאזינים לחיבור WebSocket
   */
  private setupWebSocketListeners(lockerId: string, ws: WebSocket): void {
    // טיפול בסגירת חיבור
    ws.on('close', (code, reason) => {
      this.log(`🔌 לוקר ${lockerId} התנתק (קוד: ${code}, סיבה: ${reason})`);
      const connection = this.lockerConnections.get(lockerId);
      if (connection) {
        this.handleDisconnection(lockerId, connection);
      }
    });
    
    // טיפול בשגיאות
    ws.on('error', (error) => {
      this.log(`❌ שגיאת WebSocket עם לוקר ${lockerId}: ${error}`, 'error');
      const connection = this.lockerConnections.get(lockerId);
      if (connection) {
        connection.status = 'error';
      }
    });

    // טיפול בהודעות
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        const connection = this.lockerConnections.get(lockerId);
        if (connection) {
          connection.lastSeen = new Date();
        }

        // טיפול בסוגי הודעות
        switch (data.type) {
          case 'pong':
            this.log(`🏓 התקבל pong מ-${lockerId}`);
            break;
          
          case 'cellStatus':
            this.handleCellStatusUpdate(lockerId, data);
            break;
          
          default:
            this.log(`📨 התקבלה הודעה מלוקר ${lockerId}: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        this.log(`❌ שגיאה בפענוח הודעה מלוקר ${lockerId}: ${error}`, 'error');
      }
    });
  }

  /**
   * טיפול בניתוק לוקר
   */
  private handleDisconnection(lockerId: string, connection: LockerConnection): void {
    connection.status = 'disconnected';
    
    // שליחת עדכון למנהלים
    this.broadcastToAdmins({
      type: 'disconnect',
      id: lockerId
    });

    // ניסיון חיבור מחדש
    if (connection.reconnectAttempts < CONFIG.RECONNECT_ATTEMPTS) {
      this.attemptReconnect(lockerId, connection);
    } else {
      this.lockerConnections.delete(lockerId);
    }
  }

  /**
   * ניסיון חיבור מחדש
   */
  private attemptReconnect(lockerId: string, connection: LockerConnection): void {
    connection.reconnectAttempts++;
    this.log(`🔄 ניסיון חיבור מחדש ${connection.reconnectAttempts}/${CONFIG.RECONNECT_ATTEMPTS} ללוקר ${lockerId}`);
    
    // כאן יכול להיות קוד שמנסה ליצור חיבור חדש
  }

  /**
   * טיפול בעדכון סטטוס תא
   */
  private async handleCellStatusUpdate(lockerId: string, data: any): Promise<void> {
    const connection = this.lockerConnections.get(lockerId);
    if (!connection) return;

    // עדכון סטטוס מקומי
    connection.cells[data.cellId] = {
      locked: data.locked,
      opened: data.opened,
      packageId: data.packageId,
      timestamp: new Date()
    };

    // עדכון במסד הנתונים
    await this.updateCellInDB(lockerId, data.cellId, data.locked, data.packageId);
    
    // שליחת עדכון למנהלים
    this.broadcastToAdmins({
      type: 'cellUpdate',
      lockerId,
      ...data
    });
  }

  /**
   * עדכון סטטוס תא במסד הנתונים
   */
  private async updateCellInDB(
    lockerId: string,
    cellId: string,
    locked: boolean,
    packageId?: string
  ): Promise<void> {
    if (!this.prisma) return;

    try {
      // ננסה לעדכן תא קיים לפי lockerId ו-code (cellId)
      const cell = await this.prisma.cell.findFirst({
        where: {
          code: cellId,
          lockerId: parseInt(lockerId)
        }
      });
      if (cell) {
        await this.prisma.cell.update({
          where: { id: cell.id },
          data: {
            isLocked: locked,
            status: locked ? 'LOCKED' : 'UNLOCKED',
            packageId: packageId || null,
            updatedAt: new Date()
          }
        });
      } else {
        await this.prisma.cell.create({
          data: {
            code: cellId,
            lockerId: parseInt(lockerId),
            isLocked: locked,
            status: locked ? 'LOCKED' : 'UNLOCKED',
            packageId: packageId || null,
            size: 'SMALL', // אפשר לעדכן לפי הצורך
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      this.log(`❌ שגיאה בעדכון מסד הנתונים: ${error}`, 'error');
    }
  }

  /**
   * שליחת הודעה לכל ממשקי הניהול
   */
  private broadcastToAdmins(message: any): void {
    const messageStr = JSON.stringify({
      type: 'lockerUpdate',
      data: this.getAllStatus(),
      timestamp: Date.now()
    });
    
    for (const ws of this.adminConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  }

  /**
   * רישום לוג
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!CONFIG.DEBUG_MODE && level === 'info') return;
    
    const timestamp = new Date().toISOString();
    switch (level) {
      case 'warn':
        console.warn(`[${timestamp}] ${message}`);
        break;
      case 'error':
        console.error(`[${timestamp}] ${message}`);
        break;
      default:
        console.log(`[${timestamp}] ${message}`);
    }
  }
}

// יצירת מופע יחיד של המחלקה
const esp32Controller = new ESP32Controller();

// ייצוא לשימוש במודולים אחרים
export default esp32Controller; 