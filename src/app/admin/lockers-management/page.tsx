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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card">
          <h1 className="text-3xl font-bold text-white mb-6">ניהול לוקרים ותאים</h1>
          <p className="text-white/70">דף ניהול לוקרים ותאים יגיע בקרוב...</p>
        </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-6">
          {locker ? 'ערוך לוקר' : 'הוסף לוקר חדש'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">שם הלוקר</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="input-field"
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
              className="input-field"
              placeholder="כניסה ראשית"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">תיאור</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="input-field"
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
                className="input-field"
                placeholder="192.168.0.104"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">פורט</label>
              <input
                type="number"
                value={formData.port}
                onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
                className="input-field"
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
              className="input-field"
              placeholder="ESP32_001"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
            />
            <label htmlFor="isActive" className="text-white">לוקר פעיל</label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSave(locker ? {...formData, id: locker.id} : formData)}
            className="btn-primary flex-1"
          >
            💾 שמור
          </button>
          <button onClick={onCancel} className="btn-secondary">
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-6">
          {cell ? 'ערוך תא' : 'הוסף תא חדש'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">מספר תא</label>
            <input
              type="number"
              value={formData.cellNumber}
              onChange={e => setFormData({...formData, cellNumber: parseInt(e.target.value)})}
              className="input-field"
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
              className="input-field"
              placeholder="תא קטן ראשון"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">גודל תא</label>
            <select
              value={formData.size}
              onChange={e => setFormData({...formData, size: e.target.value})}
              className="input-field"
            >
              <option value="SMALL">📦 קטן</option>
              <option value="MEDIUM">📫 בינוני</option>
              <option value="LARGE">🗃️ גדול</option>
              <option value="WIDE">📮 רחב</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cellActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
            />
            <label htmlFor="cellActive" className="text-white">תא פעיל</label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSave(cell ? {...formData, id: cell.id} : formData)}
            className="btn-primary flex-1"
          >
            💾 שמור
          </button>
          <button onClick={onCancel} className="btn-secondary">
            ❌ ביטול
          </button>
        </div>
      </div>
    </div>
  )
} 