'use client'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען חבילות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* כותרת */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
            ← חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">ניהול חבילות</h1>
          <p className="text-gray-600 mt-2">
            ניהול וצפייה בכל החבילות במערכת
          </p>
        </div>

        {/* סינון */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">סינון חבילות</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              כל החבילות ({packages.length})
            </button>
            <button
              onClick={() => setFilter('waiting')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'waiting' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ממתינות ({packages.filter(p => p.status === 'WAITING').length})
            </button>
            <button
              onClick={() => setFilter('collected')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'collected' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              נאספו ({packages.filter(p => p.status === 'COLLECTED').length})
            </button>
          </div>
        </div>

        {/* רשימת חבילות */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    קוד מעקב
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    שם לקוח
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    גודל
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מיקום
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תאריך
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pkg.trackingCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pkg.userName}</div>
                        <div className="text-sm text-gray-500">{pkg.userEmail}</div>
                        <div className="text-sm text-gray-500">{pkg.userPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getSizeInHebrew(pkg.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.locker.location} - תא {pkg.cell.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pkg.status === 'WAITING' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getStatusInHebrew(pkg.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pkg.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {pkg.status === 'WAITING' && (
                        <button
                          onClick={() => updatePackageStatus(pkg.id, 'COLLECTED')}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          סמן כנאסף
                        </button>
                      )}
                      {pkg.status === 'COLLECTED' && (
                        <button
                          onClick={() => updatePackageStatus(pkg.id, 'WAITING')}
                          className="text-orange-600 hover:text-orange-900"
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
              <p className="text-gray-500">אין חבילות להצגה</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 