import { create } from 'zustand'

interface WebSocketState {
  socket: WebSocket | null
  connected: boolean
  lastUpdate: Date | null
  connect: () => void
  disconnect: () => void
  send: (message: any) => void
}

// Force override לוודא שתמיד נשתמש בפורט הנכון
function getWebSocketURL() {
  let url = process.env.NEXT_PUBLIC_HARDWARE_WS_URL || 'wss://lockerweb-production.up.railway.app:3004'
  if (url.includes('lockerweb-production.up.railway.app') && !url.includes(':3004')) {
    url = url.replace('lockerweb-production.up.railway.app', 'lockerweb-production.up.railway.app:3004')
  }
  console.log('🔗 WebSocket URL נקבע (service):', url)
  return url
}

const WS_URL = getWebSocketURL()

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  connected: false,
  lastUpdate: null,

  connect: () => {
    if (typeof window === 'undefined') return
    
    const socket = new WebSocket(WS_URL)
    
    socket.onopen = () => {
      console.log('✅ WebSocket מחובר')
      set({ socket, connected: true })
    }
    
    socket.onclose = () => {
      console.log('❌ WebSocket מנותק')
      set({ connected: false })
      
      // ניסיון חיבור מחדש אחרי 5 שניות
      setTimeout(() => {
        console.log('🔄 מנסה להתחבר מחדש...')
        get().connect()
      }, 5000)
    }
    
    socket.onmessage = (event) => {
      console.log('📩 הודעת WebSocket:', event.data)
      set({ lastUpdate: new Date() })
    }
    
    socket.onerror = (error) => {
      console.error('שגיאת WebSocket:', error)
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ socket: null, connected: false })
    }
  },

  send: (message: any) => {
    const { socket } = get()
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    } else {
      console.error('לא ניתן לשלוח הודעה - WebSocket לא מחובר')
    }
  }
})) 