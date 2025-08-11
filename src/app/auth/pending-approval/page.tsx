'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'

export default function PendingApproval() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Pending Icon */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-yellow-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ממתין לאישור
            </h2>
            <p className="text-gray-600">
              החשבון שלך נוצר בהצלחה וממתין לאישור המנהל
            </p>
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <strong>תפקיד:</strong> {user.role === 'MANAGEMENT' ? 'ניהול' :
                                          user.role === 'COURIER' ? 'שליח' :
                                          user.role === 'BUSINESS' ? 'עסק' :
                                          user.role === 'CUSTOMER_SERVICE' ? 'שירות לקוחות' :
                                          user.role}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>סטטוס:</strong> ממתין לאישור מנהל המערכת
                </p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">מה קורה עכשיו?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• המנהל יקבל הודעה על רישום חדש</li>
              <li>• לאחר בדיקת הפרטים תקבל אישור</li>
              <li>• תוכל להתחבר ולהשתמש במערכת</li>
              <li>• המנהל יגדיר לך הרשאות מותאמות</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              רענן סטטוס
            </button>
            
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              התנתק
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 mb-2">
              זמן המתנה ארוך? פנה למנהל המערכת
            </p>
            <p className="text-xs text-gray-400">
              elior2280@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
