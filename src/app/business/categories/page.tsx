'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Mock data for categories
const categories = [
  {
    id: 'food',
    name: 'אוכל',
    icon: '🍕',
    description: 'חטיפים, ארוחות מוכנות, מזון מהיר',
    purchaseAvailable: true,
    rentalAvailable: false,
    items: ['סנדוויץ\'', 'סלט', 'חטיפים', 'ממתקים']
  },
  {
    id: 'drinks',
    name: 'שתייה',
    icon: '🥤',
    description: 'משקאות קרים וחמים, מים, קפה',
    purchaseAvailable: true,
    rentalAvailable: false,
    items: ['מים', 'קפה', 'משקאות קרים', 'אנרגיה']
  },
  {
    id: 'gadgets',
    name: 'גאדג\'טים',
    icon: '📱',
    description: 'אביזרי טכנולוגיה, מטענים, אוזניות',
    purchaseAvailable: true,
    rentalAvailable: true,
    items: ['מטען נייד', 'אוזניות', 'כבל טעינה', 'רמקול נייד']
  },
  {
    id: 'accessories',
    name: 'אביזרים',
    icon: '👜',
    description: 'תיקים, מטריות, אביזרי אופנה',
    purchaseAvailable: true,
    rentalAvailable: true,
    items: ['מטרייה', 'תיק', 'כובע', 'משקפי שמש']
  },
  {
    id: 'cosmetics',
    name: 'קוסמטיקה',
    icon: '💄',
    description: 'מוצרי יופי וטיפוח',
    purchaseAvailable: true,
    rentalAvailable: false,
    items: ['קרם יד', 'שפתון', 'מסכה', 'בושם מיני']
  },
  {
    id: 'sports',
    name: 'ספורט',
    icon: '⚽',
    description: 'ציוד ספורט להשכרה',
    purchaseAvailable: false,
    rentalAvailable: true,
    items: ['כדור', 'מחבט טניס', 'מזרן יוגה', 'משקולות']
  },
  {
    id: 'photography',
    name: 'צילום',
    icon: '📷',
    description: 'ציוד צילום מקצועי',
    purchaseAvailable: false,
    rentalAvailable: true,
    items: ['מצלמה', 'חצובה', 'עדשות', 'תאורה']
  },
  {
    id: 'picnic',
    name: 'פיקניק',
    icon: '🧺',
    description: 'ציוד לטיולים ופיקניקים',
    purchaseAvailable: false,
    rentalAvailable: true,
    items: ['כיסאות', 'שולחן נייד', 'צידנית', 'גריל נייד']
  }
];

function CategoriesContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'purchase'; // 'purchase' or 'rental'

  const filteredCategories = categories.filter(category => 
    type === 'purchase' ? category.purchaseAvailable : category.rentalAvailable
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/business" className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4">
            <span className="mr-2">←</span> חזרה לדף הבית
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            {type === 'purchase' ? '🛍️ בחירת קטגוריית מוצרים לקנייה' : '⏳ בחירת קטגוריית מוצרים להשכרה'}
          </h1>
          <p className="text-slate-300 text-lg">
            בחר קטגוריה לצפייה במוצרים זמינים
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Link key={category.id} href={`/business/product-${type}?category=${category.id}`}>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">{category.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-200">
                    {category.name}
                  </h3>
                  <p className="text-slate-300 mb-4">
                    {category.description}
                  </p>
                  
                  {/* Sample Items */}
                  <div className="text-sm text-purple-300">
                    <p className="font-medium mb-2">דוגמאות:</p>
                    <div className="space-y-1">
                      {category.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="bg-white/5 rounded-lg px-3 py-1">
                          {item}
                        </div>
                      ))}
                      {category.items.length > 3 && (
                        <div className="text-purple-400 text-xs">
                          +{category.items.length - 3} נוספים
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-bold text-white mb-2">
              אין קטגוריות זמינות
            </h3>
            <p className="text-slate-300">
              {type === 'purchase' ? 'אין מוצרים זמינים לקנייה כרגע' : 'אין מוצרים זמינים להשכרה כרגע'}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="text-white font-bold mb-2">טיפ שימושי</h4>
              <p className="text-blue-200">
                {type === 'purchase' 
                  ? 'לאחר בחירת מוצר ותשלום, תקבל קוד בן 4 ספרות לפתיחת הלוקר'
                  : 'בהשכרה, שים לב לזמן החזרה כדי למנוע תשלום נוסף'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען קטגוריות...</div>
      </div>
    }>
      <CategoriesContent />
    </Suspense>
  );
} 