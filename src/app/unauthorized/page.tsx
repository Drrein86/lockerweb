'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'

export default function Unauthorized() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              אין הרשאה
            </h2>
            <p className="text-gray-600">
              אין לך הרשאה לגשת לדף זה
            </p>
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>משתמש:</strong> {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>תפקיד:</strong> {user.role === 'ADMIN' ? 'אדמין' : 
                                        user.role === 'MANAGEMENT' ? 'ניהול' :
                                        user.role === 'COURIER' ? 'שליח' :
                                        user.role === 'BUSINESS' ? 'עסק' :
                                        user.role === 'CUSTOMER_SERVICE' ? 'שירות לקוחות' :
                                        user.role}
              </p>
              <p className="text-sm text-gray-600">
                <strong>סטטוס:</strong> {user.status === 'ACTIVE' as any ? 'מאושר' : 'ממתין לאישור'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              חזור לדף הבית
            </Link>
            
            {user?.role === 'COURIER' && (
              <Link
                href="/courier"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                לדף השליח
              </Link>
            )}
            
            {user?.role === 'BUSINESS' && (
              <Link
                href="/business"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                לדף העסק
              </Link>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              צריך הרשאה נוספת? פנה למנהל המערכת
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
