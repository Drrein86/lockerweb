import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔐 מערכת לוקרים חכמים
          </h1>
          <p className="text-xl text-gray-600">
            פתרון מתקדם לניהול לוקרים ושליחת חבילות
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* שליח */}
          <Link href="/courier" className="group">
            <div className="card hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="text-center">
                <div className="text-6xl mb-4">🚚</div>
                <h2 className="text-2xl font-bold mb-2">שליח</h2>
                <p className="text-blue-100">
                  הזנת חבילות ובחירת תאים
                </p>
              </div>
            </div>
          </Link>

          {/* משתמש סופי */}
          <Link href="/customer" className="group">
            <div className="card hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="text-center">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-bold mb-2">לקוח</h2>
                <p className="text-green-100">
                  איסוף חבילות מהלוקר
                </p>
              </div>
            </div>
          </Link>

          {/* מנהל */}
          <Link href="/admin" className="group">
            <div className="card hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="text-center">
                <div className="text-6xl mb-4">⚙️</div>
                <h2 className="text-2xl font-bold mb-2">מנהל</h2>
                <p className="text-purple-100">
                  ניהול המערכת והלוקרים
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📊 סטטיסטיקות המערכת
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">15</div>
                <div className="text-sm text-gray-600">לוקרים פעילים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">225</div>
                <div className="text-sm text-gray-600">תאים זמינים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">89%</div>
                <div className="text-sm text-gray-600">שיעור תפוסה</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 