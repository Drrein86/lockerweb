'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalLockers: number
  totalCells: number
  occupiedCells: number
  totalPackages: number
  waitingPackages: number
  collectedPackages: number
  connectedLockers: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('שגיאה בטעינת נתונים:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתוני המערכת...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/" className="text-purple-600 hover:text-purple-800 mb-4 inline-block">
            ← חזרה לעמוד הראשי
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ⚙️ ממשק ניהול
          </h1>
          <p className="text-gray-600">
            ניהול מערכת הלוקרים החכמים
          </p>
        </div>

        {/* סטטיסטיקות ראשיות */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">לוקרים פעילים</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalLockers}</p>
                </div>
                <div className="text-4xl">🏢</div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">
                  {stats.connectedLockers} מחוברים
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">תאים כולל</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalCells}</p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-orange-600">
                  {stats.occupiedCells} תפוסים
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">חבילות ממתינות</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.waitingPackages}</p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  מתוך {stats.totalPackages} כולל
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">חבילות נאספו</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.collectedPackages}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">
                  {stats.totalPackages > 0 ? Math.round((stats.collectedPackages / stats.totalPackages) * 100) : 0}% שיעור איסוף
                </span>
              </div>
            </div>
          </div>
        )}

        {/* תפריט ניהול */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/lockers" className="group">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">ניהול לוקרים</h3>
                <p className="text-gray-600">צפייה ועריכת לוקרים ותאים</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/packages" className="group">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">ניהול חבילות</h3>
                <p className="text-gray-600">מעקב ועדכון סטטוס חבילות</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/reports" className="group">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">דוחות</h3>
                <p className="text-gray-600">סטטיסטיקות ודוחות מפורטים</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/websocket" className="group">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">חיבורי WebSocket</h3>
                <p className="text-gray-600">ניהול חיבורים ופתיחה ידנית</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/settings" className="group">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-4">⚙️</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">הגדרות</h3>
                <p className="text-gray-600">הגדרות מערכת ותצורה</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/logs" className="group">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">לוגים</h3>
                <p className="text-gray-600">צפייה בפעילות המערכת</p>
              </div>
            </div>
          </Link>
        </div>

        {/* פעולות מהירות */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🚀 פעולות מהירות</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary text-center py-3">
              🔄 רענון נתונים
            </button>
            <button className="btn-secondary text-center py-3">
              📧 שליחת התראות
            </button>
            <button className="btn-secondary text-center py-3">
              🧹 ניקוי חבילות ישנות
            </button>
          </div>
        </div>

        {/* גרף תפוסה */}
        {stats && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📈 תפוסת תאים</h3>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">תפוסה</span>
                <span className="text-sm font-semibold">
                  {stats.totalCells > 0 ? Math.round((stats.occupiedCells / stats.totalCells) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalCells > 0 ? (stats.occupiedCells / stats.totalCells) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>{stats.totalCells} תאים</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 