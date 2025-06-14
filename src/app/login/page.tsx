'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/services/auth.service'
import { useToastStore } from '@/lib/services/toast.service'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      addToast('success', 'התחברת בהצלחה!')
      router.push('/')
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'שגיאה בהתחברות')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">התחברות</h1>
          <p className="text-white/70">התחבר למערכת הלוקרים</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              כתובת אימייל
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="הכנס את כתובת האימייל שלך"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              סיסמה
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="הכנס את הסיסמה שלך"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'מתחבר...' : 'התחברות'}
            </button>
          </div>

          <div className="text-center text-white/70">
            <p>
              אין לך חשבון?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300">
                הירשם עכשיו
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
} 