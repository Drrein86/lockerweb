'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/services/auth.service'
import { useToastStore } from '@/lib/services/toast.service'
import ClientOnly from '@/components/ClientOnly'

const DevLoginPage = () => {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { addToast } = useToastStore()

  const loginAs = (role: 'admin' | 'courier' | 'customer') => {
    const mockUsers = {
      admin: {
        id: 'dev-admin-1',
        name: 'מנהל פיתוח',
        email: 'admin@dev.com',
        role: 'admin' as const
      },
      courier: {
        id: 'dev-courier-1',
        name: 'שליח פיתוח',
        email: 'courier@dev.com',
        role: 'courier' as const
      },
      customer: {
        id: 'dev-customer-1',
        name: 'לקוח פיתוח',
        email: 'customer@dev.com',
        role: 'customer' as const
      }
    }

    const user = mockUsers[role]
    setUser(user)
    addToast('success', `התחברת כ${user.name}`)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔧 כניסת מפתח</h1>
          <p className="text-white/70">בחר תפקיד לכניסה מהירה</p>
          <div className="mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm inline-block">
            ⚠️ למפתחים בלבד
          </div>
        </div>

        <div className="glass-card space-y-4">
          <button
            onClick={() => loginAs('admin')}
            className="w-full p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-white transition-colors"
          >
            <div className="text-left">
              <h3 className="font-bold text-lg">👑 מנהל מערכת</h3>
              <p className="text-white/70 text-sm">גישה מלאה לכל הפונקציות</p>
            </div>
          </button>

          <button
            onClick={() => loginAs('courier')}
            className="w-full p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors"
          >
            <div className="text-left">
              <h3 className="font-bold text-lg">🚚 שליח</h3>
              <p className="text-white/70 text-sm">ניהול משלוחים והכנסה ללוקרים</p>
            </div>
          </button>

          <button
            onClick={() => loginAs('customer')}
            className="w-full p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-white transition-colors"
          >
            <div className="text-left">
              <h3 className="font-bold text-lg">📦 לקוח</h3>
              <p className="text-white/70 text-sm">מעקב אחר חבילות ופתיחת לוקרים</p>
            </div>
          </button>

          <div className="pt-4 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              הכניסה הזו מיועדת לפיתוח בלבד ולא תעבוד בסביבת ייצור
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען...</p>
        </div>
      </div>
    }>
      <DevLoginPage />
    </ClientOnly>
  )
} 