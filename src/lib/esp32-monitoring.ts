// מעקב תקופתי אחר ESP32 - זהה לשרת הישן

import { getLockerStates, getAllConnectedLockers } from '@/lib/locker-connections'
import { broadcastMessage } from '@/lib/broadcast-status'

interface MonitoringStats {
  totalChecks: number;
  lastCheckTime: Date;
  connectedDevices: number;
  totalDevices: number;
  deviceStatus: Record<string, {
    isOnline: boolean;
    lastSeen: Date;
    responseTime?: number;
  }>;
}

let monitoringStats: MonitoringStats = {
  totalChecks: 0,
  lastCheckTime: new Date(),
  connectedDevices: 0,
  totalDevices: 0,
  deviceStatus: {}
};

// פונקציה לבדיקת ESP32 devices (כמו בשרת הישן)
export function checkESP32Devices() {
  console.log('🔍 בדיקת חיבורי ESP32');
  
  const lockerStates = getLockerStates();
  const connectedLockers = getAllConnectedLockers();
  
  let connectedDevices = 0;
  const deviceStatus: Record<string, any> = {};
  
  // בדיקת כל לוקר (כמו בשרת הישן)
  for (const [lockerId, device] of Object.entries(lockerStates)) {
    const isOnline = device.isOnline;
    
    deviceStatus[lockerId] = {
      isOnline,
      lastSeen: device.lastSeen,
      ip: device.ip,
      status: isOnline ? 'online' : 'offline'
    };
    
    if (isOnline) {
      connectedDevices++;
      console.log(`📡 לוקר ${lockerId} מחובר`, {
        lockerId,
        ip: device.ip,
        status: 'online',
        lastSeen: device.lastSeen
      });
    } else {
      console.log(`📡 לוקר ${lockerId} לא מגיב`, {
        lockerId,
        ip: device.ip,
        status: 'offline',
        lastSeen: device.lastSeen
      });
    }
  }
  
  // עדכון סטטיסטיקות
  monitoringStats = {
    totalChecks: monitoringStats.totalChecks + 1,
    lastCheckTime: new Date(),
    connectedDevices,
    totalDevices: Object.keys(lockerStates).length,
    deviceStatus
  };
  
  console.log('📊 סה"כ לוקרים מחוברים', {
    connectedDevices,
    totalDevices: Object.keys(lockerStates).length,
    checkNumber: monitoringStats.totalChecks
  });
  
  // שידור עדכון מעקב לכל הלקוחות
  broadcastMonitoringUpdate();
  
  return monitoringStats;
}

// שידור עדכון מעקב (כמו בשרת הישן)
function broadcastMonitoringUpdate() {
  broadcastMessage('monitoring_update', {
    stats: monitoringStats,
    message: `מעקב ESP32 - ${monitoringStats.connectedDevices}/${monitoringStats.totalDevices} מכשירים מחוברים`
  });
}

// בדיקת בריאות לוקר ספציפי
export async function checkLockerHealth(lockerId: string): Promise<{
  success: boolean;
  responseTime?: number;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    
    // שליחת ping ל-Arduino דרך הqueue
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://lockerweb-production.up.railway.app'}/api/arduino/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetDeviceId: lockerId,
        command: {
          type: 'ping',
          timestamp: Date.now()
        }
      })
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return { success: true, responseTime };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// קבלת סטטיסטיקות מעקב
export function getMonitoringStats() {
  return monitoringStats;
}

// איפוס סטטיסטיקות
export function resetMonitoringStats() {
  monitoringStats = {
    totalChecks: 0,
    lastCheckTime: new Date(),
    connectedDevices: 0,
    totalDevices: 0,
    deviceStatus: {}
  };
}

// API להצגת מידע מעקב
export function getMonitoringReport() {
  const now = new Date();
  const timeSinceLastCheck = now.getTime() - monitoringStats.lastCheckTime.getTime();
  
  return {
    ...monitoringStats,
    timeSinceLastCheck: timeSinceLastCheck,
    status: timeSinceLastCheck > 90000 ? 'stale' : 'fresh', // יותר מ-90 שניות = מיושן
    uptime: {
      connectedRatio: monitoringStats.totalDevices > 0 ? 
        (monitoringStats.connectedDevices / monitoringStats.totalDevices) * 100 : 0,
      status: monitoringStats.connectedDevices === monitoringStats.totalDevices ? 'all_online' :
              monitoringStats.connectedDevices === 0 ? 'all_offline' : 'partial_online'
    }
  };
}

// הפעלת מעקב תקופתי (כמו בשרת הישן)
export function startESP32Monitoring() {
  console.log('🚀 מתחיל מעקב תקופתי אחר ESP32 devices');
  
  // בדיקה ראשונית
  checkESP32Devices();
  
  // בדיקה כל דקה (כמו בשרת הישן)
  const monitoringInterval = setInterval(() => {
    checkESP32Devices();
  }, 60000);
  
  return monitoringInterval;
}

// עצירת מעקב תקופתי
export function stopESP32Monitoring(intervalId: NodeJS.Timeout) {
  console.log('🛑 עוצר מעקב תקופתי אחר ESP32');
  clearInterval(intervalId);
}

// בדיקת חיבור לוקר ספציפי עם דיווח מפורט
export async function performLockerDiagnostics(lockerId: string) {
  console.log(`🔧 מבצע אבחון מפורט עבור לוקר ${lockerId}`);
  
  const lockerStates = getLockerStates();
  const locker = lockerStates[lockerId];
  
  if (!locker) {
    return {
      lockerId,
      exists: false,
      error: 'לוקר לא רשום במערכת'
    };
  }
  
  // בדיקת זמן החיבור האחרון
  const timeSinceLastSeen = Date.now() - new Date(locker.lastSeen).getTime();
  const isRecentlyActive = timeSinceLastSeen < 60000; // פחות מדקה
  
  // בדיקת בריאות
  const healthCheck = await checkLockerHealth(lockerId);
  
  const diagnostics = {
    lockerId,
    exists: true,
    isOnline: locker.isOnline,
    lastSeen: locker.lastSeen,
    timeSinceLastSeen,
    isRecentlyActive,
    ip: locker.ip,
    cellsCount: Object.keys(locker.cells || {}).length,
    healthCheck,
    status: isRecentlyActive ? 'healthy' : 'inactive',
    recommendations: []
  };
  
  // המלצות לפי הסטטוס
  if (!isRecentlyActive) {
    diagnostics.recommendations.push('בדוק חיבור WiFi של הלוקר');
    diagnostics.recommendations.push('וודא שהלוקר מקבל חשמל');
  }
  
  if (!healthCheck.success) {
    diagnostics.recommendations.push('בדוק תקשורת עם השרת');
    diagnostics.recommendations.push('נסה לאתחל את הלוקר');
  }
  
  console.log(`🔧 אבחון לוקר ${lockerId} הושלם:`, diagnostics);
  
  return diagnostics;
}

// הפעלה אוטומטית של המעקב
startESP32Monitoring();
