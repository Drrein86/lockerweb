'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, UserRole } from '@/lib/services/auth.service'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const router = useRouter()
  const { user, loading, checkAuth } = useAuthStore()

  // מצב פיתוח - דילוג על אימות
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (typeof window !== 'undefined' && !isDevelopment) {
      checkAuth()
    }
  }, [isDevelopment])

  useEffect(() => {
    if (!isDevelopment && !loading) {
      if (!user) {
        router.push('/login')
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/')
      }
    }
  }, [user, loading, allowedRoles, router, isDevelopment])

  // במצב פיתוח - אפשר גישה ישירה
  if (isDevelopment) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען...</p>
        </div>
      </div>
    )
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null
  }

  return <>{children}</>
}

export default AuthGuard 