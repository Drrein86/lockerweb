'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PackageSize = 'קטן' | 'בינוני' | 'גדול' | 'רחב';

export default function CourierPage() {
  console.log('🚚 נטען דף שליח (COURIER)')
  const [selectedSize, setSelectedSize] = useState<PackageSize | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const packageSizes = [
    {
      size: 'קטן' as PackageSize,
      icon: '📱',
      description: 'עד 15x10x5 ס"מ',
      color: 'from-green-400 to-green-500'
    },
    {
      size: 'בינוני' as PackageSize,
      icon: '📦',
      description: 'עד 30x20x15 ס"מ',
      color: 'from-blue-400 to-blue-500'
    },
    {
      size: 'גדול' as PackageSize,
      icon: '📦',
      description: 'עד 45x35x25 ס"מ',
      color: 'from-orange-400 to-orange-500'
    },
    {
      size: 'רחב' as PackageSize,
      icon: '📦',
      description: 'עד 60x40x10 ס"מ',
      color: 'from-purple-400 to-purple-500'
    }
  ]

  const handleSizeSelection = async (size: PackageSize) => {
    setSelectedSize(size)
    setLoading(true)
    
    try {
      // בדיקת זמינות לוקרים
      const response = await fetch(`/api/lockers/available?size=${size}`)
      const data = await response.json()
      
      if (data.available) {
        // מעבר לדף הבא עם הגודל שנבחר
        router.push(`/courier/select-locker?size=${size}`)
      } else {
        alert('אין תאים זמינים בגודל זה כרגע')
      }
    } catch (error) {
      console.error('שגיאה בבדיקת זמינות:', error)
      alert('שגיאה בבדיקת זמינות התאים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 className="heading-primary">ממשק שליח</h1>
              <p className="text-gray-300">בחר את גודל החבילה למציאת תא מתאים</p>
            </div>

            {/* בחירת גודל */}
            <div className="space-y-4">
              {packageSizes.map((pkg) => (
                <button
                  key={pkg.size}
                  onClick={() => handleSizeSelection(pkg.size)}
                  disabled={loading}
                  className={`
                    relative w-full glass-card text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105
                    ${selectedSize === pkg.size ? 'ring-2 ring-white/50 bg-white/20' : ''}
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="text-xl font-bold mb-1">{pkg.size}</h3>
                      <p className="text-gray-300 text-sm">{pkg.description}</p>
                    </div>
                  </div>
                  
                  {loading && selectedSize === pkg.size && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <div className="loading-spinner"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* מידע נוסף */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                הוראות לשליח
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-white">•</span>
                  בחר את גודל החבילה המתאים
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white">•</span>
                  המערכת תמצא תא זמין באופן אוטומטי
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white">•</span>
                  לאחר הבחירה, תוכל לסרוק את פרטי הלקוח
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white">•</span>
                  התא ייפתח אוטומטית לאחר השלמת התהליך
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 