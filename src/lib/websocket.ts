// הגדרות חיבור לשרת החומרה
const HARDWARE_WS_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_HARDWARE_WS_URL || 'wss://lockerweb-production.up.railway.app/ws')
  : 'wss://lockerweb-production.up.railway.app/ws'

// מפה לסימולציה של לוקרים מחוברים (בלי WebSocket server עבור Vercel)
const activeConnections = new Map<number, boolean>()

// יצירת חיבור WebSocket לשרת החומרה
let hardwareWebSocket: WebSocket | null = null

function connectToHardwareServer() {
  if (typeof window === 'undefined') {
    console.log('🔧 Server-side - לא ניתן להשתמש ב-WebSocket')
    return null
  }
  
  try {
    console.log('🔌 מנסה להתחבר לשרת החומרה בכתובת:', HARDWARE_WS_URL)
    hardwareWebSocket = new WebSocket(HARDWARE_WS_URL)
    
    hardwareWebSocket.onopen = () => {
      console.log('✅ התחברות לשרת החומרה הצליחה!')
      
      // שליחת הודעת זיהוי ראשונית
      const identifyMessage = {
        type: 'identify',
        client: 'web-admin'
      }
      hardwareWebSocket?.send(JSON.stringify(identifyMessage))
    }
    
    hardwareWebSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 התקבלה הודעה מהשרת:', data)
        
        if (data.type === 'lockerUpdate') {
          console.log('🔄 עדכון סטטוס לוקרים:', data.lockers)
        }
      } catch (error) {
        console.error('❌ שגיאה בעיבוד הודעה:', error)
      }
    }
    
    hardwareWebSocket.onclose = (event) => {
      console.log('🔌 החיבור לשרת החומרה נסגר:', event.code, event.reason)
      // ניסיון התחברות מחדש אחרי 5 שניות
      setTimeout(connectToHardwareServer, 5000)
    }
    
    hardwareWebSocket.onerror = (error) => {
      console.error('❌ שגיאת WebSocket:', error)
    }
    
    return hardwareWebSocket
  } catch (error) {
    console.error('❌ שגיאה בהתחברות לשרת החומרה:', error)
    return null
  }
}

// יצירת שרת WebSocket (לא זמין ב-Vercel - סימולציה בלבד)
export function createWebSocketServer(port: number = 8080) {
  console.log(`שרת WebSocket לא זמין ב-Vercel - משתמש ב-API routes`)
  
  // סימולציה של לוקרים מחוברים למטרות development
  activeConnections.set(1, true) // לוקר ראשי
  activeConnections.set(2, true) // לוקר שני
  
  // חיבור לשרת החומרה (client-side בלבד)
  if (typeof window !== 'undefined') {
    connectToHardwareServer()
  }
  
  return null
}

// פונקציה לפתיחת תא בלוקר ספציפי - מתחברת לשרת החומרה
export async function openLockerCell(lockerId: number, cellCode: string): Promise<boolean> {
  try {
    // נסיון ראשון: שליחה לשרת החומרה דרך WebSocket
    if (hardwareWebSocket && hardwareWebSocket.readyState === WebSocket.OPEN) {
      return new Promise((resolve) => {
        const message = {
          type: 'unlock',
          lockerId: `LOC00${lockerId}`,
          cellId: cellCode
        }
        
        hardwareWebSocket!.send(JSON.stringify(message))
        
        // המתנה לתגובה
        const handleResponse = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'unlockResponse' && data.cellId === cellCode) {
              hardwareWebSocket!.removeEventListener('message', handleResponse)
              console.log(`✅ תא ${cellCode} נפתח בלוקר ${lockerId}`)
              resolve(data.success)
            }
          } catch (error) {
            console.error('❌ שגיאה בעיבוד תגובה:', error)
          }
        }
        
        hardwareWebSocket!.addEventListener('message', handleResponse)
        
        // טיימאאוט אחרי 5 שניות
        setTimeout(() => {
          hardwareWebSocket!.removeEventListener('message', handleResponse)
          console.log('⏰ זמן תגובה פג - משתמש ב-API fallback')
          resolve(false)
        }, 5000)
      })
    }
    
    // נסיון שני: ב-Vercel נשתמש ב-API route כ-fallback
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
      console.log(`✅ תא ${cellCode} נפתח בלוקר ${lockerId} (דרך API)`)
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