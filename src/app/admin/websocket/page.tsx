'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// SVG Icons
const BackIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const ConnectedIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
)

const DisconnectedIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 21l4.5-4.5-1.636-1.636M5.636 5.636L3 3l1.636 1.636" />
  </svg>
)

const UnlockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

interface LockerStatus {
  lockerId: string
  ip: string
  port: number
  status: string
  lastSeen: Date
  cells: Record<string, any>
  isOnline: boolean
}

interface WebSocketStatus {
  success: boolean
  connectedLockers: number
  lockers: LockerStatus[]
  serverTime: string
}

export default function WebSocketPage() {
  const [wsStatus, setWsStatus] = useState<WebSocketStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchWebSocketStatus()
    
    // רענון אוטומטי כל 5 שניות
    const interval = setInterval(fetchWebSocketStatus, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchWebSocketStatus = async () => {
    try {
      const response = await fetch('/api/websocket')
      const data = await response.json()
      
      if (response.ok) {
        setWsStatus(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('שגיאה בטעינת סטטוס WebSocket:', error)
    } finally {
      setLoading(false)
    }
  }

  const unlockCell = async (lockerId: string, cellId: string) => {
    const actionKey = `${lockerId}-${cellId}`
    setActionLoading(actionKey)
    
    try {
      const response = await fetch('/api/websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'openCell',
          lockerId,
          cellCode: cellId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ תא ${cellId} נפתח בהצלחה בלוקר ${lockerId}`)
        fetchWebSocketStatus() // רענון נתונים
      } else {
        alert(`❌ שגיאה בפתיחת תא: ${result.error}`)
      }
    } catch (error) {
      console.error('שגיאה בפתיחת תא:', error)
      alert('❌ שגיאה בחיבור לשרת')
    } finally {
      setActionLoading(null)
    }
  }

  const refreshStatus = () => {
    setLoading(true)
    fetchWebSocketStatus()
  }

  if (loading && !wsStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען סטטוס WebSocket...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* כותרת */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              <BackIcon />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">ניהול חיבורי WebSocket</h1>
              <p className="text-white/70 mt-1">מעקב אחר חיבורי ESP32 ופתיחה ידנית של תאים</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={refreshStatus}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshIcon />
              {loading ? 'מרענן...' : 'רענון'}
            </button>
          </div>
        </div>

        {/* סטטוס כללי */}
        {wsStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">לוקרים מחוברים</p>
                  <p className="text-3xl font-bold text-white">{wsStatus.connectedLockers}</p>
                </div>
                <ConnectedIcon />
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-400">
                  מתוך {wsStatus.lockers.length} רשומים
                </span>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">שרת WebSocket</p>
                  <p className="text-lg font-bold text-green-400">פעיל</p>
                </div>
                <ConnectedIcon />
              </div>
              <div className="mt-2">
                <span className="text-sm text-white/50">
                  {wsStatus.serverTime}
                </span>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">עדכון אחרון</p>
                  <p className="text-lg font-bold text-white">
                    {lastUpdate.toLocaleTimeString('he-IL')}
                  </p>
                </div>
                <RefreshIcon />
              </div>
              <div className="mt-2">
                <span className="text-sm text-white/50">
                  רענון אוטומטי
                </span>
              </div>
            </div>
          </div>
        )}

        {/* רשימת לוקרים */}
        {wsStatus && wsStatus.lockers.length > 0 ? (
          <div className="space-y-6">
            {wsStatus.lockers.map((locker) => (
              <div key={locker.lockerId} className="glass-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${locker.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div>
                      <h3 className="text-xl font-bold text-white">לוקר {locker.lockerId}</h3>
                      <p className="text-white/70">{locker.ip}:{locker.port}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      locker.isOnline 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {locker.isOnline ? <ConnectedIcon /> : <DisconnectedIcon />}
                      {locker.isOnline ? 'מחובר' : 'לא מחובר'}
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      נראה לאחרונה: {new Date(locker.lastSeen).toLocaleString('he-IL')}
                    </p>
                  </div>
                </div>

                {/* תאים */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white/90">תאים זמינים:</h4>
                  
                  {Object.keys(locker.cells).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(locker.cells).map(([cellId, cellData]: [string, any]) => (
                        <div key={cellId} className="bg-white/10 rounded-lg p-4 border border-white/20">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-white">תא {cellId}</span>
                            <div className={`w-3 h-3 rounded-full ${
                              cellData.locked ? 'bg-red-400' : 'bg-green-400'
                            }`}></div>
                          </div>
                          
                          <div className="space-y-1 text-sm text-white/70 mb-3">
                            <p>סטטוס: {cellData.locked ? 'נעול' : 'פתוח'}</p>
                            <p>דלת: {cellData.opened ? 'פתוחה' : 'סגורה'}</p>
                            {cellData.packageId && (
                              <p>חבילה: {cellData.packageId}</p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => unlockCell(locker.lockerId, cellId)}
                            disabled={!locker.isOnline || actionLoading === `${locker.lockerId}-${cellId}`}
                            className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UnlockIcon />
                            {actionLoading === `${locker.lockerId}-${cellId}` ? 'פותח...' : 'פתח תא'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-6 text-center">
                      <p className="text-white/50">אין נתוני תאים זמינים</p>
                      <p className="text-white/30 text-sm mt-1">
                        {locker.isOnline ? 'הלוקר מחובר אך לא דיווח על תאים' : 'הלוקר לא מחובר'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card text-center py-12">
            <DisconnectedIcon />
            <h3 className="text-xl font-semibold text-white mb-2">אין לוקרים מחוברים</h3>
            <p className="text-white/70 mb-4">
              לא נמצאו לוקרים פעילים. בדוק את שרת החומרה והחיבורי הרשת.
            </p>
            <button
              onClick={refreshStatus}
              className="btn-primary"
            >
              נסה שוב
            </button>
          </div>
        )}

        {/* הוראות הפעלה */}
        <div className="glass-card mt-8">
          <h3 className="text-xl font-bold text-white mb-4">הוראות הפעלה</h3>
          <div className="space-y-3 text-white/70">
            <div className="flex items-start gap-3">
              <span className="text-purple-400 font-bold">1.</span>
              <p>וודא שהשרת החומרה פועל על: <code className="bg-white/10 px-2 py-1 rounded">localhost:8080</code></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-purple-400 font-bold">2.</span>
              <p>הפעל את שרת החומרה: <code className="bg-white/10 px-2 py-1 rounded">node locker-hardware-server.js</code></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-purple-400 font-bold">3.</span>
              <p>ודא שמכשירי ESP32 מחוברים לרשת ופועלים על הכתובות הנכונות</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-purple-400 font-bold">4.</span>
              <p>לפתיחה ידנית, לחץ על כפתור "פתח תא" ליד התא הרצוי</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 