// מנגנון בקשות ממתינות עם timeout - זהה לשרת הישן

interface PendingRequest {
  requestId: string;
  lockerId: string;
  messageObj: any;
  timestamp: number;
  resolve: (result: any) => void;
  timeoutHandle?: NodeJS.Timeout;
}

// מפת בקשות ממתינות לתגובה מה-ESP32 (כמו בשרת הישן)
const pendingRequests = new Map<string, PendingRequest>();

// פונקציה לשליחת פקודה ללוקר עם המתנה לתגובה (זהה לשרת הישן)
export function sendToLockerWithResponse(
  lockerId: string, 
  messageObj: any, 
  timeoutMs: number = 5000
): Promise<{
  success: boolean;
  message?: string;
  timeout?: boolean;
  cellId?: string;
  lockerId?: string;
  esp32Response?: any;
}> {
  return new Promise((resolve) => {
    // בדיקה אם הלוקר מחובר (נעשה זאת בAPI route)
    
    // יצירת מזהה יחודי לבקשה (כמו בשרת הישן)
    const requestId = `${lockerId}_${messageObj.type}_${Date.now()}`;
    
    // שמירת הבקשה במפה
    const request: PendingRequest = {
      requestId,
      lockerId,
      messageObj,
      timestamp: Date.now(),
      resolve
    };
    
    // טיימאאוט - אם לא מגיעה תגובה בזמן (כמו בשרת הישן)
    request.timeoutHandle = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        console.log(`⏰ תם הזמן לתגובה מלוקר ${lockerId}`);
        resolve({ 
          success: false, 
          message: `תם הזמן לתגובה מלוקר ${lockerId}`,
          timeout: true 
        });
      }
    }, timeoutMs);
    
    pendingRequests.set(requestId, request);
    
    // הוספת מזהה בקשה להודעה (כמו בשרת הישן)
    messageObj.requestId = requestId;
    
    console.log(`📤 נשלחה פקודה ללוקר ${lockerId} עם מזהה ${requestId}`);
    
    // כאן נשלח את הפקודה לqueue (במקום WebSocket ישיר)
    // הפקודה תישלח דרך /api/arduino/commands
    addCommandToQueue(lockerId, messageObj);
  });
}

// הוספת פקודה לqueue (חלק מהמערכת החדשה)
async function addCommandToQueue(lockerId: string, command: any) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://lockerweb-production.up.railway.app'}/api/arduino/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetDeviceId: lockerId,
        command
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    console.log(`✅ פקודה נוספה לqueue עבור ${lockerId}`);
  } catch (error) {
    console.error(`❌ שגיאה בהוספת פקודה לqueue:`, error);
    
    // אם נכשל להוסיף לqueue, נחזיר תגובת כישלון
    const requestId = command.requestId;
    if (requestId && pendingRequests.has(requestId)) {
      const request = pendingRequests.get(requestId)!;
      if (request.timeoutHandle) {
        clearTimeout(request.timeoutHandle);
      }
      pendingRequests.delete(requestId);
      
      request.resolve({
        success: false,
        message: `שגיאה בשליחת פקודה ללוקר ${lockerId}`,
        lockerId
      });
    }
  }
}

// טיפול בתגובות מה-ESP32 (כמו בשרת הישן)
export function handleESP32Response(data: {
  requestId?: string;
  success?: boolean;
  type?: string;
  cellId?: string;
  lockerId?: string;
  message?: string;
  [key: string]: any;
}) {
  const { requestId } = data;
  
  if (!requestId) {
    console.log(`⚠️ תגובה מלוקר ללא מזהה בקשה:`, data);
    return false;
  }
  
  // חיפוש הבקשה הממתינה (כמו בשרת הישן)
  const pendingRequest = pendingRequests.get(requestId);
  if (!pendingRequest) {
    console.log(`⚠️ לא נמצאה בקשה ממתינה למזהה ${requestId}`);
    return false;
  }
  
  // ניקוי timeout
  if (pendingRequest.timeoutHandle) {
    clearTimeout(pendingRequest.timeoutHandle);
  }
  
  pendingRequests.delete(requestId);
  
  // שליחת התגובה למי שממתין (כמו בשרת הישן)
  const response = {
    success: data.success || false,
    message: data.success ? 
      `תא ${data.cellId} ${data.type === 'unlockResponse' ? 'נפתח' : 'ננעל'} בהצלחה` :
      `כשל ב${data.type === 'unlockResponse' ? 'פתיחת' : 'נעילת'} תא ${data.cellId}`,
    cellId: data.cellId,
    lockerId: data.lockerId,
    esp32Response: data
  };
  
  pendingRequest.resolve(response);
  
  console.log(`✅ תגובה עובדה לבקשה ${requestId}:`, response);
  return true;
}

// קבלת סטטיסטיקות בקשות ממתינות
export function getPendingRequestsStats() {
  const stats = {
    totalPending: pendingRequests.size,
    byLocker: {} as Record<string, number>,
    oldestRequest: null as { requestId: string; age: number } | null
  };
  
  let oldestTimestamp = Date.now();
  let oldestRequestId = '';
  
  pendingRequests.forEach((request, requestId) => {
    // ספירה לפי לוקר
    stats.byLocker[request.lockerId] = (stats.byLocker[request.lockerId] || 0) + 1;
    
    // חיפוש הבקשה הוותיקה ביותר
    if (request.timestamp < oldestTimestamp) {
      oldestTimestamp = request.timestamp;
      oldestRequestId = requestId;
    }
  });
  
  if (oldestRequestId) {
    stats.oldestRequest = {
      requestId: oldestRequestId,
      age: Date.now() - oldestTimestamp
    };
  }
  
  return stats;
}

// ניקוי בקשות תקועות (safety cleanup)
export function cleanupStuckRequests() {
  const cutoffTime = Date.now() - (30 * 1000); // 30 שניות
  let cleanedCount = 0;
  
  pendingRequests.forEach((request, requestId) => {
    if (request.timestamp < cutoffTime) {
      if (request.timeoutHandle) {
        clearTimeout(request.timeoutHandle);
      }
      
      // שליחת תגובת timeout
      request.resolve({
        success: false,
        message: `תם הזמן לתגובה מלוקר ${request.lockerId} (cleanup)`,
        timeout: true,
        lockerId: request.lockerId
      });
      
      pendingRequests.delete(requestId);
      cleanedCount++;
      console.log(`🧹 נוקתה בקשה תקועה: ${requestId}`);
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 נוקו ${cleanedCount} בקשות תקועות`);
  }
}

// הפעלה תקופתית של ניקוי (כמו בשרת הישן)
setInterval(cleanupStuckRequests, 60000); // כל דקה

// ייצוא כל הפונקציות
export { pendingRequests };
