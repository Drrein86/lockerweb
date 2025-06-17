'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Report {
  id: string
  type: 'delivery' | 'pickup' | 'error'
  timestamp: string
  lockerId: string
  cellId: string
  status: string
  details: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    // כאן יתווסף בהמשך קוד לטעינת דוחות מהשרת
    setLoading(false)
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">דוחות מערכת</h1>
        <Link 
          href="/admin/lockers"
          className="flex items-center px-4 py-2 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
        >
          חזרה ללוקרים
        </Link>
      </div>

      <div className="mb-6">
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="all">כל הדוחות</option>
          <option value="delivery">משלוחים</option>
          <option value="pickup">איסופים</option>
          <option value="error">שגיאות</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center">טוען...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-6 gap-4 p-4 font-bold text-gray-700 border-b">
            <div>סוג</div>
            <div>תאריך</div>
            <div>לוקר</div>
            <div>תא</div>
            <div>סטטוס</div>
            <div>פרטים</div>
          </div>
          {reports.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              לא נמצאו דוחות
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="grid grid-cols-6 gap-4 p-4 border-b hover:bg-gray-50">
                <div>{report.type}</div>
                <div>{new Date(report.timestamp).toLocaleString('he-IL')}</div>
                <div>{report.lockerId}</div>
                <div>{report.cellId}</div>
                <div>{report.status}</div>
                <div>{report.details}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
} 