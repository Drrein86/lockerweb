'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Mock data for rental products by category
const rentalProductsByCategory = {
  gadgets: [
    {
      id: 'charger_rental',
      name: 'מטען נייד',
      hourlyRate: 5,
      description: 'מטען נייד 10000mAh',
      image: '🔋',
      available: true,
      locker: 'R01',
      specs: 'קיבולת: 10000mAh, USB-C + USB-A',
      condition: 'מצב מעולה',
      deposit: 50
    },
    {
      id: 'headphones_rental',
      name: 'אוזניות Bluetooth',
      hourlyRate: 8,
      description: 'אוזניות אלחוטיות איכותיות',
      image: '🎧',
      available: true,
      locker: 'R02',
      specs: 'זמן שמעה: 8 שעות, טעינה מהירה',
      condition: 'מצב טוב',
      deposit: 80
    }
  ],
  sports: [
    {
      id: 'tennis_racket',
      name: 'מחבט טניס',
      hourlyRate: 10,
      description: 'מחבט טניס מקצועי',
      image: '🎾',
      available: true,
      locker: 'S01',
      specs: 'משקל: 300g, גודל גריפ: 4',
      condition: 'מצב מעולה',
      deposit: 120
    },
    {
      id: 'yoga_mat',
      name: 'מזרן יוגה',
      hourlyRate: 3,
      description: 'מזרן יוגה איכותי ונוח',
      image: '🧘',
      available: true,
      locker: 'S02',
      specs: 'עובי: 6mm, חומר: TPE',
      condition: 'מצב מעולה',
      deposit: 30
    }
  ],
  photography: [
    {
      id: 'camera_rental',
      name: 'מצלמה דיגיטלית',
      hourlyRate: 25,
      description: 'מצלמה DSLR מקצועית',
      image: '📷',
      available: true,
      locker: 'P01',
      specs: '24MP, 4K וידאו, Wi-Fi',
      condition: 'מצב מעולה',
      deposit: 800
    },
    {
      id: 'tripod_rental',
      name: 'חצובה',
      hourlyRate: 8,
      description: 'חצובה מקצועית לצילום',
      image: '📐',
      available: true,
      locker: 'P02',
      specs: 'גובה מקסימלי: 160cm, משקל: 1.2kg',
      condition: 'מצב טוב',
      deposit: 100
    }
  ]
};

const categoryNames = {
  gadgets: 'גאדג\'טים',
  sports: 'ספורט',
  photography: 'צילום',
  picnic: 'פיקניק'
};

function ProductRentalContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'sports';
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rentalDuration, setRentalDuration] = useState(1);
  const [rentalType, setRentalType] = useState('hours'); // 'hours' or 'timeRange'
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const products = rentalProductsByCategory[category as keyof typeof rentalProductsByCategory] || [];
  const categoryName = categoryNames[category as keyof typeof categoryNames] || 'מוצרים';

  const handleProductSelect = (product: any) => {
    if (product.available) {
      setSelectedProduct(product);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedProduct) return 0;
    
    let hours = rentalDuration;
    if (rentalType === 'timeRange' && startTime && endTime) {
      const start = new Date(`2024-01-01T${startTime}`);
      const end = new Date(`2024-01-01T${endTime}`);
      hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    }
    
    return selectedProduct.hourlyRate * hours;
  };

  const getCalculatedHours = () => {
    if (rentalType === 'hours') return rentalDuration;
    
    if (rentalType === 'timeRange' && startTime && endTime) {
      const start = new Date(`2024-01-01T${startTime}`);
      const end = new Date(`2024-01-01T${endTime}`);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    }
    
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/business/categories?type=rental" className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4">
            <span className="mr-2">←</span> חזרה לקטגוריות
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            ⏳ השכרת מוצרים - {categoryName}
          </h1>
          <p className="text-slate-300 text-lg">
            בחר מוצר וקבע זמן השכרה
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {products.map((product) => (
            <div 
              key={product.id} 
              onClick={() => handleProductSelect(product)}
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 cursor-pointer ${
                product.available 
                  ? 'border-white/20 hover:bg-white/20 hover:border-blue-400/50' 
                  : 'border-red-400/30 opacity-60 cursor-not-allowed'
              } ${selectedProduct?.id === product.id ? 'border-blue-400 bg-blue-400/10' : ''}`}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{product.image}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {product.name}
                </h3>
                <p className="text-slate-300 mb-3 text-sm">
                  {product.description}
                </p>
                
                {/* Hourly Rate */}
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  ₪{product.hourlyRate}/שעה
                </div>

                {/* Deposit */}
                <div className="text-sm text-yellow-300 mb-3">
                  פיקדון: ₪{product.deposit}
                </div>

                {/* Availability */}
                <div className={`text-sm mb-3 ${product.available ? 'text-green-300' : 'text-red-300'}`}>
                  {product.available ? `✅ זמין בלוקר ${product.locker}` : '❌ לא זמין כרגע'}
                </div>

                {/* Specs */}
                <div className="text-xs text-purple-300 bg-white/5 rounded-lg p-2 mb-2">
                  {product.specs}
                </div>

                {/* Condition */}
                <div className="text-xs text-green-300">
                  {product.condition}
                </div>

                {/* Selection Indicator */}
                {selectedProduct?.id === product.id && (
                  <div className="mt-3 text-blue-400 font-bold">
                    ✓ נבחר
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Time Selection */}
        {selectedProduct && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">בחירת זמן השכרה</h3>
            
            {/* Rental Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setRentalType('hours')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  rentalType === 'hours' 
                    ? 'border-blue-400 bg-blue-400/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">⏱️</div>
                  <h4 className="text-white font-medium">מספר שעות</h4>
                  <p className="text-slate-400 text-sm">בחר כמות שעות</p>
                </div>
              </button>

              <button
                onClick={() => setRentalType('timeRange')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  rentalType === 'timeRange' 
                    ? 'border-blue-400 bg-blue-400/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <h4 className="text-white font-medium">טווח זמן</h4>
                  <p className="text-slate-400 text-sm">בחר שעת התחלה וסיום</p>
                </div>
              </button>
            </div>

            {/* Hours Selection */}
            {rentalType === 'hours' && (
              <div className="mb-6">
                <label className="block text-white mb-2">מספר שעות:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 6, 8, 12, 24].map(hours => (
                    <button
                      key={hours}
                      onClick={() => setRentalDuration(hours)}
                      className={`p-3 rounded-xl border transition-all ${
                        rentalDuration === hours
                          ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                          : 'border-white/20 text-white hover:border-white/40'
                      }`}
                    >
                      {hours} שעות
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Range Selection */}
            {rentalType === 'timeRange' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-white mb-2">שעת התחלה:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">שעת סיום:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  />
                </div>
              </div>
            )}

            {/* Price Calculation */}
            <div className="bg-blue-500/20 rounded-xl p-4">
              <h4 className="text-white font-bold mb-2">חישוב מחיר:</h4>
              <div className="space-y-1 text-blue-200">
                <p>מוצר: {selectedProduct.name}</p>
                <p>מחיר לשעה: ₪{selectedProduct.hourlyRate}</p>
                <p>זמן השכרה: {getCalculatedHours()} שעות</p>
                <p>פיקדון: ₪{selectedProduct.deposit}</p>
                <div className="border-t border-blue-400/30 pt-2 mt-2">
                  <p className="text-xl font-bold text-blue-300">
                    סה"כ לתשלום: ₪{calculateTotalPrice() + selectedProduct.deposit}
                  </p>
                  <p className="text-sm text-blue-300">
                    (כולל פיקדון ₪{selectedProduct.deposit})
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proceed to Payment */}
        {selectedProduct && getCalculatedHours() > 0 && (
          <div className="bg-green-500/20 backdrop-blur-md rounded-2xl p-6 border border-green-500/30 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">מוכן לתשלום</h3>
                <p className="text-green-200">
                  {selectedProduct.name} ל-{getCalculatedHours()} שעות
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  ₪{calculateTotalPrice() + selectedProduct.deposit}
                </div>
                <Link href={`/business/payment?product=${selectedProduct.id}&type=rental&duration=${getCalculatedHours()}`}>
                  <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                    המשך לתשלום
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="bg-yellow-500/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30">
          <h3 className="text-white font-bold mb-4">תנאי השכרה:</h3>
          <ul className="text-yellow-200 space-y-2 text-sm">
            <li>• תשלום פיקדון נדרש לכל השכרה</li>
            <li>• הפיקדון יוחזר בתום השכרה בהחזרת המוצר במצב תקין</li>
            <li>• איחור בהחזרה יגרור תשלום נוסף של 50% מהמחיר השעתי</li>
            <li>• נזק למוצר יגרור ניכוי מהפיקדון</li>
            <li>• המוצר חייב להיות מוחזר לאותו לוקר</li>
            <li>• קבלת התזכורת ב-SMS לפני סיום השכרה</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ProductRentalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען מוצרים להשכרה...</div>
      </div>
    }>
      <ProductRentalContent />
    </Suspense>
  );
} 