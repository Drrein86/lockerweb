'use client'

import { useState, useEffect } from 'react'

interface Cell {
  id: number
  cellNumber: number
  code: string
  name?: string
  size: string
  status: string
  isLocked: boolean
  isActive: boolean
  lockerId: number
  openCount: number
  lastOpenedAt?: string
}

interface Locker {
  id: number
  name: string
  location: string
  description?: string
  ip?: string
  port?: number
  deviceId?: string
  status: string
  lastSeen?: string
  isActive: boolean
  cells: Cell[]
}

export default function LockersManagementPage() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [connectedLockers, setConnectedLockers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [showLockerForm, setShowLockerForm] = useState(false)
  const [showCellForm, setShowCellForm] = useState(false)
  const [controlLoading, setControlLoading] = useState<{ [key: string]: boolean }>({})

  console.log('🚀 LockersManagementPage נטען')

  useEffect(() => {
    loadLockers()
    loadConnectedLockers()
  }, [])

  const loadLockers = async () => {
    console.log('📊 מתחיל לטעון לוקרים...')
    try {
      setLoading(true)
      console.log('🌐 שולח בקשה ל-API:', '/api/admin/lockers-management')
      const response = await fetch('/api/admin/lockers-management')
      console.log('📡 תגובה מהשרת:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      console.log('📋 מפענח JSON...')
      const data = await response.json()
      console.log('✅ נתונים התקבלו:', data)
      
      if (data.success && Array.isArray(data.lockers)) {
        const validatedLockers = data.lockers.map((locker: any) => ({
          ...locker,
          id: locker.id || Math.random(),
          cells: Array.isArray(locker.cells) ? locker.cells.map((cell: any) => ({
            ...cell,
            id: cell.id || Math.random(),
            cellNumber: cell.cellNumber || cell.id || Math.random()
          })) : []
        }))
        
        console.log(' מעדכן רשימת לוקרים:', validatedLockers.length, 'לוקרים')
        setLockers(validatedLockers)
      } else {
        console.error('שגיאה בטעינת לוקרים:', data.error)
        setLockers([])
      }
    } catch (error) {
      console.error('❌ שגיאה בטעינת לוקרים:', error)
      console.error('🔍 פרטי השגיאה:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      setLockers([])
    } finally {
      setLoading(false)
      console.log('✅ טעינת לוקרים הושלמה')
    }
  }

  const loadConnectedLockers = async () => {
    try {
      const response = await fetch('/api/admin/lockers')
      
      if (!response.ok) {
        console.warn('לא ניתן לטעון לוקרים מחוברים')
        setConnectedLockers([])
        return
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.lockers)) {
        const validatedConnectedLockers = data.lockers.map((locker: any, index: number) => ({
          ...locker,
          deviceId: locker.deviceId || locker.ip || `locker_${index}`,
          ip: locker.ip || 'unknown'
        }))
        setConnectedLockers(validatedConnectedLockers)
      } else {
        setConnectedLockers([])
      }
    } catch (error) {
      console.error('שגיאה בטעינת לוקרים מחוברים:', error)
      setConnectedLockers([])
    }
  }

  const saveLocker = async (lockerData: Partial<Locker>) => {
    console.log('💾 מתחיל לשמור לוקר:', lockerData)
    try {
      const url = '/api/admin/lockers-management'
      const method = lockerData.id ? 'PUT' : 'POST'
      console.log('🌐 שולח בקשה:', method, url)
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lockerData, type: 'locker' })
      })
      console.log('📡 תגובה מהשרת:', response.status, response.statusText)

      if (!response.ok) {
        console.error('❌ HTTP Error בשמירת לוקר:', response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ נתונים התקבלו:', data)
      
      if (data.success) {
        console.log('🔄 מרענן רשימת לוקרים...')
        await loadLockers()
        setShowLockerForm(false)
        setSelectedLocker(null)
        alert('לוקר נשמר בהצלחה!')
      } else {
        console.error('❌ שגיאה ב-API:', data.error)
        alert('שגיאה: ' + (data.error || 'שגיאה לא ידועה'))
      }
    } catch (error) {
      console.error('❌ שגיאה בשמירת לוקר:', error)
      console.error('🔍 פרטי השגיאה:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      alert('שגיאה בשמירת לוקר: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'))
    }
  }

  const saveCell = async (cellData: Partial<Cell>) => {
    try {
      const url = '/api/admin/lockers-management'
      const method = cellData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cellData, type: 'cell' })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        await loadLockers()
        setShowCellForm(false)
        setSelectedCell(null)
        alert('תא נשמר בהצלחה!')
      } else {
        alert('שגיאה: ' + (data.error || 'שגיאה לא ידועה'))
      }
    } catch (error) {
      console.error('שגיאה בשמירת תא:', error)
      alert('שגיאה בשמירת תא: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'))
    }
  }

  const deleteItem = async (id: number, type: 'locker' | 'cell') => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק ${type === 'locker' ? 'לוקר' : 'תא'} זה?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/lockers-management?id=${id}&type=${type}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        await loadLockers()
      } else {
        alert('שגיאה: ' + (data.error || 'שגיאה לא ידועה'))
      }
    } catch (error) {
      console.error('שגיאה במחיקה:', error)
      alert('שגיאה במחיקה')
    }
  }

  const deleteLocker = (id: number) => deleteItem(id, 'locker')

  const controlCell = async (cellId: number, lockerId: number, action: 'open' | 'close') => {
    const controlKey = `${cellId}-${action}`
    setControlLoading(prev => ({ ...prev, [controlKey]: true }))

    try {
      const response = await fetch('/api/admin/cell-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cellId,
          lockerId,
          action,
          userId: 'admin'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        alert(`פקודת ${action === 'open' ? 'פתיחה' : 'סגירה'} נשלחה בהצלחה!`)
        await loadLockers()
      } else {
        alert('שגיאה: ' + (data.error || 'שגיאה לא ידועה'))
      }
    } catch (error) {
      console.error('שגיאה בבקרת תא:', error)
      alert('שגיאה בבקרת תא: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'))
    } finally {
      setControlLoading(prev => ({ ...prev, [controlKey]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">🔧 ניהול לוקרים</h1>
            <p className="text-white/70 text-sm sm:text-base">ממשק ניהול לוקרים ותאים</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowLockerForm(true)}
              className="w-full sm:w-auto btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base"
            >
              + הוסף לוקר חדש
            </button>
            <button
              onClick={loadLockers}
              className="w-full sm:w-auto btn bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base"
            >
              🔄 רענן
            </button>
          </div>
        </div>

        {/* לוקרים מחוברים */}
        {connectedLockers.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
              לוקרים מחוברים ({connectedLockers.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {connectedLockers.map((connectedLocker, index) => (
                <div key={connectedLocker.deviceId || connectedLocker.ip || `connected_${index}`} className="bg-green-500/10 backdrop-blur-md rounded-lg p-4 border border-green-400/30 hover:bg-green-500/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="font-medium text-green-400 text-sm sm:text-base truncate">{String(connectedLocker.deviceId || connectedLocker.ip || 'לוקר לא מזוהה')}</span>
                    </div>
                    <span className="text-xs text-green-300">{connectedLocker.isOnline ? 'פעיל' : 'לא פעיל'}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-white/60 mb-3">
                    <div className="truncate">IP: {String(connectedLocker.ip || 'לא מוגדר')}</div>
                    <div className="truncate">עדכון אחרון: {connectedLocker.lastSeen ? new Date(connectedLocker.lastSeen).toLocaleString('he-IL') : 'לא מוגדר'}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedLocker({
                        id: 0,
                        name: connectedLocker.name || '',
                        location: '',
                        description: '',
                        ip: connectedLocker.ip || '',
                        port: 80,
                        deviceId: connectedLocker.deviceId || '',
                        status: 'OFFLINE',
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        cells: []
                      })
                      setShowLockerForm(true)
                    }}
                    className="w-full text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-2 rounded transition-all"
                  >
                    הוסף למערכת
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {lockers.map((locker, index) => (
            <div key={locker.id || `locker_${index}`} className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all">
              {/* פרטי לוקר */}
              <div className="border-b border-white/10 pb-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{String(locker.name || `לוקר ${locker.id}`)}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${locker.status === 'ONLINE' ? 'text-green-400' : 'text-red-400'} bg-white/10 inline-block w-fit`}>
                        {String(locker.status || 'לא מוגדר')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      <div><span className="text-white/60">מיקום:</span> <span className="text-white">{String(locker.location || 'לא מוגדר')}</span></div>
                      <div><span className="text-white/60">IP:</span> <span className="text-white">{String(locker.ip || 'לא מוגדר')}</span></div>
                      <div><span className="text-white/60">Device ID:</span> <span className="text-white">{String(locker.deviceId || 'לא מוגדר')}</span></div>
                      <div><span className="text-white/60">סטטוס:</span> <span className={`${locker.status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>{String(locker.status || 'לא מוגדר')}</span></div>
                      <div className="sm:col-span-2"><span className="text-white/60">עדכון אחרון:</span> <span className="text-white">{locker.lastSeen ? new Date(locker.lastSeen).toLocaleString('he-IL') : 'לא מוגדר'}</span></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowLockerForm(true)
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-all"
                    >
                      ✏️ עריכה
                    </button>
                    <button
                      onClick={() => deleteLocker(locker.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-all"
                    >
                      🗑️ מחיקה
                    </button>
                  </div>
                </div>
              </div>

              {/* תאים */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <h4 className="text-lg sm:text-xl font-semibold text-white">תאים ({locker.cells?.length || 0})</h4>
                  {locker.cells.length < 40 && (
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowCellForm(true)
                      }}
                      className="w-full sm:w-auto bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      ➕ הוסף תא
                    </button>
                  )}
                </div>
                
                {locker.cells && locker.cells.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {locker.cells.map((cell, cellIndex) => (
                      <div key={`${locker.id || index}-${cell.cellNumber || cell.id || cellIndex}`} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-white text-sm truncate block">{String(cell.name || `תא ${cell.cellNumber || cell.id}`)}</span>
                            <span className="text-xs text-white/60">#{String(cell.cellNumber || cell.id)}</span>
                          </div>
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cell.status === 'AVAILABLE' ? 'bg-green-400' : cell.status === 'OCCUPIED' ? 'bg-red-400' : 'bg-orange-400'}`}></div>
                        </div>
                        
                        <div className="space-y-1 text-xs text-white/70 mb-3">
                          <div>גודל: {String(cell.size || 'לא מוגדר')}</div>
                          <div>סטטוס: {String(cell.status || 'לא מוגדר')}</div>
                          <div>נעול: {cell.isLocked ? 'כן' : 'לא'}</div>
                          <div>פעיל: {cell.isActive ? 'כן' : 'לא'}</div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => controlCell(cell.id, locker.id, 'open')}
                            disabled={controlLoading[`${cell.id}-open`] || locker.status !== 'ONLINE'}
                            className="w-full text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded transition-all"
                          >
                            {controlLoading[`${cell.id}-open`] ? 'פותח...' : '🔓 פתח'}
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedCell(cell)
                                setSelectedLocker(locker)
                                setShowCellForm(true)
                              }}
                              className="flex-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-1 rounded transition-all"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteItem(cell.id, 'cell')}
                              className="flex-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded transition-all"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* כפתור הוספת תא חדש אם יש פחות מ-40 */}
                    {locker.cells.length < 40 && (
                      <div 
                        onClick={() => {
                          setSelectedLocker(locker)
                          setShowCellForm(true)
                        }}
                        className="bg-white/5 rounded-lg p-3 border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[120px]"
                      >
                        <span className="text-2xl mb-2">➕</span>
                        <span className="text-sm text-white/70">הוסף תא חדש</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-6 text-center">
                    <p className="text-white/50 mb-4">אין תאים בלוקר זה</p>
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowCellForm(true)
                      }}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      ➕ הוסף תא ראשון
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* אין לוקרים */}
        {lockers.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-20">
            <div className="text-6xl sm:text-8xl mb-6">🏢</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">אין לוקרים במערכת</h3>
            <p className="text-white/70 mb-6 text-sm sm:text-base max-w-md mx-auto px-4">
              התחל על ידי הוספת לוקר ראשון למערכת או חיבור לוקרים קיימים
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <button
                onClick={() => setShowLockerForm(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                ➕ הוסף לוקר ראשון
              </button>
              <button
                onClick={loadConnectedLockers}
                className="w-full sm:w-auto bg-green-500/20 hover:bg-green-500/30 text-green-300 px-6 py-3 rounded-lg font-medium transition-all"
              >
                🔄 חפש לוקרים מחוברים
              </button>
            </div>
          </div>
        )}

        {showLockerForm && (
          <LockerForm
            locker={selectedLocker}
            onSave={saveLocker}
            onCancel={() => {
              setShowLockerForm(false)
              setSelectedLocker(null)
            }}
          />
        )}

        {showCellForm && (
          <CellForm
            cell={selectedCell}
            lockerId={selectedLocker?.id}
            maxCellNumber={selectedLocker ? Math.max(...(selectedLocker.cells.map(c => c.cellNumber)), 0) + 1 : 1}
            onSave={saveCell}
            onCancel={() => {
              setShowCellForm(false)
              setSelectedCell(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function LockerForm({ locker, onSave, onCancel }: {
  locker: Locker | null
  onSave: (data: Partial<Locker>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: locker?.name || '',
    location: locker?.location || '',
    description: locker?.description || '',
    ip: locker?.ip || '',
    port: locker?.port || 80,
    deviceId: locker?.deviceId || '',
    isActive: locker?.isActive ?? true
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-xl max-w-md w-full p-6 border border-white/20">
        <h3 className="text-2xl font-bold text-white mb-6">
          {locker ? '✏️ ערוך לוקר' : '➕ הוסף לוקר חדש'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">שם הלוקר</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="לוקר ראשי"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">מיקום</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="כניסה ראשית"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">תיאור</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="תיאור הלוקר..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">כתובת IP</label>
              <input
                type="text"
                value={formData.ip}
                onChange={e => setFormData({...formData, ip: e.target.value})}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
                placeholder="192.168.0.104"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">פורט</label>
              <input
                type="number"
                value={formData.port}
                onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
                placeholder="80"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Device ID</label>
            <input
              type="text"
              value={formData.deviceId}
              onChange={e => setFormData({...formData, deviceId: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="ESP32_001"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-5 h-5 text-blue-500 border-white/20 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-white">לוקר פעיל</label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => onSave(locker ? {...formData, id: locker.id} : formData)}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all flex-1"
          >
            💾 שמור
          </button>
          <button 
            onClick={onCancel} 
            className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-6 py-3 rounded-lg font-medium transition-all"
          >
            ❌ ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

function CellForm({ cell, lockerId, maxCellNumber, onSave, onCancel }: {
  cell: Cell | null
  lockerId?: number
  maxCellNumber: number
  onSave: (data: Partial<Cell>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    cellNumber: cell?.cellNumber || maxCellNumber,
    name: cell?.name || '',
    size: cell?.size || 'MEDIUM',
    isActive: cell?.isActive ?? true,
    lockerId: cell?.lockerId || lockerId || 0
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-xl max-w-md w-full p-6 border border-white/20">
        <h3 className="text-2xl font-bold text-white mb-6">
          {cell ? '✏️ ערוך תא' : '➕ הוסף תא חדש'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">מספר תא</label>
            <input
              type="number"
              value={formData.cellNumber}
              onChange={e => setFormData({...formData, cellNumber: parseInt(e.target.value)})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              min="1"
              max="40"
              required
            />
            <p className="text-xs text-white/50 mt-1">
              מספר תא בין 1-40 (המספר הבא המוצע: {maxCellNumber})
            </p>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">שם התא (אופציונלי)</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="תא קטן ראשון"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">גודל תא</label>
            <select
              value={formData.size}
              onChange={e => setFormData({...formData, size: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SMALL">📦 קטן - מתאים לחבילות קטנות</option>
              <option value="MEDIUM">📫 בינוני - מתאים לרוב החבילות</option>
              <option value="LARGE">🗃️ גדול - מתאים לחבילות גדולות</option>
              <option value="WIDE">📮 רחב - מתאים לחבילות שטוחות</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="cellActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-5 h-5 text-blue-500 border-white/20 rounded focus:ring-blue-500"
            />
            <label htmlFor="cellActive" className="text-white">תא פעיל ומוכן לשימוש</label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => onSave(cell ? {...formData, id: cell.id} : formData)}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all flex-1"
          >
            💾 שמור תא
          </button>
          <button 
            onClick={onCancel} 
            className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-6 py-3 rounded-lg font-medium transition-all"
          >
            ❌ ביטול
          </button>
        </div>
      </div>
    </div>
  )
} 