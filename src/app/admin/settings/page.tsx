'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Settings {
  websocketUrl: string
  adminSecret: string
  reconnectAttempts: number
  reconnectInterval: number
  pingInterval: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    websocketUrl: process.env.NEXT_PUBLIC_HARDWARE_WS_URL || '',
    adminSecret: '',
    reconnectAttempts: 3,
    reconnectInterval: 5000,
    pingInterval: 30000
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // כאן יתווסף בהמשך קוד לשמירת ההגדרות
    alert('ההגדרות נשמרו בהצלחה')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">הגדרות מערכת</h1>
        <Link 
          href="/admin/lockers"
          className="flex items-center px-4 py-2 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
        >
          חזרה ללוקרים
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="block mb-2 font-medium">כתובת שרת WebSocket</label>
          <input
            type="text"
            value={settings.websocketUrl}
            onChange={(e) => setSettings({ ...settings, websocketUrl: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            placeholder="wss://example.com"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">סיסמת מנהל</label>
          <input
            type="password"
            value={settings.adminSecret}
            onChange={(e) => setSettings({ ...settings, adminSecret: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            placeholder="הזן סיסמה"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">מספר ניסיונות חיבור מחדש</label>
          <input
            type="number"
            value={settings.reconnectAttempts}
            onChange={(e) => setSettings({ ...settings, reconnectAttempts: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded"
            min="1"
            max="10"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">מרווח זמן בין ניסיונות חיבור (מילישניות)</label>
          <input
            type="number"
            value={settings.reconnectInterval}
            onChange={(e) => setSettings({ ...settings, reconnectInterval: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded"
            min="1000"
            step="1000"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">מרווח זמן בין פינגים (מילישניות)</label>
          <input
            type="number"
            value={settings.pingInterval}
            onChange={(e) => setSettings({ ...settings, pingInterval: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded"
            min="5000"
            step="1000"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          שמור הגדרות
        </button>
      </form>
    </div>
  )
} 