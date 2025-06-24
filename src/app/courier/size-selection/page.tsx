'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PackageSize = 'קטן' | 'בינוני' | 'גדול' | 'רחב';

export default function SizeSelectionPage() {
  const [selectedSize, setSelectedSize] = useState<PackageSize | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const packageSizes = [
    {
      size: 'קטן' as PackageSize,
      icon: '📱',
      description: 'עד 15x10x5 ס"מ',
      area: '150 ס״מ²',
      color: 'from-green-400 to-green-500',
      examples: 'טלפון, ארנק, מפתחות'
    },
    {
      size: 'בינוני' as PackageSize,
      icon: '📦',
      description: 'עד 30x20x15 ס"מ',
      area: '600 ס״מ²',
      color: 'from-blue-400 to-blue-500',
      examples: 'ספר, נעליים, בגדים קטנים'
    },
    {
      size: 'גדול' as PackageSize,
      icon: '📦',
      description: 'עד 45x35x25 ס"מ',
      area: '1575 ס״מ²',
      color: 'from-orange-400 to-orange-500',
      examples: 'מחשב נייד, בגדים, מוצרי אלקטרוניקה'
    },
    {
      size: 'רחב' as PackageSize,
      icon: '📦',
      description: 'עד 60x40x10 ס"מ',
      area: '2400 ס״מ²',
      color: 'from-purple-400 to-purple-500',
      examples: 'מסמכים גדולים, תמונות, פיצה'
    }
  ]

  const handleSizeSelection = async (size: PackageSize) => {
    setSelectedSize(size)
    setLoading(true)
    
    try {
      // מעבר לדף הצגת לוקרים/תאים לפי גודל
      router.push(`/courier/lockers-by-size?size=${size}`)
    } catch (error) {
      console.error('שגיאה במעבר לדף לוקרים:', error)
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
          <Link href="/courier/select-cell" className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            חזרה לבחירת תא
          </Link>
        </div>

        {/* תוכן מרכזי */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl w-full space-y-8">
            {/* כותרת */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4M4 16v4a1 1 0 001 1h4m8-16h4a1 1 0 011 1v4m-4 12h4a1 1 0 001-1v-4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">בחירת גודל מוצר</h1>
              <p className="text-gray-300">בחר את גודל החבילה למציאת תא מתאים</p>
            </div>

            {/* בחירת גודל */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packageSizes.map((pkg) => (
                <button
                  key={pkg.size}
                  onClick={() => handleSizeSelection(pkg.size)}
                  disabled={loading}
                  className={`
                    relative glass-card text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105
                    ${selectedSize === pkg.size ? 'ring-2 ring-white/50 bg-white/20' : ''}
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    p-6
                  `}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${pkg.color} rounded-2xl flex items-center justify-center`}>
                        <span className="text-2xl">{pkg.icon}</span>
                      </div>
                      <div className="text-right flex-1">
                        <h3 className="text-xl font-bold mb-1">{pkg.size}</h3>
                        <p className="text-gray-300 text-sm">{pkg.description}</p>
                        <p className="text-gray-400 text-xs">{pkg.area}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-gray-300 text-sm">
                        <span className="font-medium">דוגמאות:</span> {pkg.examples}
                      </p>
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
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                טיפים לבחירת גודל
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>בחר גודל שמתאים לחבילה שלך או גדול יותר</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>המערכת תציג רק תאים זמינים בגודל שנבחר</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>אם אין תאים זמינים, נסה גודל גדול יותר</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>גודל "רחב" מתאים לחבילות שטוחות</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 