'use client';

import { Suspense } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function BusinessHomeContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🏪 מערכת עסק
          </h1>
          <p className="text-slate-300 text-lg">
            בחר את השירות הרצוי
          </p>
        </div>

        {/* Main Options */}
        <div className="space-y-6">
          {/* Option 1: Product Purchase */}
          <Link href="/business/categories?type=purchase">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center space-x-4">
                <div className="text-6xl">🛍️</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200">
                    קניית מוצר
                  </h2>
                  <p className="text-slate-300">
                    רכישת מוצרים זמינים בלוקרים
                  </p>
                  <div className="text-sm text-purple-300 mt-2">
                    • בחירה מקטגוריות מוצרים
                    <br />
                    • תשלום מיידי וקבלת קוד
                    <br />
                    • פתיחת לוקר אוטומטית
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Option 2: Product Rental */}
          <Link href="/business/categories?type=rental">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center space-x-4">
                <div className="text-6xl">⏳</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200">
                    השכרת מוצר לפי שעה
                  </h2>
                  <p className="text-slate-300">
                    השכרת ציוד ומוצרים לפי שעות
                  </p>
                  <div className="text-sm text-purple-300 mt-2">
                    • ציוד ספורט, צילום, טכנולוגיה
                    <br />
                    • תשלום לפי זמן השימוש
                    <br />
                    • החזרה לאותו לוקר
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Option 3: Locker Rental */}
          <Link href="/business/locker-rental">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center space-x-4">
                <div className="text-6xl">🔐</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200">
                    השכרת לוקר לשמירת חפצים
                  </h2>
                  <p className="text-slate-300">
                    שמירה בטוחה של חפצים אישיים
                  </p>
                  <div className="text-sm text-purple-300 mt-2">
                    • בחירת גודל לוקר מתאים
                    <br />
                    • השכרה לפי שעות או ימים
                    <br />
                    • גישה בכל עת עם קוד אישי
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Links */}
        <div className="mt-12 grid grid-cols-2 gap-4">
          <Link href="/business/info">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 text-center">
              <div className="text-2xl mb-2">❓</div>
              <p className="text-white font-medium">מידע ושאלות נפוצות</p>
            </div>
          </Link>
          
          <Link href="/business/help">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 text-center">
              <div className="text-2xl mb-2">☎️</div>
              <p className="text-white font-medium">יצירת קשר ועזרה</p>
            </div>
          </Link>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-green-500/20 backdrop-blur-md rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-green-200 font-medium">המערכת פעילה ומוכנה לשימוש</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessHomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    }>
      <BusinessHomeContent />
    </Suspense>
  );
} 