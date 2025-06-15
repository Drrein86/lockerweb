'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  source: string
  details?: any
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    // כאן יתווסף בהמשך קוד לטעינת לוגים מהשרת
    setLoading(false)
  }, [])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-blue-600'
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">לוגים</h1>
        <Link 
          href="/admin/lockers"
          className="flex items-center px-4 py-2 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
        >
          חזרה ללוקרים
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="all">כל הרמות</option>
          <option value="info">מידע</option>
          <option value="warning">אזהרה</option>
          <option value="error">שגיאה</option>
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש בלוגים..."
          className="flex-1 px-4 py-2 border rounded"
        />
      </div>

      {loading ? (
        <div className="text-center">טוען...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-4 gap-4 p-4 font-bold text-gray-700 border-b">
            <div>זמן</div>
            <div>רמה</div>
            <div>מקור</div>
            <div>הודעה</div>
          </div>
          {filteredLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              לא נמצאו לוגים
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="grid grid-cols-4 gap-4 p-4 border-b hover:bg-gray-50">
                <div className="text-sm text-gray-600">
                  {new Date(log.timestamp).toLocaleString('he-IL')}
                </div>
                <div className={getLevelColor(log.level)}>
                  {log.level}
                </div>
                <div>{log.source}</div>
                <div className="break-all">
                  {log.message}
                  {log.details && (
                    <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
} 