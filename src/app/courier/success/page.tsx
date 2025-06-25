'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import SuccessContent from './SuccessContent'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">טוען...</p>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  )
}

// מעבר אוטומטי הוסר - המשתמש יחליט מתי לעבור