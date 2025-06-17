'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Package {
  id: number
  trackingCode: string
  userName: string
  userEmail: string
  userPhone: string
  size: string
  status: string
  createdAt: string
  locker: {
    location: string
  }
  cell: {
    code: string
  }
}

// SVG Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages')
      const data = await response.json()
      if (data.success) {
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('שגיאה בטעינת חבילות:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePackageStatus = async (packageId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/packages/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, status: newStatus })
      })
      
      if (response.ok) {
        fetchPackages() // רענון הרשימה
      }
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס:', error)
    }
  }

  const filteredPackages = packages.filter(pkg => {
    if (filter === 'all') return true
    if (filter === 'waiting') return pkg.status === 'WAITING'
    if (filter === 'collected') return pkg.status === 'COLLECTED'
    return true
  })

  const getSizeInHebrew = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      'SMALL': 'קטן',
      'MEDIUM': 'בינוני', 
      'LARGE': 'גדול',
      'WIDE': 'רחב'
    }
    return sizeMap[size] || size
  }

  const getStatusInHebrew = (status: string) => {
    return status === 'WAITING' ? 'ממתין' : 'נאסף'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">טוען חבילות...</p>
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
          <h1 className="text-3xl font-bold text-white">ניהול חבילות</h1>
          <p className="text-white/70 mt-2">
            ניהול וצפייה בכל החבילות במערכת
          </p>
        </div>

        {/* סינון */}
        <div className="glass-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FilterIcon />
            <h2 className="text-lg font-semibold">סינון חבילות</h2>
          </div>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                filter === 'all' 
                  ? 'bg-white/20 text-white border border-white/30' 
                  : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/20'
              }`}
            >
              כל החבילות ({packages.length})
            </button>
            <button
              onClick={() => setFilter('waiting')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                filter === 'waiting' 
                  ? 'bg-orange-500/30 text-orange-300 border border-orange-400/50' 
                  : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/20'
              }`}
            >
              ממתינות ({packages.filter(p => p.status === 'WAITING').length})
            </button>
            <button
              onClick={() => setFilter('collected')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                filter === 'collected' 
                  ? 'bg-green-500/30 text-green-300 border border-green-400/50' 
                  : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/20'
              }`}
            >
              נאספו ({packages.filter(p => p.status === 'COLLECTED').length})
            </button>
          </div>
        </div>

        {/* רשימת חבילות */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-white/20">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    קוד מעקב
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    שם לקוח
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    גודל
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    מיקום
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    תאריך
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {pkg.trackingCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{pkg.userName}</div>
                        <div className="text-sm text-white/60">{pkg.userEmail}</div>
                        <div className="text-sm text-white/60">{pkg.userPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {getSizeInHebrew(pkg.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {pkg.locker.location} - תא {pkg.cell.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pkg.status === 'WAITING' 
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' 
                          : 'bg-green-500/20 text-green-300 border border-green-400/30'
                      }`}>
                        {getStatusInHebrew(pkg.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {new Date(pkg.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {pkg.status === 'WAITING' && (
                        <button
                          onClick={() => updatePackageStatus(pkg.id, 'COLLECTED')}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10 px-3 py-1 rounded-lg transition-all duration-200 mr-3"
                        >
                          סמן כנאסף
                        </button>
                      )}
                      {pkg.status === 'COLLECTED' && (
                        <button
                          onClick={() => updatePackageStatus(pkg.id, 'WAITING')}
                          className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 px-3 py-1 rounded-lg transition-all duration-200"
                        >
                          החזר למתין
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPackages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/50">אין חבילות להצגה</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 