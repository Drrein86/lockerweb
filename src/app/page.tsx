import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* רקע מיוחד עם אפקט גיאומטרי */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      
      {/* תוכן מרכזי */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-lg w-full space-y-8">
          {/* כותרת */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              מערכת לוקרים חכמים
            </h1>
            <p className="text-gray-300 text-lg">
              פתרון מתקדם לניהול לוקרים ושליחת חבילות
            </p>
          </div>

          {/* כפתורים ראשיים */}
          <div className="space-y-4">
            <Link href="/courier" className="group block">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">שליח</h2>
                    <p className="text-gray-300 text-sm">הזנת חבילות ובחירת תאים</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/customer" className="group block">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11h8" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">לקוח</h2>
                    <p className="text-gray-300 text-sm">איסוף חבילות מהלוקר</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin" className="group block">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">מנהל</h2>
                    <p className="text-gray-300 text-sm">ניהול המערכת והלוקרים</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* סטטיסטיקות */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              סטטיסטיקות המערכת
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">15</div>
                <div className="text-xs text-gray-400">לוקרים פעילים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">225</div>
                <div className="text-xs text-gray-400">תאים זמינים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">89%</div>
                <div className="text-xs text-gray-400">שיעור תפוסה</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 