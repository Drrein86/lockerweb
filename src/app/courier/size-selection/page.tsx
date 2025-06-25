'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PackageSize = 'קטן' | 'בינוני' | 'גדול' | 'רחב'

export default function SizeSelectionPage() {
  const [selectedSize, setSelectedSize] = useState<PackageSize | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const packageSizes = [
    {
      size: 'קטן' as PackageSize,
      icon: '📱',
      description: 'עד 15x10x5 ס"מ',
      area: '150 ס"מ רבועים',
      color: 'from-green-400 to-green-500',
      examples: ['טלפון נייד', 'ארנק', 'מפתחות']
    },
    {
      size: 'בינוני' as PackageSize,
      icon: '📦',
      description: 'עד 30x20x15 ס"מ',
      area: '600 ס"מ רבועים',
      color: 'from-blue-400 to-blue-500',
      examples: ['ספר', 'קופסת נעליים קטנה', 'מוצרי קוסמטיקה']
    },
    {
      size: 'גדול' as PackageSize,
      icon: '📦',
      description: 'עד 45x35x25 ס"מ',
      area: '1,575 ס"מ רבועים',
      color: 'from-orange-400 to-orange-500',
      examples: ['קופסת נעליים', 'מוצרי אלקטרוניקה', 'בגדים']
    },
    {
      size: 'רחב' as PackageSize,
      icon: '📦',
      description: 'עד 60x40x10 ס"מ',
      area: '2,400 ס"מ רבועים',
      color: 'from-purple-400 to-purple-500',
      examples: ['מסמכים גדולים', 'תמונות', 'חבילות שטוחות']
    }
  ]

  const handleSizeSelection = async (size: PackageSize) => {
    setSelectedSize(size)
    setLoading(true)
    
    try {
      // בדיקת זמינות לוקרים/תאים לפי הגודל שנבחר
      const response = await fetch(`/api/lockers/available?size=${size}`)
      const data = await response.json()
      
      if (data.available) {
        // מעבר לדף הצגת לוקרים/תאים זמינים לפי גודל
        router.push(`/courier/lockers-by-size?size=${size}`)
      } else {
        alert(`אין תאים זמינים בגודל ${size} כרגע`)
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
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m5 0h4a1 1 0 011 1v4m0 5v4a1 1 0 01-1 1h-4m-5 0H5a1 1 0 01-1-1v-4m1-5a2 2 0 100-4 2 2 0 000 4zm0 0c1 0 2 1 2 2v1H4v-1a2 2 0 012-2zM20 15a2 2 0 10-4 0 2 2 0 004 0zm-4 0c0-1-1-2-2-2v-1h4v1c-1 0-2 1-2 2z" />
                </svg>
              </div>
              <h1 className="heading-primary">בחירת גודל מוצר</h1>
              <p className="text-gray-300 text-lg">בחר את הגודל המתאים למוצר שלך</p>
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
                  `}
                >
                  <div className="p-6">
                    {/* אייקון וכותרת */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${pkg.color} rounded-2xl flex items-center justify-center text-2xl`}>
                        {pkg.icon}
                      </div>
                      <div className="text-right flex-1">
                        <h3 className="text-2xl font-bold mb-1">{pkg.size}</h3>
                        <p className="text-gray-300 text-sm">{pkg.description}</p>
                        <p className="text-gray-400 text-xs">{pkg.area}</p>
                      </div>
                    </div>
                    
                    {/* דוגמאות */}
                    <div className="border-t border-white/20 pt-4">
                      <h4 className="text-sm font-semibold text-white/80 mb-2">דוגמאות:</h4>
                      <div className="flex flex-wrap gap-2">
                        {pkg.examples.map((example, index) => (
                          <span
                            key={index}
                            className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {loading && selectedSize === pkg.size && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <div className="flex items-center gap-2 text-white">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>בודק זמינות...</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* מידע נוסף */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                טיפים לבחירת גודל
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>בחר גודל שמתאים למוצר שלך - עדיף מעט יותר גדול מאשר קטן מדי</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>המערכת תציג רק תאים זמינים בגודל שבחרת</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>אם אין תאים זמינים, תוכל לחזור ולבחור גודל אחר</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>הגדלים מוצגים לפי שטח התא בסנטימטרים רבועים</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 