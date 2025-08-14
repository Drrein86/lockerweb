// מעקב חיבורי לוקרים בזמן אמת - דומה לשרת הישן
interface LockerConnection {
  id: string;
  ip?: string;
  lastSeen: Date;
  isOnline: boolean;
  cells: Record<string, {
    size?: string;
    locked: boolean;
    hasPackage: boolean;
    packageId: string | null;
    opened?: boolean;
  }>;
  deviceId?: string;
}

interface AdminConnection {
  id: string;
  secret: string;
  connectedAt: Date;
  lastActivity: Date;
}

// מפות זיכרון גלובליות (כמו בשרת הישן)
const lockerConnections = new Map<string, LockerConnection>();
const adminConnections = new Set<AdminConnection>();
const registeredLockers = new Map<string, LockerConnection>();

// לוקרים ברירת מחדל (כמו בשרת הישן)
const defaultLockers = [
  {
    id: 'LOC632',
    name: 'לוקר ראשי',
    location: 'כניסה ראשית',
    ip: '192.168.0.104',
    deviceId: 'LOC632',
    lastSeen: new Date(),
    isOnline: false,
    cells: {
      'A1': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A2': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A3': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A4': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A5': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A6': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A7': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A8': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A9': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A10': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A11': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A12': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A13': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A14': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A15': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A16': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false }
    }
  },
  {
    id: 'LOC720',
    name: 'לוקר משני',
    location: 'חדר דואר',
    ip: '192.168.0.105',
    deviceId: 'LOC720',
    lastSeen: new Date(),
    isOnline: false,
    cells: {
      'A1': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A2': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A3': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A4': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A5': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A6': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A7': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A8': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A9': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A10': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A11': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A12': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A13': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false },
      'A14': { size: 'MEDIUM', locked: true, hasPackage: false, packageId: null, opened: false },
      'A15': { size: 'LARGE', locked: true, hasPackage: false, packageId: null, opened: false },
      'A16': { size: 'SMALL', locked: true, hasPackage: false, packageId: null, opened: false }
    }
  }
];

// אתחול לוקרים ברירת מחדל
defaultLockers.forEach(locker => {
  registeredLockers.set(locker.id, locker);
  lockerConnections.set(locker.id, locker);
});

// פונקציות ניהול חיבורים (כמו בשרת הישן)
export function registerLocker(id: string, ip?: string, cells?: any): LockerConnection {
  const existingLocker = registeredLockers.get(id) || {
    id,
    ip: undefined,
    lastSeen: new Date(),
    isOnline: true,
    cells: cells || {},
    deviceId: id
  };

  const updatedLocker: LockerConnection = {
    ...existingLocker,
    ip: ip || existingLocker.ip,
    lastSeen: new Date(),
    isOnline: true,
    cells: cells || existingLocker.cells,
    deviceId: id
  };

  lockerConnections.set(id, updatedLocker);
  registeredLockers.set(id, updatedLocker);
  
  console.log(`📡 נרשם לוקר ${id} מכתובת ${ip}`);
  return updatedLocker;
}

export function updateLockerStatus(id: string, cells?: any, status?: string, advancedData?: any) {
  const locker = lockerConnections.get(id);
  if (locker) {
    locker.lastSeen = new Date();
    locker.isOnline = true;
    if (cells) {
      locker.cells = { ...locker.cells, ...cells };
    }
    
    // הוספת נתונים מתקדמים אם סופקו
    if (advancedData) {
      (locker as any).advancedStatus = {
        ...(locker as any).advancedStatus,
        ...advancedData,
        lastUpdate: new Date().toISOString()
      };
    }
    
    lockerConnections.set(id, locker);
    console.log(`🔄 עודכן סטטוס לוקר ${id}${advancedData ? ' (כולל נתונים מתקדמים)' : ''}`);
    return locker;
  }
  return null;
}

export function getLockerStates() {
  const states: Record<string, any> = {};
  
  // מיפוי כל הלוקרים המחוברים (כמו בשרת הישן)
  lockerConnections.forEach((locker, id) => {
    // בדיקה אם הלוקר "מחובר" (נראה בתוך 60 שניות האחרונות)
    const isOnline = (Date.now() - locker.lastSeen.getTime()) < 60000;
    
    states[id] = {
      isOnline,
      lastSeen: locker.lastSeen,
      cells: locker.cells || {},
      ip: locker.ip,
      deviceId: locker.deviceId || id
    };
  });
  
  return states;
}

export function markLockerOffline(id: string) {
  const locker = lockerConnections.get(id);
  if (locker) {
    locker.isOnline = false;
    lockerConnections.set(id, locker);
    console.log(`🔌 נותק לוקר ${id}`);
  }
}

export function isLockerOnline(id: string): boolean {
  const locker = lockerConnections.get(id);
  if (!locker) return false;
  
  // לוקר נחשב מחובר אם נראה בתוך 60 שניות האחרונות
  return (Date.now() - locker.lastSeen.getTime()) < 60000;
}

export function getAllConnectedLockers() {
  const connected: string[] = [];
  lockerConnections.forEach((locker, id) => {
    if (isLockerOnline(id)) {
      connected.push(id);
    }
  });
  return connected;
}

// פונקציות Admin (כמו בשרת הישן)
export function addAdminConnection(secret: string) {
  const adminId = `admin_${Date.now()}`;
  const admin = {
    id: adminId,
    secret,
    connectedAt: new Date(),
    lastActivity: new Date()
  };
  
  adminConnections.add(admin);
  console.log('✅ ממשק ניהול לוקרים מזוהה התחבר');
  return admin;
}

export function removeAdminConnection(adminId: string) {
  for (const admin of adminConnections) {
    if (admin.id === adminId) {
      adminConnections.delete(admin);
      console.log('👤 ממשק ניהול לוקרים התנתק');
      break;
    }
  }
}

export function getAdminConnectionsCount() {
  return adminConnections.size;
}

// פונקציה לניקוי לוקרים שלא נראו זמן רב
export function cleanupInactiveLockers() {
  const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 דקות
  
  lockerConnections.forEach((locker, id) => {
    if (locker.lastSeen.getTime() < cutoffTime) {
      locker.isOnline = false;
      console.log(`🕰️ לוקר ${id} לא פעיל זמן רב - מסומן כלא מחובר`);
    }
  });
}

// הפעלה תקופתית של ניקוי (כמו בשרת הישן)
setInterval(cleanupInactiveLockers, 60000); // כל דקה
