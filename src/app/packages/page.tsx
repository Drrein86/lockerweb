'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePackageStore } from '@/lib/services/package.service'
import { useAuthStore } from '@/lib/services/auth.service'
import { useToastStore } from '@/lib/services/toast.service'
import { BackIcon, PackageIcon, TruckIcon, LockerIcon, CheckIcon } from '@/components/Icons'
import AuthGuard from '@/components/Auth/AuthGuard'

const PackagesPage = () => {
  const { packages, loading, fetchPackages } = usePackageStore()
  const { user } = useAuthStore()
  const { addToast } = useToastStore()

  useEffect(() => {
    fetchPackages()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-sm">
            ממתין לשליח
          </span>
        )
      case 'IN_TRANSIT':
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-sm">
            בדרך
          </span>
        )
      case 'IN_LOCKER':
        return (
          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-sm">
            בלוקר
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-sm">
            נאסף
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-sm">
            בוטל
          </span>
        )
      default:
        return null
    }
  }

  if (loading && !packages.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען חבילות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* כותרת */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/70 hover:text-white transition-colors">
              <BackIcon />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">ניהול חבילות</h1>
              <p className="text-white/70 mt-1">מעקב אחר חבילות ועדכון סטטוס</p>
            </div>
          </div>
          
          {user?.role === 'ADMIN' && (
            <Link href="/packages/new" className="btn-primary">
              חבילה חדשה
            </Link>
          )}
        </div>

        {/* רשימת חבילות */}
        {packages.length > 0 ? (
          <div className="space-y-4">
            {packages.map((package_) => (
              <div key={package_.id} className="glass-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <PackageIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        חבילה #{package_.id.slice(-6)}
                      </h3>
                      <p className="text-white/70 text-sm">{package_.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(package_.status)}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-white/50 mb-1">נמען</p>
                    <p className="text-white">{package_.recipient.name}</p>
                    <p className="text-white/70">{package_.recipient.email}</p>
                  </div>

                  {package_.courier && (
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-white/50 mb-1">שליח</p>
                      <p className="text-white">{package_.courier.name}</p>
                      <p className="text-white/70">{package_.courier.email}</p>
                    </div>
                  )}

                  {package_.lockerId && (
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-white/50 mb-1">מיקום</p>
                      <p className="text-white">לוקר {package_.lockerId}</p>
                      <p className="text-white/70">תא {package_.cellId}</p>
                    </div>
                  )}
                </div>

                {/* פעולות */}
                <div className="mt-4 flex gap-2">
                  {user?.role === 'ADMIN' && package_.status === 'PENDING' && (
                    <Link
                      href={`/packages/${package_.id}/assign`}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <TruckIcon />
                      הקצה שליח
                    </Link>
                  )}

                  {user?.role === 'COURIER' && package_.status === 'IN_TRANSIT' && (
                    <Link
                      href={`/packages/${package_.id}/place`}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <LockerIcon />
                      הכנס ללוקר
                    </Link>
                  )}

                  {user?.role === 'CUSTOMER' && 
                   package_.status === 'IN_LOCKER' && 
                   package_.recipientId === user.id && (
                    <button
                      onClick={() => {
                        // TODO: הצג את הקוד ללקוח
                        addToast('info', `קוד הפתיחה שלך: ${package_.code}`)
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <CheckIcon />
                      הצג קוד פתיחה
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card text-center py-12">
            <PackageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">אין חבילות</h3>
            <p className="text-white/70">
              {user?.role === 'ADMIN'
                ? 'לחץ על "חבילה חדשה" כדי להתחיל'
                : user?.role === 'COURIER'
                ? 'אין חבילות להעברה כרגע'
                : 'אין לך חבילות פעילות כרגע'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProtectedPackagesPage() {
  return (
    <AuthGuard>
      <PackagesPage />
    </AuthGuard>
  )
} 