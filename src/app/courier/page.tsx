'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CourierPage() {
  console.log('🚚 נטען דף שליח (COURIER)')
  console.log('🌐 URL נוכחי בדף שליח:', typeof window !== 'undefined' ? window.location.href : 'SSR')
  const router = useRouter()

  const handleStartDelivery = () => {
    router.push('/courier/location-search')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* רקע מיוחד */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col p-4">
        {/* כותרת עליונה */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            חזרה
          </Link>
        </div>

        {/* תוכן מרכזי */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-lg w-full space-y-8">
            {/* כותרת */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 className="heading-primary">🚚 ממשק שליח</h1>
              <p className="text-blue-200 text-lg">ברוכים הבאים למערכת הכנסת מוצרים ללוקר</p>
            </div>

            {/* כפתור התחלת משלוח */}
            <div className="text-center">
                <button
                onClick={handleStartDelivery}
                className="btn-primary text-xl px-12 py-4 transform hover:scale-105 transition-all duration-300 shadow-2xl"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  התחל משלוח חדש
                    </div>
                </button>
            </div>

            {/* מידע נוסף */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                איך זה עובד?
              </h3>
              <ul className="space-y-3 text-blue-200">
                <li className="flex items-start gap-3">
                  <span className="text-blue-300 font-bold">1.</span>
                  <span>לחץ על "התחל משלוח חדש" כדי להתחיל</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-300 font-bold">2.</span>
                  <span>הזן כתובת למשלוח כדי למצוא לוקרים באזור</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-300 font-bold">3.</span>
                  <span>בחר לוקר מתאים וגודל תא לחבילה</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-300 font-bold">4.</span>
                  <span>התא ייפתח אוטומטית להכנסת החבילה</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 