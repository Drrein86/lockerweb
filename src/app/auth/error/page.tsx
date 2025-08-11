'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'שגיאה בתצורת השרת. אנא פנה למנהל המערכת.'
      case 'AccessDenied':
        return 'הגישה נדחתה. ייתכן שחשבונך לא אושר עדיין.'
      case 'Verification':
        return 'שגיאה באימות. אנא נסה שוב.'
      default:
        return 'שגיאה לא צפויה. אנא נסה שוב מאוחר יותר.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              שגיאה בהתחברות
            </h2>
          </div>

          {/* Error Message */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">
              {getErrorMessage(error)}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              נסה שוב
            </Link>
            
            <Link
              href="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              חזור לדף הבית
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              בעיה בהתחברות? פנה למנהל המערכת
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
