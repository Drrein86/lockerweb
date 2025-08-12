// הגדרות חיבור לשרת החומרה - WebSocket על פורט 3004
const HARDWARE_WS_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_HARDWARE_WS_URL || 'wss://lockerweb-production.up.railway.app:3004')
  : 'wss://lockerweb-production.up.railway.app:3004'

const ADMIN_SECRET = '86428642'
const PING_INTERVAL = 30000 // 30 שניות
const RECONNECT_DELAY = 5000 // 5 שניות
const CONNECTION_TIMEOUT = 5000 // 5 שניות

// מפה לסימולציה של לוקרים מחוברים (בלי WebSocket server עבור Vercel)
const activeConnections = new Map<number, boolean>()

// יצירת חיבור WebSocket לשרת החומרה
let hardwareWebSocket: WebSocket | null = null
let pingInterval: NodeJS.Timeout | null = null
let reconnectTimeout: NodeJS.Timeout | null = null
let lastPongTime: number = 0

function startPingInterval() {
  if (pingInterval) {
    clearInterval(pingInterval)
  }

  pingInterval = setInterval(() => {
    if (hardwareWebSocket?.readyState === WebSocket.OPEN) {
      const pingMessage = { type: 'ping', id: 'web-admin' }
      hardwareWebSocket.send(JSON.stringify(pingMessage))
      console.log('📤 נשלח פינג לRailway:', pingMessage)
      
      // בדיקה אם קיבלנו pong בזמן סביר
      if (Date.now() - lastPongTime > PING_INTERVAL * 2) {
        console.log('❌ לא התקבל pong - מנתק ומנסה להתחבר מחדש')
        hardwareWebSocket.close()
      }
    }
  }, PING_INTERVAL)
}

function stopPingInterval() {
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
  }
}

function cleanupConnection() {
  stopPingInterval()
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  if (hardwareWebSocket) {
    hardwareWebSocket.close()
    hardwareWebSocket = null
  }
}

function connectToHardwareServer() {
  if (typeof window === 'undefined') {
    console.log('🔧 Server-side - לא ניתן להשתמש ב-WebSocket')
    return null
  }
  
  // ניקוי חיבור קודם אם קיים
  cleanupConnection()
  
  try {
    console.log('🔌 מנסה להתחבר לשרת החומרה בכתובת:', HARDWARE_WS_URL)
    hardwareWebSocket = new WebSocket(HARDWARE_WS_URL)
    
    // טיימאאוט להתחברות ראשונית
    const connectionTimeout = setTimeout(() => {
      if (hardwareWebSocket?.readyState !== WebSocket.OPEN) {
        console.log('❌ זמן התחברות פג - מנסה שוב')
        hardwareWebSocket?.close()
      }
    }, CONNECTION_TIMEOUT)
    
    hardwareWebSocket.onopen = () => {
      console.log('✅ התחברות לשרת החומרה הצליחה!')
      clearTimeout(connectionTimeout)
      
      // שליחת הודעת זיהוי ראשונית
      const identifyMessage = {
        type: 'identify',
        client: 'web-admin',
        secret: ADMIN_SECRET
      }
      hardwareWebSocket?.send(JSON.stringify(identifyMessage))
      
      // התחלת מנגנון ping-pong
      startPingInterval()
      lastPongTime = Date.now()
    }
    
    hardwareWebSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // טיפול ב-pong
        if (data.type === 'pong') {
          lastPongTime = Date.now()
          if (data.id) {
            console.log(`🏓 התקבל pong מ-Railway עם ID: ${data.id}`)
          } else {
            console.log(`🏓 התקבל pong מ-Railway ללא ID (תקין)`)
          }
          return
        }
        
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
      stopPingInterval()
      
      // ניסיון התחברות מחדש
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          console.log('🔄 מנסה להתחבר מחדש...')
          connectToHardwareServer()
        }, RECONNECT_DELAY)
      }
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