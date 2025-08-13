// שידור עדכוני סטטוס לכל הלקוחות - זהה לשרת הישן

import { getLockerStates, getAdminConnectionsCount } from '@/lib/locker-connections'

// רשימת חיבורי SSE פעילים (במקום WebSocket)
const activeSSEConnections = new Set<ReadableStreamDefaultController>();

// הוספת חיבור SSE חדש
export function addSSEConnection(controller: ReadableStreamDefaultController) {
  activeSSEConnections.add(controller);
  console.log(`📡 חיבור SSE חדש נוסף (סה"כ: ${activeSSEConnections.size})`);
  
  // שליחת סטטוס ראשוני מיד
  broadcastStatus();
}

// הסרת חיבור SSE
export function removeSSEConnection(controller: ReadableStreamDefaultController) {
  activeSSEConnections.delete(controller);
  console.log(`📡 חיבור SSE הוסר (סה"כ: ${activeSSEConnections.size})`);
}

// שליחת הודעה לכל הלקוחות המחוברים (כמו בשרת הישן)
export function broadcastToAllClients(message: any) {
  const messageStr = JSON.stringify(message);
  const sseData = `data: ${messageStr}\n\n`;
  
  // שליחה לכל חיבורי SSE
  for (const controller of activeSSEConnections) {
    try {
      controller.enqueue(new TextEncoder().encode(sseData));
    } catch (error) {
      console.error('❌ שגיאה בשליחת SSE:', error);
      // הסרת חיבור שבור
      activeSSEConnections.delete(controller);
    }
  }
  
  if (activeSSEConnections.size > 0) {
    console.log(`📤 שודר עדכון ל-${activeSSEConnections.size} לקוחות`);
  }
}

// פונקציה לשליחת עדכון סטטוס לכל ממשקי הניהול (זהה לשרת הישן)
export function broadcastStatus() {
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
  
  // שידור לכל הלקוחות
  broadcastToAllClients(message);
}

// שידור הודעת כישלון/הצלחה בפתיחת תא (כמו בשרת הישן)
export function broadcastCellOperation(
  lockerId: string, 
  cellId: string, 
  operation: 'unlock' | 'lock', 
  success: boolean,
  message?: string
) {
  const broadcastMessage = {
    type: 'cellOperation',
    data: {
      lockerId,
      cellId,
      operation,
      success,
      message: message || `תא ${cellId} ${operation === 'unlock' ? 'נפתח' : 'ננעל'} ${success ? 'בהצלחה' : 'עם כישלון'} בלוקר ${lockerId}`,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  };
  
  broadcastToAllClients(broadcastMessage);
}

// שידור הודעת חיבור/ניתוק לוקר (כמו בשרת הישן)
export function broadcastLockerConnection(lockerId: string, connected: boolean, ip?: string) {
  const message = {
    type: 'lockerConnection',
    data: {
      lockerId,
      connected,
      ip,
      message: `לוקר ${lockerId} ${connected ? 'התחבר' : 'התנתק'}${ip ? ` מכתובת ${ip}` : ''}`,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  };
  
  broadcastToAllClients(message);
  
  // עדכון סטטוס כללי אחרי שינוי חיבור
  setTimeout(broadcastStatus, 100);
}

// שידור הודעת שגיאה לכל הלקוחות
export function broadcastError(error: string, details?: any) {
  const message = {
    type: 'error',
    data: {
      error,
      details,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  };
  
  broadcastToAllClients(message);
}

// שידור הודעות כלליות (כמו בשרת הישן)
export function broadcastMessage(type: string, data: any) {
  const message = {
    type,
    data: {
      ...data,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  };
  
  broadcastToAllClients(message);
}

// מידע על חיבורים פעילים
export function getConnectionStats() {
  return {
    sseConnections: activeSSEConnections.size,
    adminConnections: getAdminConnectionsCount(),
    totalActiveConnections: activeSSEConnections.size
  };
}

// הפעלת שידור אוטומטי כל 30 שניות (כמו בשרת הישן)
setInterval(() => {
  if (activeSSEConnections.size > 0) {
    console.log('📊 שליחת עדכון סטטוס אוטומטי');
    broadcastStatus();
  }
}, 30000);

// ניקוי תקופתי של חיבורים שבורים
setInterval(() => {
  const initialSize = activeSSEConnections.size;
  
  // בדיקה של כל החיבורים
  for (const controller of activeSSEConnections) {
    try {
      // ניסיון שליחת ping
      controller.enqueue(new TextEncoder().encode(': ping\n\n'));
    } catch (error) {
      // הסרת חיבור שבור
      activeSSEConnections.delete(controller);
    }
  }
  
  const removedConnections = initialSize - activeSSEConnections.size;
  if (removedConnections > 0) {
    console.log(`🧹 נוקו ${removedConnections} חיבורי SSE שבורים`);
  }
}, 60000); // כל דקה
