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
  const [loading, setLoading] = useState(true)
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [showLockerForm, setShowLockerForm] = useState(false)
  const [showCellForm, setShowCellForm] = useState(false)
  const [controlLoading, setControlLoading] = useState<{ [key: string]: boolean }>({})

  // טעינת נתונים
  useEffect(() => {
    loadLockers()
  }, [])

  const loadLockers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/lockers-management')
      const data = await response.json()
      
      if (data.success) {
        setLockers(data.lockers)
      } else {
        console.error('שגיאה בטעינת לוקרים:', data.error)
      }
    } catch (error) {
      console.error('שגיאה בטעינת לוקרים:', error)
    } finally {
      setLoading(false)
    }
  }

  // פונקציות CRUD
  const saveLocker = async (lockerData: Partial<Locker>) => {
    try {
      const url = '/api/admin/lockers-management'
      const method = lockerData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lockerData, type: 'locker' })
      })

      const data = await response.json()
      
      if (data.success) {
        await loadLockers()
        setShowLockerForm(false)
        setSelectedLocker(null)
        alert('לוקר נשמר בהצלחה!')
      } else {
        alert('שגיאה: ' + data.error)
      }
    } catch (error) {
      console.error('שגיאה בשמירת לוקר:', error)
      alert('שגיאה בשמירת לוקר')
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

      const data = await response.json()
      
      if (data.success) {
        await loadLockers()
        setShowCellForm(false)
        setSelectedCell(null)
        alert('תא נשמר בהצלחה!')
      } else {
        alert('שגיאה: ' + data.error)
      }
    } catch (error) {
      console.error('שגיאה בשמירת תא:', error)
      alert('שגיאה בשמירת תא')
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
        await loadLockers()
        alert(`${type === 'locker' ? 'לוקר' : 'תא'} נמחק בהצלחה!`)
      } else {
        alert('שגיאה: ' + data.error)
      }
    } catch (error) {
      console.error('שגיאה במחיקה:', error)
      alert('שגיאה במחיקה')
    }
  }

  // בקרת תאים
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

      const data = await response.json()
      
      if (data.success) {
        alert(`פקודת ${action === 'open' ? 'פתיחה' : 'סגירה'} נשלחה בהצלחה!`)
        await loadLockers() // רענון נתונים
      } else {
        alert('שגיאה: ' + data.error)
      }
    } catch (error) {
      console.error('שגיאה בבקרת תא:', error)
      alert('שגיאה בבקרת תא')
    } finally {
      setControlLoading(prev => ({ ...prev, [controlKey]: false }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'text-green-400'
      case 'OFFLINE': return 'text-red-400'
      case 'AVAILABLE': return 'text-green-400'
      case 'OCCUPIED': return 'text-yellow-400'
      case 'MAINTENANCE': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'SMALL': return '📦'
      case 'MEDIUM': return '📫'
      case 'LARGE': return '🗃️'
      case 'WIDE': return '📮'
      default: return '📦'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">🔄 טוען נתונים...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6" style={{marginRight: '16rem'}}>
      <div className="max-w-7xl mx-auto">
        {/* כותרת */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🏢 ניהול לוקרים ותאים</h1>
            <p className="text-white/70">הוספה, עריכה ובקרה על לוקרים ותאים במערכת</p>
          </div>
          <button
            onClick={() => setShowLockerForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <span>➕</span>
            הוסף לוקר חדש
          </button>
        </div>

        {/* רשימת לוקרים */}
        <div className="space-y-6">
          {lockers.map(locker => (
            <div key={locker.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
              {/* פרטי לוקר */}
              <div className="border-b border-white/10 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-white">{locker.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(locker.status)} bg-white/10`}>
                        {locker.status === 'ONLINE' ? '🟢 מחובר' : '🔴 לא מחובר'}
                      </span>
                      {locker.lastSeen && (
                        <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded">
                          נראה לאחרונה: {new Date(locker.lastSeen).toLocaleString('he-IL')}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white/5 p-3 rounded-lg">
                        <span className="text-white/70 block text-xs">📍 מיקום:</span>
                        <span className="text-white font-medium">{locker.location}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg">
                        <span className="text-white/70 block text-xs">🌐 IP:</span>
                        <span className="text-white font-medium">{locker.ip || 'לא הוגדר'}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg">
                        <span className="text-white/70 block text-xs">📱 Device ID:</span>
                        <span className="text-white font-medium">{locker.deviceId || 'לא הוגדר'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowLockerForm(true)
                      }}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      ✏️ ערוך
                    </button>
                    <button
                      onClick={() => deleteItem(locker.id, 'locker')}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      🗑️ מחק
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowCellForm(true)
                      }}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      ➕ הוסף תא
                    </button>
                  </div>
                </div>
              </div>

              {/* תאים */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  📦 תאים ({locker.cells.length})
                </h4>
                
                {locker.cells.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-lg border-2 border-dashed border-white/20">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-white/70 mb-4">אין תאים בלוקר זה</p>
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowCellForm(true)
                      }}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                    >
                      הוסף תא ראשון
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locker.cells.map(cell => (
                      <div key={cell.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{getSizeIcon(cell.size)}</span>
                            <div>
                              <h5 className="font-medium text-white">
                                תא {cell.cellNumber}
                              </h5>
                              {cell.name && <p className="text-sm text-white/70">{cell.name}</p>}
                              <p className="text-xs text-white/50">{cell.code}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(cell.status)} bg-white/10`}>
                            {cell.status === 'AVAILABLE' ? '✅ זמין' : 
                             cell.status === 'OCCUPIED' ? '📦 תפוס' : 
                             cell.status === 'MAINTENANCE' ? '🔧 תחזוקה' : cell.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-white/70">גודל:</span>
                            <span className="text-white">{cell.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">מצב:</span>
                            <span className="text-white">{cell.isLocked ? '🔒 נעול' : '🔓 פתוח'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">פתיחות:</span>
                            <span className="text-white">{cell.openCount}</span>
                          </div>
                          {cell.lastOpenedAt && (
                            <div className="flex justify-between">
                              <span className="text-white/70">נפתח לאחרונה:</span>
                              <span className="text-white text-xs">
                                {new Date(cell.lastOpenedAt).toLocaleString('he-IL')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <button
                            onClick={() => controlCell(cell.cellNumber, locker.id, 'open')}
                            disabled={controlLoading[`${cell.cellNumber}-open`]}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-300 py-2 rounded text-sm transition-all disabled:opacity-50"
                          >
                            {controlLoading[`${cell.cellNumber}-open`] ? '⏳ פותח...' : '🔓 פתח'}
                          </button>
                          <button
                            onClick={() => controlCell(cell.cellNumber, locker.id, 'close')}
                            disabled={controlLoading[`${cell.cellNumber}-close`]}
                            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 py-2 rounded text-sm transition-all disabled:opacity-50"
                          >
                            {controlLoading[`${cell.cellNumber}-close`] ? '⏳ נועל...' : '🔒 נעל'}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCell(cell)
                              setShowCellForm(true)
                            }}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded text-xs transition-all flex-1"
                          >
                            ✏️ ערוך
                          </button>
                          <button
                            onClick={() => deleteItem(cell.id, 'cell')}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded text-xs transition-all flex-1"
                          >
                            🗑️ מחק
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* אין לוקרים */}
        {lockers.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🏢</div>
            <h3 className="text-2xl font-semibold text-white mb-4">אין לוקרים במערכת</h3>
            <p className="text-white/70 mb-8 text-lg">התחל בהוספת הלוקר הראשון שלך למערכת</p>
            <button
              onClick={() => setShowLockerForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all text-lg"
            >
              ➕ הוסף לוקר ראשון
            </button>
          </div>
        )}

        {/* טופס לוקר */}
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

        {/* טופס תא */}
        {showCellForm && (
          <CellForm
            cell={selectedCell}
            lockerId={selectedLocker?.id}
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

// קומפוננט טופס לוקר
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

// קומפוננט טופס תא
function CellForm({ cell, lockerId, onSave, onCancel }: {
  cell: Cell | null
  lockerId?: number
  onSave: (data: Partial<Cell>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    cellNumber: cell?.cellNumber || 1,
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
              required
            />
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
              <option value="SMALL">📦 קטן</option>
              <option value="MEDIUM">📫 בינוני</option>
              <option value="LARGE">🗃️ גדול</option>
              <option value="WIDE">📮 רחב</option>
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
            <label htmlFor="cellActive" className="text-white">תא פעיל</label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => onSave(cell ? {...formData, id: cell.id} : formData)}
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