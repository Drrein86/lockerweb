'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PackageSize = 'קטן' | 'בינוני' | 'גדול' | 'רחב';

export default function CourierPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← חזרה לעמוד הראשי
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🚚 ממשק שליח
          </h1>
          <p className="text-gray-600">
            בחר את גודל החבילה למציאת תא מתאים
          </p>
        </div>

        {/* בחירת גודל */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {packageSizes.map((pkg) => (
            <button
              key={pkg.size}
              onClick={() => handleSizeSelection(pkg.size)}
              disabled={loading}
              className={`
                relative overflow-hidden rounded-lg p-6 text-white font-bold text-xl
                transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                bg-gradient-to-br ${pkg.color}
                ${selectedSize === pkg.size ? 'ring-4 ring-white' : ''}
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{pkg.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{pkg.size}</h3>
                <p className="text-sm opacity-90">{pkg.description}</p>
              </div>
              
              {loading && selectedSize === pkg.size && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* מידע נוסף */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 הוראות לשליח
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li>• בחר את גודל החבילה המתאים</li>
            <li>• המערכת תמצא תא זמין באופן אוטומטי</li>
            <li>• לאחר הבחירה, תוכל לסרוק את פרטי הלקוח</li>
            <li>• התא ייפתח אוטומטית לאחר השלמת התהליך</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 