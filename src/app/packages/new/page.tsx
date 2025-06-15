'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePackageStore } from '@/lib/services/package.service'
import { useToastStore } from '@/lib/services/toast.service'
import { BackIcon } from '@/components/Icons'
import AuthGuard from '@/components/Auth/AuthGuard'

const NewPackagePage = () => {
  const router = useRouter()
  const { createPackage } = usePackageStore()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientId: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createPackage(formData)
      addToast('success', 'החבילה נוצרה בהצלחה')
      router.push('/packages')
    } catch (error) {
      addToast('error', 'שגיאה ביצירת החבילה')
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-3xl font-bold text-white">חבילה חדשה</h1>
            <p className="text-white/70 mt-1">יצירת חבילה חדשה במערכת</p>
          </div>
        </div>

        {/* טופס */}
        <form onSubmit={handleSubmit} className="glass-card">
          <div className="space-y-6">
            <div>
              <label htmlFor="recipientId" className="block text-sm font-medium text-white mb-2">
                מזהה נמען
              </label>
              <input
                type="text"
                id="recipientId"
                value={formData.recipientId}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientId: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                placeholder="הכנס את מזהה המשתמש של הנמען"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                תיאור החבילה
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                placeholder="תאר את תוכן החבילה"
                rows={4}
                required
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'יוצר חבילה...' : 'צור חבילה'}
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

export default function ProtectedNewPackagePage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <NewPackagePage />
    </AuthGuard>
  )
} 