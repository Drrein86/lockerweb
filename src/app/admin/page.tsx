'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

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

// SVG Icons
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7V22H9V16H15V22H22V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BuildingIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2H18V22H16V20H8V22H6V2Z" stroke="white" strokeWidth="2"/>
    <path d="M8 6H10V8H8Z" stroke="white" strokeWidth="2"/>
    <path d="M14 6H16V8H14Z" stroke="white" strokeWidth="2"/>
    <path d="M8 10H10V12H8Z" stroke="white" strokeWidth="2"/>
    <path d="M14 10H16V12H14Z" stroke="white" strokeWidth="2"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3H21L19 13H5L3 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3L1 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 13V21H17V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
  </svg>
)

const ReportsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V21H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 12L12 7L16 11L21 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const WebSocketIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13L14 9L10 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
    <path d="M19.4 15A1.65 1.65 0 0 0 21 13.09V10.91A1.65 1.65 0 0 0 19.4 9L18.36 8.5A9 9 0 0 0 16.5 6.36L16 5.32A1.65 1.65 0 0 0 14.09 3H9.91A1.65 1.65 0 0 0 8 5.32L7.5 6.36A9 9 0 0 0 5.36 8.5L4.32 9A1.65 1.65 0 0 0 3 10.91V13.09A1.65 1.65 0 0 0 4.32 15L5.36 15.5A9 9 0 0 0 7.5 17.64L8 18.68A1.65 1.65 0 0 0 9.91 21H14.09A1.65 1.65 0 0 0 16 18.68L16.5 17.64A9 9 0 0 0 18.36 15.5L19.4 15Z" stroke="white" strokeWidth="2"/>
  </svg>
)

const LogsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6A2 2 0 0 0 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען נתוני המערכת...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <HomeIcon />
            <span>חזרה לעמוד הראשי</span>
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            ממשק ניהול
          </h1>
          <p className="text-white/70">
            ניהול מערכת הלוקרים החכמים
          </p>
        </div>

        {/* סטטיסטיקות ראשיות */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">לוקרים פעילים</p>
                  <p className="text-3xl font-bold text-white">{stats.totalLockers}</p>
                </div>
                <BuildingIcon />
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-400">
                  {stats.connectedLockers} מחוברים
                </span>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">תאים כולל</p>
                  <p className="text-3xl font-bold text-white">{stats.totalCells}</p>
                </div>
                <PackageIcon />
              </div>
              <div className="mt-2">
                <span className="text-sm text-orange-400">
                  {stats.occupiedCells} תפוסים
                </span>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">חבילות ממתינות</p>
                  <p className="text-3xl font-bold text-white">{stats.waitingPackages}</p>
                </div>
                <ClockIcon />
              </div>
              <div className="mt-2">
                <span className="text-sm text-white/50">
                  מתוך {stats.totalPackages} כולל
                </span>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">חבילות נאספו</p>
                  <p className="text-3xl font-bold text-white">{stats.collectedPackages}</p>
                </div>
                <CheckIcon />
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-400">
                  {stats.totalPackages > 0 ? Math.round((stats.collectedPackages / stats.totalPackages) * 100) : 0}% שיעור איסוף
                </span>
              </div>
            </div>
          </div>
        )}

        {/* תפריט ניהול */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/lockers" className="group">
            <div className="glass-card hover:bg-white/15 transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <BuildingIcon />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">ניהול לוקרים</h3>
                <p className="text-white/70">צפייה ועריכת לוקרים ותאים</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/packages" className="group">
            <div className="glass-card hover:bg-white/15 transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <PackageIcon />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">ניהול חבילות</h3>
                <p className="text-white/70">מעקב ועדכון סטטוס חבילות</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/reports" className="group">
            <div className="glass-card hover:bg-white/15 transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <ReportsIcon />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">דוחות</h3>
                <p className="text-white/70">סטטיסטיקות ודוחות מפורטים</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/websocket" className="group">
            <div className="glass-card hover:bg-white/15 transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <WebSocketIcon />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">חיבורי WebSocket</h3>
                <p className="text-white/70">ניהול חיבורים ופתיחה ידנית</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/settings" className="group">
            <div className="glass-card hover:bg-white/15 transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <SettingsIcon />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">הגדרות</h3>
                <p className="text-white/70">הגדרות מערכת ותצורה</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/logs" className="group">
            <div className="glass-card hover:bg-white/15 transition-all duration-300 transform group-hover:scale-105">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <LogsIcon />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">לוגים</h3>
                <p className="text-white/70">צפייה בפעילות המערכת</p>
              </div>
            </div>
          </Link>
        </div>

        {/* פעולות מהירות */}
        <div className="glass-card mb-8">
          <h3 className="text-xl font-bold text-white mb-4">פעולות מהירות</h3>
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
          <div className="glass-card">
            <h3 className="text-xl font-bold text-white mb-4">תפוסת תאים</h3>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">תפוסה</span>
                <span className="text-sm font-semibold text-white">
                  {stats.totalCells > 0 ? Math.round((stats.occupiedCells / stats.totalCells) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalCells > 0 ? (stats.occupiedCells / stats.totalCells) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-white/50 mt-1">
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