import { create } from 'zustand'

interface WebSocketState {
  socket: WebSocket | null
  connected: boolean
  lastUpdate: Date | null
  connect: () => void
  disconnect: () => void
  send: (message: any) => void
  unlockCell: (lockerId: string, cellId: string) => Promise<void>
}

const WS_URL = 'wss://lockerweb-production.up.railway.app'

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  connected: false,
  lastUpdate: null,

  connect: () => {
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
  },

  unlockCell: async (lockerId: string, cellId: string) => {
    const { socket } = get()
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket לא מחובר')
    }

    return new Promise((resolve, reject) => {
      try {
        socket.send(JSON.stringify({
          type: 'UNLOCK_CELL',
          data: {
            lockerId,
            cellId
          }
        }))
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }
})) 