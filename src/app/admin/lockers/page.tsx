'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

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
  console.log('🔧 נטען דף ניהול לוקרים (ADMIN)')
  console.log('🌐 URL נוכחי בדף אדמין לוקרים:', typeof window !== 'undefined' ? window.location.href : 'SSR')
  const [lockers, setLockers] = useState<{ [key: string]: Locker }>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  // --- WebSocket Status ---
  const [wsStatus, setWsStatus] = useState<'מתחבר' | 'מחובר' | 'מנותק' | 'שגיאה'>('מתחבר');
  const [lastMessage, setLastMessage] = useState<string>('');

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let pingInterval: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connect = () => {
      try {
        setWsStatus('מתחבר');
        // Force override לוודא שתמיד נשתמש בפורט הנכון  
        let wsUrl = process.env.NEXT_PUBLIC_HARDWARE_WS_URL || 'wss://lockerweb-production.up.railway.app:3004';
        if (wsUrl.includes('lockerweb-production.up.railway.app') && !wsUrl.includes(':3004')) {
          wsUrl = wsUrl.replace('lockerweb-production.up.railway.app', 'lockerweb-production.up.railway.app:3004');
        }
        console.log('🔗 WebSocket URL נקבע:', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsStatus('מחובר');
          setLastMessage('התחברת בהצלחה לשרת החומרה');
          console.log('✅ התחברות לשרת החומרה הצליחה');
          reconnectAttempts = 0;
          
          // שליחת הודעת זיהוי עם הסיסמה הקבועה
          ws?.send(JSON.stringify({
            type: 'identify',
            client: 'web-admin',
            secret: '86428642'
          }));

          // התחלת פינג תקופתי
          pingInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              const pingMessage = { type: 'ping', id: 'admin-lockers' }
              ws.send(JSON.stringify(pingMessage));
              console.log('📤 נשלח פינג לRailway:', pingMessage);
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(event.data);
            
            // בדיקת תקינות בסיסית
            if (!data || typeof data !== 'object') {
              throw new Error('נתונים לא תקינים התקבלו מהשרת');
            }

            if (!data.type) {
              throw new Error('חסר שדה type בנתונים');
            }

            // הוספת לוג מפורט
            const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString('he-IL') : new Date().toLocaleString('he-IL');
            console.log('📨 התקבלה הודעה:', {
              type: data.type,
              timestamp,
              data: JSON.stringify(data.data, null, 2)
            });

            switch (data.type) {
              case 'error':
                console.error('❌ שגיאה מהשרת:', data.message);
                break;

              case 'register':
                if (!data.id) {
                  throw new Error('חסר מזהה לוקר בהודעת הרשמה');
                }
                setLockers(prev => ({
                  ...prev,
                  [data.id]: {
                    id: data.id,
                    isOnline: data.status === 'online',
                    lastSeen: new Date().toISOString(),
                    cells: prev[data.id]?.cells || {},
                    ip: data.ip
                  }
                }));
                setLoading(false);
                break;

              case 'disconnect':
                if (!data.id) {
                  throw new Error('חסר מזהה לוקר בהודעת ניתוק');
                }
                setLockers(prev => {
                  if (!prev[data.id]) return prev;
                  return {
                    ...prev,
                    [data.id]: {
                      ...prev[data.id],
                      isOnline: false,
                      lastSeen: new Date().toISOString()
                    }
                  };
                });
                break;

              case 'lockerUpdate':
                console.log('📨 התקבלה הודעת עדכון לוקר:', data);
                if (!data.data || typeof data.data !== 'object') {
                  throw new Error('נתוני עדכון לוקר לא תקינים');
                }
                setLockers(prev => {
                  const updatedLockers = { ...prev };
                  const lockersData = data.data.lockers || data.data;
                  console.log('📦 נתוני לוקרים:', lockersData);

                  Object.entries(lockersData).forEach(([id, lockerData]: [string, any]) => {
                    console.log(`🔄 מעדכן לוקר ${id}:`, lockerData);
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

                  console.log('✅ לוקרים מעודכנים:', updatedLockers);
                  return updatedLockers;
                });
                setLoading(false);
                break;

              case 'cellUpdate':
                if (!data.lockerId || !data.cellId) {
                  throw new Error('חסרים פרטי זיהוי בעדכון תא');
                }
                setLockers(prev => {
                  if (!prev[data.lockerId]) return prev;
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
                  };
                });
                break;

              case 'pong':
                // טיפול ב-pong (מענה ל-ping)
                if (data.id) {
                  console.log(`🏓 pong התקבל מהשרת עם ID: ${data.id}`);
                } else {
                  console.log('🏓 pong התקבל מהשרת ללא ID (תקין)');
                }
                break;

              default:
                console.warn('⚠️ התקבל סוג הודעה לא מוכר:', data.type);
            }
          } catch (error) {
            console.error('❌ שגיאה בעיבוד הודעה:', error);
            
            // שליחת שגיאה לשרת לוגים
            fetch('/api/log', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                level: 'error',
                message: error instanceof Error ? error.message : 'שגיאה לא ידועה',
                source: 'websocket',
                data: event.data
              })
            }).catch(console.error);
          }
        };

        ws.onerror = (error) => {
          setWsStatus('שגיאה');
          setLastMessage('שגיאה בחיבור לשרת החומרה');
          console.error('❌ שגיאת WebSocket:', error);
          setLoading(false);
        };

        ws.onclose = () => {
          setWsStatus('מנותק');
          setLastMessage('החיבור לשרת החומרה נסגר');
          console.log('🔌 החיבור לשרת החומרה נסגר');
          setLoading(true);
          
          // ניקוי טיימרים
          clearInterval(pingInterval);
          
          // ניסיון התחברות מחדש
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`🔄 ניסיון התחברות מחדש ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
            reconnectTimeout = setTimeout(connect, 5000);
          } else {
            console.error('❌ נכשלו כל ניסיונות ההתחברות');
            setLoading(false);
          }
        };
      } catch (error) {
        console.error('❌ שגיאה ביצירת חיבור WebSocket:', error);
        setLoading(false);
      }
    };

    // התחברות ראשונית
    connect();

    // ניקוי בעת עזיבת הדף
    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      if (ws) {
        ws.close();
      }
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

  // --- תצוגת סטטוס WebSocket ---
  const wsStatusColor = wsStatus === 'מחובר' ? 'bg-green-500' : wsStatus === 'מתחבר' ? 'bg-yellow-400' : wsStatus === 'מנותק' ? 'bg-gray-400' : 'bg-red-500';

  // --- תצוגת טעינה ---
  const loadingScreen = (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
      <p className="mt-4 text-white/80">טוען לוקרים...</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">טוען לוקרים...</p>
        </div>
      </div>
    )
  }

  // בדיקה אם אין לוקרים
  if (Object.keys(lockers).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-white mb-2">אין לוקרים זמינים</h2>
          <p className="text-white/80">מחכה לחיבור לוקרים למערכת...</p>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }}
            className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300"
          >
            רענן דף
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* כותרת ברורה */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔧 ניהול לוקרים - דף אדמין</h1>
          <p className="text-white/70">ממשק ניהול לוקרים ותאים</p>
        </div>
        {/* חלון סטטוס WebSocket מוצג תמיד */}
        <div className="mb-4 p-3 rounded-lg border border-gray-300 bg-white flex items-center gap-4 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${wsStatusColor}`}></div>
          <span className="font-bold">סטטוס חיבור:</span>
          <span className="mr-2">{wsStatus}</span>
          <span className="ml-auto text-xs text-gray-500 truncate max-w-xs" title={lastMessage}>הודעה אחרונה: {lastMessage}</span>
        </div>

        {/* אם בטעינה - מציגים את מסך הטעינה מתחת לסטטוס */}
        {loading ? loadingScreen : (
          <>
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
                    total + Object.values(locker.cells || {}).filter(cell => cell.hasPackage).length, 0
                  )}
                </p>
                <p className="text-sm text-white/60 mt-2">מכילים חבילות</p>
              </div>
            </div>

            {/* רשימת לוקרים */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(lockers).map(([lockerId, locker]) => (
                <div key={lockerId} className="glass-card relative overflow-hidden">
                  {/* סטטוס חיבור */}
                  <div className={`absolute top-0 right-0 left-0 h-1 ${locker.isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon isOnline={locker.isOnline} />
                      <h3 className="text-lg font-semibold text-white">{lockerId}</h3>
                    </div>
                    <span className={`text-sm ${locker.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                      {locker.isOnline ? 'מחובר' : 'מנותק'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-white/60 mb-4">
                    <p>IP: {locker.ip || 'לא ידוע'}</p>
                    <p>עדכון אחרון: {new Date(locker.lastSeen).toLocaleString('he-IL')}</p>
                  </div>

                  {/* תאים */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(locker.cells || {}).map(([cellId, cell]) => (
                      <button
                        key={cellId}
                        onClick={() => unlockCell(lockerId, cellId)}
                        disabled={!locker.isOnline || actionLoading === `${lockerId}-${cellId}`}
                        className={`relative p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-300
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
                        {actionLoading === `${lockerId}-${cellId}` && (
                          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          </div>
                        )}
                      </button>
                    ))}
                    {/* אם אין תאים */}
                    {(!locker.cells || Object.keys(locker.cells).length === 0) && (
                      <div className="col-span-2 text-center py-4 text-white/60">
                        אין תאים זמינים
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 