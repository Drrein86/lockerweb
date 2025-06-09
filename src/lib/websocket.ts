// מפה לסימולציה של לוקרים מחוברים (בלי WebSocket server עבור Vercel)
const activeConnections = new Map<number, boolean>()

// יצירת שרת WebSocket (לא זמין ב-Vercel - סימולציה בלבד)
export function createWebSocketServer(port: number = 8080) {
  console.log(`שרת WebSocket לא זמין ב-Vercel - משתמש ב-API routes`)
  
  // סימולציה של לוקרים מחוברים למטרות development
  activeConnections.set(1, true) // לוקר ראשי
  activeConnections.set(2, true) // לוקר שני
  
  return null
}

// פונקציה לפתיחת תא בלוקר ספציפי - עובדת עם Vercel
export async function openLockerCell(lockerId: number, cellCode: string): Promise<boolean> {
  try {
    // ב-Vercel נשתמש ב-API route במקום WebSocket
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/websocket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'openCell',
        lockerId,
        cellCode
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ תא ${cellCode} נפתח בלוקר ${lockerId}`)
      return true
    } else {
      console.error(`❌ שגיאה בפתיחת תא: ${result.error}`)
      return false
    }
    
  } catch (error) {
    console.error('❌ שגיאה בשליחת פקודת פתיחה:', error)
    
    // fallback לסימולציה (development או בדיקה)
    const isConnected = activeConnections.get(lockerId)
    
    if (isConnected) {
      console.log(`סימולציה: תא ${cellCode} נפתח בלוקר ${lockerId}`)
      return true
    }
    
    return false
  }
}

// פונקציה לבדיקת סטטוס חיבור לוקר
export function isLockerConnected(lockerId: number): boolean {
  return activeConnections.get(lockerId) === true
}

// פונקציה לקבלת רשימת לוקרים מחוברים
export function getConnectedLockers(): number[] {
  return Array.from(activeConnections.keys())
}

// פונקציה לשליחת הודעה לכל הלוקרים (סימולציה)
export function broadcastToAllLockers(message: any): void {
  console.log('שליחת הודעה לכל הלוקרים:', message)
  
  activeConnections.forEach((isConnected, lockerId) => {
    if (isConnected) {
      console.log(`הודעה נשלחה ללוקר ${lockerId}`)
    }
  })
}

// פונקציה לסגירת תא (נעילה חזרה)
export async function closeLockerCell(lockerId: number, cellCode: string): Promise<boolean> {
  const isConnected = activeConnections.get(lockerId)
  
  if (!isConnected) {
    console.error(`לוקר ${lockerId} לא מחובר`)
    return false
  }

  try {
    console.log(`סימולציה: נשלחה פקודת סגירה ללוקר ${lockerId}, תא ${cellCode}`)
    return true
    
  } catch (error) {
    console.error('שגיאה בשליחת פקודה:', error)
    return false
  }
} 