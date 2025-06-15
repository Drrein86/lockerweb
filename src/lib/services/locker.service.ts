import { create } from 'zustand'
import { useWebSocketStore } from './websocket.service'

export interface LockerCell {
  locked: boolean
  opened: boolean
  packageId?: string
}

export interface Locker {
  lockerId: string
  ip: string
  port: number
  status: string
  lastSeen: Date
  cells: Record<string, LockerCell>
  isOnline: boolean
}

interface LockerState {
  lockers: Locker[]
  loading: boolean
  selectedLocker: string | null
  getStatus: () => void
  unlockCell: (lockerId: string, cellId: string) => Promise<void>
  setSelectedLocker: (lockerId: string | null) => void
}

export const useLockerStore = create<LockerState>((set, get) => ({
  lockers: [],
  loading: false,
  selectedLocker: null,

  getStatus: () => {
    set({ loading: true })
    const ws = useWebSocketStore.getState()
    
    ws.send({
      type: 'getStatus'
    })
    
    // עדכון הסטטוס יתקבל דרך WebSocket
  },

  unlockCell: async (lockerId: string, cellId: string) => {
    const ws = useWebSocketStore.getState()
    
    return new Promise((resolve, reject) => {
      try {
        ws.send({
          type: 'openCell',
          lockerId,
          cellCode: cellId
        })

        // נחכה לתשובה מהשרת
        const timeout = setTimeout(() => {
          reject(new Error('פג זמן המתנה לתשובה'))
        }, 5000)

        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'openCellResponse' && data.lockerId === lockerId && data.cellCode === cellId) {
              clearTimeout(timeout)
              if (ws.socket) {
                ws.socket.removeEventListener('message', messageHandler)
              }
              resolve()
            }
          } catch (error) {
            console.error('שגיאה בפענוח תשובה:', error)
          }
        }

        if (ws.socket) {
          ws.socket.addEventListener('message', messageHandler)
        }
      } catch (error) {
        reject(error)
      }
    })
  },

  setSelectedLocker: (lockerId: string | null) => {
    set({ selectedLocker: lockerId })
  }
}))

// האזנה להודעות WebSocket ועדכון המצב
if (typeof window !== 'undefined') {
  useWebSocketStore.subscribe((state) => {
    if (state.socket) {
      state.socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'status') {
            useLockerStore.setState({
              lockers: data.lockers,
              loading: false
            })
          }
        } catch (error) {
          console.error('שגיאה בפענוח הודעת סטטוס:', error)
        }
      })
    }
  })
} 