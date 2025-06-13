'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Cell {
  id: string
  locked: boolean
  hasPackage: boolean
  packageId: string | null
}

interface Locker {
  id: string
  isOnline: boolean
  lastSeen: string
  cells: { [key: string]: Cell }
}

// SVG Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2H18V22H16V20H8V22H6V2Z" stroke="white" strokeWidth="2"/>
    <path d="M8 6H10V8H8Z" stroke="white" strokeWidth="2"/>
    <path d="M14 6H16V8H14Z" stroke="white" strokeWidth="2"/>
    <path d="M8 10H10V12H8Z" stroke="white" strokeWidth="2"/>
    <path d="M14 10H16V12H14Z" stroke="white" strokeWidth="2"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3H21L19 13H5L3 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3L1 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 13V21H17V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="2" x2="8" y2="18" stroke="white" strokeWidth="2"/>
    <line x1="16" y1="6" x2="16" y2="22" stroke="white" strokeWidth="2"/>
  </svg>
)

const LockedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
    <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const UnlockedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const StatusIcon = ({ isOnline }: { isOnline: boolean }) => (
  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
)

export default function AdminLockersPage() {
  const [lockers, setLockers] = useState<{ [key: string]: Locker }>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    // התחברות לשרת WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_HARDWARE_WS_URL || 'wss://lockerweb-production.up.railway.app'
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('✅ התחברות לשרת החומרה הצליחה')
      // שליחת הודעת זיהוי
      ws.send(JSON.stringify({
        type: 'identify',
        client: 'web-admin'
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'lockerUpdate') {
          setLockers(data.data)
          setLoading(false)
        }
      } catch (error) {
        console.error('שגיאה בעיבוד הודעה:', error)
      }
    }

    ws.onclose = () => {
      console.log('🔌 החיבור לשרת החומרה נסגר')
      // ניסיון התחברות מחדש אחרי 5 שניות
      setTimeout(() => {
        setLoading(true)
        window.location.reload()
      }, 5000)
    }

    return () => {
      ws.close()
    }
  }, [])

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
        console.log(`✅ תא ${cellId} נפתח בהצלחה בלוקר ${lockerId}`)
      } else {
        console.error(`❌ שגיאה בפתיחת תא: ${result.error}`)
      }
    } catch (error) {
      console.error('שגיאה בפתיחת תא:', error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">טוען לוקרים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* כותרת */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <ArrowLeftIcon />
            <span>חזרה לדשבורד</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">ניהול לוקרים</h1>
          <p className="text-white/70 mt-2">
            ניהול וצפייה בכל הלוקרים והתאים במערכת
          </p>
        </div>

        {/* סיכום כללי */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-2">
              <BuildingIcon />
              <h3 className="text-lg font-semibold text-white">סה"כ לוקרים</h3>
            </div>
            <p className="text-3xl font-bold text-white">{Object.keys(lockers).length}</p>
          </div>
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-2">
              <PackageIcon />
              <h3 className="text-lg font-semibold text-white">לוקרים מחוברים</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {Object.values(lockers).filter(locker => locker.isOnline).length}
            </p>
          </div>
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-2">
              <LockedIcon />
              <h3 className="text-lg font-semibold text-white">תאים תפוסים</h3>
            </div>
            <p className="text-3xl font-bold text-orange-400">
              {Object.values(lockers).reduce((total, locker) => 
                total + Object.values(locker.cells).filter(cell => cell.hasPackage).length, 0
              )}
            </p>
          </div>
        </div>

        {/* רשימת לוקרים */}
        <div className="space-y-6">
          {Object.entries(lockers).map(([lockerId, locker]) => (
            <div key={lockerId} className="glass-card">
              <div className="p-6 border-b border-white/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon isOnline={locker.isOnline} />
                      <h2 className="text-xl font-bold text-white">
                        לוקר {lockerId}
                      </h2>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        locker.isOnline 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {locker.isOnline ? 'מחובר' : 'מנותק'}
                      </span>
                    </div>
                    <p className="text-sm text-white/60">
                      עדכון אחרון: {new Date(locker.lastSeen).toLocaleString('he-IL')}
                    </p>
                  </div>
                </div>
              </div>

              {/* תאים */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white/90 mb-4">תאים זמינים:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(locker.cells).map(([cellId, cell]) => (
                    <div key={cellId} className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-white">תא {cellId}</span>
                        <div className={`w-3 h-3 rounded-full ${
                          cell.locked ? 'bg-red-400' : 'bg-green-400'
                        }`}></div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-white/70 mb-3">
                        <p>סטטוס: {cell.locked ? 'נעול' : 'פתוח'}</p>
                        <p>חבילה: {cell.hasPackage ? 'יש' : 'אין'}</p>
                        {cell.packageId && (
                          <p>מזהה חבילה: {cell.packageId}</p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => unlockCell(lockerId, cellId)}
                        disabled={!locker.isOnline || actionLoading === `${lockerId}-${cellId}`}
                        className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === `${lockerId}-${cellId}` ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>פותח...</span>
                          </>
                        ) : (
                          <>
                            <UnlockedIcon />
                            <span>פתח תא</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 