'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useWebSocketStore } from '@/lib/services/websocket.service'
import { useLockerStore, Locker } from '@/lib/services/locker.service'
import { useToastStore } from '@/lib/services/toast.service'
import { BackIcon, ConnectedIcon, DisconnectedIcon, UnlockIcon, RefreshIcon } from '@/components/Icons'
import AuthGuard from '@/components/Auth/AuthGuard'
import ClientOnly from '@/components/ClientOnly'

const WebSocketPage = () => {
  const { connect, connected } = useWebSocketStore()
  const { lockers, loading, getStatus, unlockCell } = useLockerStore()
  const { addToast } = useToastStore()

  useEffect(() => {
    connect()
    getStatus()
  }, [])

  const handleUnlockCell = async (lockerId: string, cellId: string) => {
    try {
      await unlockCell(lockerId, cellId)
      addToast('success', `✅ תא ${cellId} נפתח בהצלחה בלוקר ${lockerId}`)
      getStatus() // רענון אוטומטי
    } catch (error) {
      addToast('error', `❌ שגיאה בפתיחת תא: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`)
    }
  }

  if (loading && !lockers.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">
            {connected ? 'מחכה לנתונים מהשרת.....' : 'מתחבר לשרת...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
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
          
          <div className="flex gap-3 items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {connected ? <ConnectedIcon /> : <DisconnectedIcon />}
              <span className="text-sm font-medium">
                {connected ? 'מחובר' : 'מנותק'}
              </span>
            </div>
            <button
              onClick={getStatus}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshIcon />
              {loading ? 'מרענן...' : 'רענון'}
            </button>
          </div>
        </div>

        {/* רשימת לוקרים */}
        {lockers.length > 0 ? (
          <div className="space-y-6">
            {lockers.map((locker: Locker) => (
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
                      {Object.entries(locker.cells).map(([cellId, cellData]) => (
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
                            onClick={() => handleUnlockCell(locker.lockerId, cellId)}
                            disabled={!locker.isOnline || loading}
                            className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UnlockIcon />
                            {loading ? 'פותח...' : 'פתח תא'}
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
              onClick={getStatus}
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

export default function ProtectedWebSocketPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ClientOnly fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">טוען...</p>
          </div>
        </div>
      }>
        <WebSocketPage />
      </ClientOnly>
    </AuthGuard>
  )
} 