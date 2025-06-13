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
  ip: string
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
        client: 'web-admin',
        secret: process.env.NEXT_PUBLIC_ADMIN_SECRET
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // בדיקת תקינות בסיסית
        if (!data || typeof data !== 'object') {
          throw new Error('נתונים לא תקינים התקבלו מהשרת');
        }

        if (!data.type) {
          throw new Error('חסר שדה type בנתונים');
        }

        if (data.type === 'lockerUpdate' && (!data.data || typeof data.data !== 'object')) {
          throw new Error('נתוני לוקר לא תקינים');
        }

        console.log('📨 התקבלה הודעה:', {
          type: data.type,
          timestamp: new Date(data.timestamp).toLocaleString('he-IL'),
          data: data.data
        })

        switch (data.type) {
          case 'register':
            // עדכון לוקר בודד
            setLockers(prev => ({
              ...prev,
              [data.id]: {
                id: data.id,
                isOnline: data.status === 'online',
                lastSeen: new Date().toISOString(),
                cells: prev[data.id]?.cells || {},
                ip: data.ip
              }
            }))
            setLoading(false)
            break

          case 'disconnect':
            // עדכון סטטוס לוקר שהתנתק
            setLockers(prev => {
              if (!prev[data.id]) return prev
              return {
                ...prev,
                [data.id]: {
                  ...prev[data.id],
                  isOnline: false,
                  lastSeen: new Date().toISOString()
                }
              }
            })
            break

          case 'lockerUpdate':
            // עדכון כל הלוקרים
            if (data.data) {
              setLockers(prev => {
                const updatedLockers = { ...prev };
                
                // עדכון או הוספת לוקרים חדשים
                Object.entries(data.data).forEach(([id, lockerData]: [string, any]) => {
                  updatedLockers[id] = {
                    id,
                    isOnline: lockerData.isOnline ?? true,
                    lastSeen: lockerData.lastSeen || new Date(data.timestamp).toISOString(),
                    cells: {
                      ...(prev[id]?.cells || {}),
                      ...(lockerData.cells || {})
                    },
                    ip: lockerData.ip || prev[id]?.ip
                  };
                });
                
                return updatedLockers;
              });
              setLoading(false);
            }
            break

          case 'cellUpdate':
            // עדכון תא ספציפי
            setLockers(prev => {
              if (!prev[data.lockerId]) return prev
              return {
                ...prev,
                [data.lockerId]: {
                  ...prev[data.lockerId],
                  cells: {
                    ...prev[data.lockerId].cells,
                    [data.cellId]: {
                      id: data.cellId,
                      locked: data.locked,
                      hasPackage: data.hasPackage,
                      packageId: data.packageId
                    }
                  }
                }
              }
            })
            break
        }
      } catch (error) {
        console.error('שגיאה בעיבוד הודעה:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ שגיאת WebSocket:', error);
      setLoading(false);
    };

    ws.onclose = () => {
      console.log('🔌 החיבור לשרת החומרה נסגר');
      setLoading(true);
      
      // ניסיון התחברות מחדש אחרי 5 שניות
      setTimeout(() => {
        console.log('🔄 מנסה להתחבר מחדש...');
        window.location.reload();
      }, 5000);
    };

    // טיימר לבדיקת חיבור
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
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
            <p className="text-sm text-white/60 mt-2">רשומים במערכת</p>
          </div>
          
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-2">
              <PackageIcon />
              <h3 className="text-lg font-semibold text-white">לוקרים מחוברים</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {Object.values(lockers).filter(locker => locker.isOnline).length}
            </p>
            <p className="text-sm text-white/60 mt-2">פעילים כרגע</p>
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
            <p className="text-sm text-white/60 mt-2">מכילים חבילות</p>
          </div>
        </div>

        {/* רשימת לוקרים */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(lockers).map((locker) => (
            <div key={locker.id} className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <StatusIcon isOnline={locker.isOnline} />
                  <h3 className="text-lg font-semibold text-white">{locker.id}</h3>
                </div>
                <span className="text-sm text-white/60">
                  {locker.isOnline ? 'מחובר' : 'מנותק'}
                </span>
              </div>
              
              <div className="text-sm text-white/60 mb-4">
                <p>IP: {locker.ip || 'לא ידוע'}</p>
                <p>עדכון אחרון: {new Date(locker.lastSeen).toLocaleString('he-IL')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(locker.cells).map(([cellId, cell]) => (
                  <button
                    key={cellId}
                    onClick={() => unlockCell(locker.id, cellId)}
                    disabled={!locker.isOnline || actionLoading === `${locker.id}-${cellId}`}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-300
                      ${cell.hasPackage ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/80'}
                      ${!locker.isOnline && 'opacity-50 cursor-not-allowed'}
                      hover:bg-white/20`}
                  >
                    {cell.locked ? <LockedIcon /> : <UnlockedIcon />}
                    <span className="text-sm font-medium">תא {cellId}</span>
                    {cell.hasPackage && (
                      <span className="text-xs">
                        {cell.packageId ? `חבילה ${cell.packageId}` : 'תפוס'}
                      </span>
                    )}
                    {actionLoading === `${locker.id}-${cellId}` && (
                      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 