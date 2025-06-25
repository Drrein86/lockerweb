'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Mock data for products by category
const productsByCategory = {
  food: [
    {
      id: 'sandwich_1',
      name: 'סנדוויץ\' טונה',
      price: 25,
      description: 'סנדוויץ\' טונה טרי עם ירקות',
      image: '🥪',
      available: true,
      locker: 'A01',
      nutritionInfo: 'קלוריות: 320, חלבון: 18g'
    },
    {
      id: 'salad_1',
      name: 'סלט ירוק',
      price: 18,
      description: 'סלט ירקות טריים עם רוטב',
      image: '🥗',
      available: true,
      locker: 'A02',
      nutritionInfo: 'קלוריות: 150, ויטמינים A,C'
    },
    {
      id: 'snack_1',
      name: 'חטיף אנרגיה',
      price: 12,
      description: 'חטיף אנרגיה עם אגozים',
      image: '🍫',
      available: false,
      locker: null,
      nutritionInfo: 'קלוריות: 200, פחמימות: 25g'
    }
  ],
  drinks: [
    {
      id: 'water_1',
      name: 'מים מינרליים',
      price: 8,
      description: 'בקבוק מים מינרליים 500ml',
      image: '💧',
      available: true,
      locker: 'B01',
      nutritionInfo: 'מים טבעיים, ללא קלוריות'
    },
    {
      id: 'coffee_1',
      name: 'קפה קר',
      price: 15,
      description: 'קפה קר עם חלב',
      image: '☕',
      available: true,
      locker: 'B02',
      nutritionInfo: 'קלוריות: 80, קפאין: 95mg'
    },
    {
      id: 'energy_1',
      name: 'משקה אנרגיה',
      price: 20,
      description: 'משקה אנרגיה לספורטאים',
      image: '⚡',
      available: true,
      locker: 'B03',
      nutritionInfo: 'קלוריות: 110, קפאין: 80mg'
    }
  ],
  gadgets: [
    {
      id: 'charger_1',
      name: 'מטען נייד',
      price: 45,
      description: 'מטען נייד 10000mAh',
      image: '🔋',
      available: true,
      locker: 'C01',
      nutritionInfo: 'קיבולת: 10000mAh, USB-C + USB-A'
    },
    {
      id: 'headphones_1',
      name: 'אוזניות Bluetooth',
      price: 80,
      description: 'אוזניות אלחוטיות איכותיות',
      image: '🎧',
      available: true,
      locker: 'C02',
      nutritionInfo: 'זמן שמעה: 8 שעות, טעינה מהירה'
    }
  ]
};

const categoryNames = {
  food: 'אוכל',
  drinks: 'שתייה',
  gadgets: 'גאדג\'טים',
  accessories: 'אביזרים',
  cosmetics: 'קוסמטיקה'
};

function ProductPurchaseContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'food';
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = productsByCategory[category] || [];
  const categoryName = categoryNames[category] || 'מוצרים';

  const handleProductSelect = (product) => {
    if (product.available) {
      setSelectedProduct(product);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/business/categories?type=purchase" className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4">
            <span className="mr-2">←</span> חזרה לקטגוריות
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            🛍️ בחירת מוצר - {categoryName}
          </h1>
          <p className="text-slate-300 text-lg">
            בחר מוצר לרכישה
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product) => (
            <div 
              key={product.id} 
              onClick={() => handleProductSelect(product)}
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 cursor-pointer ${
                product.available 
                  ? 'border-white/20 hover:bg-white/20 hover:border-green-400/50' 
                  : 'border-red-400/30 opacity-60 cursor-not-allowed'
              } ${selectedProduct?.id === product.id ? 'border-green-400 bg-green-400/10' : ''}`}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{product.image}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {product.name}
                </h3>
                <p className="text-slate-300 mb-3 text-sm">
                  {product.description}
                </p>
                
                {/* Price */}
                <div className="text-2xl font-bold text-green-400 mb-3">
                  ₪{product.price}
                </div>

                {/* Availability */}
                <div className={`text-sm mb-3 ${product.available ? 'text-green-300' : 'text-red-300'}`}>
                  {product.available ? `✅ זמין בלוקר ${product.locker}` : '❌ לא זמין כרגע'}
                </div>

                {/* Additional Info */}
                <div className="text-xs text-purple-300 bg-white/5 rounded-lg p-2">
                  {product.nutritionInfo}
                </div>

                {/* Selection Indicator */}
                {selectedProduct?.id === product.id && (
                  <div className="mt-3 text-green-400 font-bold">
                    ✓ נבחר
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">
              אין מוצרים זמינים
            </h3>
            <p className="text-slate-300">
              אין מוצרים בקטגוריה זו כרגע
            </p>
          </div>
        )}

        {/* Selected Product Summary */}
        {selectedProduct && (
          <div className="bg-green-500/20 backdrop-blur-md rounded-2xl p-6 border border-green-500/30 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">המוצר שנבחר:</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{selectedProduct.image}</div>
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedProduct.name}</h4>
                  <p className="text-green-200">{selectedProduct.description}</p>
                  <p className="text-sm text-green-300">לוקר: {selectedProduct.locker}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">₪{selectedProduct.price}</div>
                <Link href={`/business/payment?product=${selectedProduct.id}&type=purchase`}>
                  <button className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                    בחר והמשך לתשלום
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="text-white font-bold mb-2">איך זה עובד?</h4>
              <ol className="text-blue-200 space-y-1 text-sm">
                <li>1. בחר מוצר זמין (מסומן בירוק)</li>
                <li>2. לחץ על "בחר והמשך לתשלום"</li>
                <li>3. בצע תשלום בכרטיס אשראי</li>
                <li>4. קבל קוד בן 4 ספרות</li>
                <li>5. פתח את הלוקר וקח את המוצר</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductPurchasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען מוצרים...</div>
      </div>
    }>
      <ProductPurchaseContent />
    </Suspense>
  );
} 