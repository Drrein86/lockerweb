'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

const packageSizes = [
  {
    id: 'small',
    name: 'קטן',
    area: 150,
    description: 'מתאים לחבילות קטנות',
    examples: 'תכשיטים, טלפונים, מסמכים',
    dimensions: '10×15×10 ס"מ',
    icon: '📱'
  },
  {
    id: 'medium', 
    name: 'בינוני',
    area: 600,
    description: 'מתאים לחבילות בינוניות',
    examples: 'ספרים, בגדים, מוצרי קוסמטיקה',
    dimensions: '20×30×10 ס"מ',
    icon: '📚'
  },
  {
    id: 'large',
    name: 'גדול',
    area: 1575,
    description: 'מתאים לחבילות גדולות',
    examples: 'נעליים, מוצרי אלקטרוניקה, מתנות',
    dimensions: '35×45×10 ס"מ',
    icon: '👟'
  },
  {
    id: 'xlarge',
    name: 'רחב',
    area: 2400,
    description: 'מתאים לחבילות רחבות',
    examples: 'בגדים גדולים, מוצרים רחבים, חבילות מרובות',
    dimensions: '40×60×10 ס"מ',
    icon: '📦'
  }
]

export default function SizeSelectionPage() {
  const router = useRouter()

  const handleSizeSelect = (sizeId: string) => {
    router.push(`/courier/lockers-by-size?size=${sizeId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">בחירת גודל חבילה</h1>
            <p className="text-gray-300">בחר את הגודל המתאים לחבילה שלך</p>
          </div>

          {/* Size Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {packageSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => handleSizeSelect(size.id)}
                className="glass-card bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/30 hover:from-blue-500/20 hover:to-purple-500/20 hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105 p-6 text-right"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="text-4xl">{size.icon}</div>
                    <div className="text-right">
                      <h3 className="text-2xl font-bold text-white">{size.name}</h3>
                      <p className="text-blue-300 font-medium">{size.area} ס"מ רבוע</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <p className="text-gray-300 font-medium">{size.description}</p>
                    <p className="text-sm text-gray-400">מידות: {size.dimensions}</p>
                  </div>

                  {/* Examples */}
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-white">דוגמאות:</span> {size.examples}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="font-medium text-blue-300">בחר גודל זה</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Info Box */}
          <div className="glass-card-sm mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold text-white mb-2">טיפים לבחירת גודל:</h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• בחר גודל שמעט גדול יותר מהחבילה שלך</li>
                  <li>• קח בחשבון את הצורה והעובי של החבילה</li>
                  <li>• במקרה של ספק, עדיף לבחור גודל גדול יותר</li>
                  <li>• אם החבילה שלך לא מתאימה, תוכל לחזור ולבחור גודל אחר</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link 
              href="/courier/select-cell"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>חזרה לבחירת תא</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 