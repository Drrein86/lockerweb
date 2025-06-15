'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePackageStore } from '@/lib/services/package.service'
import { useLockerStore } from '@/lib/services/locker.service'
import { useToastStore } from '@/lib/services/toast.service'
import { BackIcon } from '@/components/Icons'
import AuthGuard from '@/components/Auth/AuthGuard'
import ClientOnly from '@/components/ClientOnly'

const PlacePackagePage = ({ params }: { params: { id: string } }) => {
  const router = useRouter()
  const { getPackageById, placeInLocker } = usePackageStore()
  const { lockers, getStatus } = useLockerStore()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(true)
  const [package_, setPackage] = useState<any>(null)
  const [selectedLockerId, setSelectedLockerId] = useState('')
  const [selectedCellId, setSelectedCellId] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // טעינת פרטי החבילה
        const packageData = await getPackageById(params.id)
        setPackage(packageData)

        // טעינת מצב הלוקרים
        await getStatus()
      } catch (error) {
        addToast('error', 'שגיאה בטעינת הנתונים')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await placeInLocker(params.id, selectedLockerId, selectedCellId)
      addToast('success', 'החבילה הוכנסה ללוקר בהצלחה')
      router.push('/packages')
    } catch (error) {
      addToast('error', 'שגיאה בהכנסת החבילה ללוקר')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  if (!package_) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto glass-card text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-2">החבילה לא נמצאה</h2>
          <p className="text-white/70 mb-6">לא הצלחנו למצוא את החבילה המבוקשת</p>
          <Link href="/packages" className="btn-primary">
            חזרה לרשימת החבילות
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* כותרת */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/packages" className="text-white/70 hover:text-white transition-colors">
            <BackIcon />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">הכנסה ללוקר</h1>
            <p className="text-white/70 mt-1">
              הכנסת חבילה #{package_.id.slice(-6)} ללוקר
            </p>
          </div>
        </div>

        {/* פרטי החבילה */}
        <div className="glass-card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">פרטי החבילה</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/50 mb-1">נמען</p>
              <p className="text-white">{package_.recipient.name}</p>
              <p className="text-white/70">{package_.recipient.email}</p>
            </div>
            <div>
              <p className="text-white/50 mb-1">תיאור</p>
              <p className="text-white">{package_.description}</p>
            </div>
          </div>
        </div>

        {/* טופס בחירת לוקר ותא */}
        <form onSubmit={handleSubmit} className="glass-card">
          <h2 className="text-lg font-semibold text-white mb-4">בחירת לוקר ותא</h2>
          
          {lockers.length > 0 ? (
            <div className="space-y-6">
              {/* בחירת לוקר */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  בחר לוקר
                </label>
                <div className="space-y-3">
                  {lockers.map((locker) => (
                    <label
                      key={locker.lockerId}
                      className={`block p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                        selectedLockerId === locker.lockerId
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-white/5 border-transparent hover:bg-white/10'
                      } ${!locker.isOnline && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <input
                        type="radio"
                        name="locker"
                        value={locker.lockerId}
                        checked={selectedLockerId === locker.lockerId}
                        onChange={(e) => {
                          setSelectedLockerId(e.target.value)
                          setSelectedCellId('') // איפוס בחירת התא
                        }}
                        disabled={!locker.isOnline}
                        className="hidden"
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">לוקר {locker.lockerId}</p>
                          <p className="text-white/70 text-sm">{locker.ip}:{locker.port}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          locker.isOnline
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {locker.isOnline ? 'מחובר' : 'מנותק'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* בחירת תא */}
              {selectedLockerId && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    בחר תא
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(
                      lockers.find(l => l.lockerId === selectedLockerId)?.cells || {}
                    ).map(([cellId, cell]) => (
                      <label
                        key={cellId}
                        className={`block p-4 rounded-lg border-2 transition-colors cursor-pointer text-center ${
                          selectedCellId === cellId
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-white/5 border-transparent hover:bg-white/10'
                        } ${(cell.locked || cell.opened) && 'opacity-50 cursor-not-allowed'}`}
                      >
                        <input
                          type="radio"
                          name="cell"
                          value={cellId}
                          checked={selectedCellId === cellId}
                          onChange={(e) => setSelectedCellId(e.target.value)}
                          disabled={cell.locked || cell.opened}
                          className="hidden"
                        />
                        <p className="font-medium text-white">תא {cellId}</p>
                        <p className="text-white/70 text-sm">
                          {cell.locked ? 'תפוס' : cell.opened ? 'פתוח' : 'פנוי'}
                        </p>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/70 text-center py-4">
              אין לוקרים זמינים כרגע
            </p>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              disabled={loading || !selectedLockerId || !selectedCellId}
              className="btn-primary flex-1"
            >
              {loading ? 'מכניס ללוקר...' : 'הכנס ללוקר'}
            </button>
            
            <Link href="/packages" className="btn-secondary">
              ביטול
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProtectedPlacePackagePage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard allowedRoles={['admin', 'courier']}>
      <ClientOnly fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">טוען...</p>
          </div>
        </div>
      }>
        <PlacePackagePage params={params} />
      </ClientOnly>
    </AuthGuard>
  )
} 