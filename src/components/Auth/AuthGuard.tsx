'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, UserRole } from '@/lib/services/auth.service'
import ClientOnly from '@/components/ClientOnly'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

const AuthGuardComponent = ({ children, allowedRoles }: AuthGuardProps) => {
  const router = useRouter()
  const { user, loading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/')
      }
    }
  }, [user, loading, allowedRoles, router])

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

const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען...</p>
        </div>
      </div>
    }>
      <AuthGuardComponent allowedRoles={allowedRoles}>
        {children}
      </AuthGuardComponent>
    </ClientOnly>
  )
}

export default AuthGuard 