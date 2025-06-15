'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePackageStore } from '@/lib/services/package.service'
import { useToastStore } from '@/lib/services/toast.service'
import { BackIcon } from '@/components/Icons'
import AuthGuard from '@/components/Auth/AuthGuard'

interface Courier {
  id: string
  name: string
  email: string
}

const AssignCourierPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter()
  const { getPackageById, assignToCourier } = usePackageStore()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(true)
  const [package_, setPackage] = useState<any>(null)
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [selectedCourierId, setSelectedCourierId] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // טעינת פרטי החבילה
        const packageData = await getPackageById(params.id)
        setPackage(packageData)

        // טעינת רשימת השליחים
        const response = await fetch('/api/users/couriers')
        const data = await response.json()
        setCouriers(data)
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
      await assignToCourier(params.id, selectedCourierId)
      addToast('success', 'השליח הוקצה בהצלחה')
      router.push('/packages')
    } catch (error) {
      addToast('error', 'שגיאה בהקצאת השליח')
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
            <h1 className="text-3xl font-bold text-white">הקצאת שליח</h1>
            <p className="text-white/70 mt-1">
              הקצאת שליח לחבילה #{package_.id.slice(-6)}
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

        {/* טופס בחירת שליח */}
        <form onSubmit={handleSubmit} className="glass-card">
          <h2 className="text-lg font-semibold text-white mb-4">בחירת שליח</h2>
          
          {couriers.length > 0 ? (
            <div className="space-y-6">
              {couriers.map((courier) => (
                <label
                  key={courier.id}
                  className={`block p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedCourierId === courier.id
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="courier"
                    value={courier.id}
                    checked={selectedCourierId === courier.id}
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                    className="hidden"
                  />
                  <div>
                    <p className="font-medium text-white">{courier.name}</p>
                    <p className="text-white/70 text-sm">{courier.email}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-white/70 text-center py-4">
              אין שליחים זמינים כרגע
            </p>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              disabled={loading || !selectedCourierId}
              className="btn-primary flex-1"
            >
              {loading ? 'מקצה שליח...' : 'הקצה שליח'}
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

export default function ProtectedAssignCourierPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AssignCourierPage params={params} />
    </AuthGuard>
  )
} 