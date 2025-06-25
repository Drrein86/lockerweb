'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Locker sizes and rates
const lockerSizes = [
  {
    id: 'small',
    name: 'קטן',
    dimensions: '15x10x5 ס"מ',
    area: '150 ס"מ²',
    hourlyRate: 5,
    dailyRate: 30,
    icon: '📦',
    description: 'מתאים לטלפון, ארנק, מפתחות',
    examples: ['טלפון נייד', 'ארנק', 'מפתחות', 'תכשיטים'],
    available: 8
  },
  {
    id: 'medium',
    name: 'בינוני',
    dimensions: '30x20x15 ס"מ',
    area: '600 ס"מ²',
    hourlyRate: 8,
    dailyRate: 50,
    icon: '📋',
    description: 'מתאים לספרים, מסמכים, קוסמטיקה',
    examples: ['ספרים', 'מסמכים', 'קוסמטיקה', 'תרופות'],
    available: 12
  },
  {
    id: 'large',
    name: 'גדול',
    dimensions: '45x35x25 ס"מ',
    area: '1,575 ס"מ²',
    hourlyRate: 12,
    dailyRate: 80,
    icon: '📄',
    description: 'מתאים לנעליים, בגדים, אלקטרוניקה',
    examples: ['נעליים', 'בגדים', 'מחשב נייד', 'מצלמה'],
    available: 6
  },
  {
    id: 'wide',
    name: 'רחב',
    dimensions: '60x40x10 ס"מ',
    area: '2,400 ס"מ²',
    hourlyRate: 15,
    dailyRate: 100,
    icon: '🗂️',
    description: 'מתאים למסמכים גדולים, תמונות',
    examples: ['מסמכים A3', 'תמונות', 'ציורים', 'מפות'],
    available: 4
  }
];

function LockerRentalContent() {
  const [selectedSize, setSelectedSize] = useState(null);
  const [rentalDuration, setRentalDuration] = useState(1);
  const [rentalType, setRentalType] = useState('hours'); // 'hours' or 'days'
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const calculateTotalPrice = () => {
    if (!selectedSize) return 0;
    
    if (rentalType === 'hours') {
      return selectedSize.hourlyRate * rentalDuration;
    } else {
      return selectedSize.dailyRate * rentalDuration;
    }
  };

  const getCalculatedTime = () => {
    if (rentalType === 'timeRange' && startTime && endTime) {
      const start = new Date(`2024-01-01T${startTime}`);
      const end = new Date(`2024-01-01T${endTime}`);
      return Math.ceil((end - start) / (1000 * 60 * 60));
    }
    
    return rentalDuration;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/business" className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4">
            <span className="mr-2">←</span> חזרה לדף הבית
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            🔐 השכרת לוקר לשמירת חפצים
          </h1>
          <p className="text-slate-300 text-lg">
            בחר גודל לוקר וזמן השכרה
          </p>
        </div>

        {/* Size Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">בחירת גודל לוקר</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lockerSizes.map((size) => (
              <div 
                key={size.id} 
                onClick={() => handleSizeSelect(size)}
                className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 cursor-pointer ${
                  selectedSize?.id === size.id 
                    ? 'border-purple-400 bg-purple-400/10' 
                    : 'border-white/20 hover:bg-white/20 hover:border-purple-400/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">{size.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    לוקר {size.name}
                  </h3>
                  <p className="text-slate-300 mb-3">
                    {size.description}
                  </p>
                  
                  {/* Dimensions */}
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-purple-300 font-medium">{size.dimensions}</p>
                    <p className="text-purple-200 text-sm">{size.area}</p>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 mb-4">
                    <div className="text-green-400 font-bold">
                      ₪{size.hourlyRate}/שעה
                    </div>
                    <div className="text-blue-400 font-bold">
                      ₪{size.dailyRate}/יום
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="text-sm text-green-300 mb-4">
                    ✅ {size.available} לוקרים זמינים
                  </div>

                  {/* Examples */}
                  <div className="text-xs text-slate-400">
                    <p className="font-medium mb-1">דוגמאות:</p>
                    <div className="space-y-1">
                      {size.examples.slice(0, 2).map((example, index) => (
                        <div key={index} className="bg-white/5 rounded px-2 py-1">
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedSize?.id === size.id && (
                    <div className="mt-4 text-purple-400 font-bold">
                      ✓ נבחר
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        {selectedSize && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">בחירת משך זמן</h3>
            
            {/* Rental Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setRentalType('hours')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  rentalType === 'hours' 
                    ? 'border-purple-400 bg-purple-400/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">⏱️</div>
                  <h4 className="text-white font-medium">לפי שעות</h4>
                  <p className="text-slate-400 text-sm">₪{selectedSize.hourlyRate}/שעה</p>
                </div>
              </button>

              <button
                onClick={() => setRentalType('days')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  rentalType === 'days' 
                    ? 'border-purple-400 bg-purple-400/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <h4 className="text-white font-medium">לפי ימים</h4>
                  <p className="text-slate-400 text-sm">₪{selectedSize.dailyRate}/יום</p>
                </div>
              </button>
            </div>

            {/* Hours Selection */}
            {rentalType === 'hours' && (
              <div className="mb-6">
                <label className="block text-white mb-2">מספר שעות:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 6, 8, 12, 18, 24].map(hours => (
                    <button
                      key={hours}
                      onClick={() => setRentalDuration(hours)}
                      className={`p-3 rounded-xl border transition-all ${
                        rentalDuration === hours && rentalType === 'hours'
                          ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                          : 'border-white/20 text-white hover:border-white/40'
                      }`}
                    >
                      {hours}ש'
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Days Selection */}
            {rentalType === 'days' && (
              <div className="mb-6">
                <label className="block text-white mb-2">מספר ימים:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5, 7, 10, 14, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setRentalDuration(days)}
                      className={`p-3 rounded-xl border transition-all ${
                        rentalDuration === days && rentalType === 'days'
                          ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                          : 'border-white/20 text-white hover:border-white/40'
                      }`}
                    >
                      {days} ימים
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Calculation */}
            <div className="bg-purple-500/20 rounded-xl p-4">
              <h4 className="text-white font-bold mb-2">חישוב מחיר:</h4>
              <div className="space-y-1 text-purple-200">
                <p>לוקר {selectedSize.name} ({selectedSize.dimensions})</p>
                <p>
                  מחיר: ₪{rentalType === 'hours' ? selectedSize.hourlyRate : selectedSize.dailyRate}
                  /{rentalType === 'hours' ? 'שעה' : 'יום'}
                </p>
                <p>
                  זמן: {rentalDuration} {rentalType === 'hours' ? 'שעות' : 'ימים'}
                </p>
                <div className="border-t border-purple-400/30 pt-2 mt-2">
                  <p className="text-xl font-bold text-purple-300">
                    סה"כ: ₪{calculateTotalPrice()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        {selectedSize && (
          <div className="bg-yellow-500/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30 mb-8">
            <h3 className="text-white font-bold mb-4">תנאי השכרה:</h3>
            <ul className="text-yellow-200 space-y-2 text-sm">
              <li>• אחריות מלאה על החפצים שנשמרים בלוקר</li>
              <li>• גישה 24/7 עם הקוד האישי שלך</li>
              <li>• איחור בפינוי יגרור תשלום נוסף של ₪20/יום</li>
              <li>• אין אחריות על חפצים יקרי ערך מעל ₪1000</li>
              <li>• חפצים שנשארים מעל 30 יום יוסרו ללא הודעה</li>
              <li>• תזכורת ב-SMS לפני סיום התקופה</li>
            </ul>
          </div>
        )}

        {/* Proceed to Payment */}
        {selectedSize && rentalDuration > 0 && (
          <div className="bg-green-500/20 backdrop-blur-md rounded-2xl p-6 border border-green-500/30 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">מוכן לתשלום</h3>
                <p className="text-green-200">
                  לוקר {selectedSize.name} ל-{rentalDuration} {rentalType === 'hours' ? 'שעות' : 'ימים'}
                </p>
                <p className="text-green-300 text-sm">
                  {selectedSize.available} לוקרים זמינים
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  ₪{calculateTotalPrice()}
                </div>
                <Link href={`/business/payment?type=locker-rental&size=${selectedSize.id}&duration=${rentalDuration}&unit=${rentalType}`}>
                  <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                    המשך לתשלום
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-4 border border-blue-500/30 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h4 className="text-white font-bold mb-1">אבטחה מלאה</h4>
            <p className="text-blue-200 text-sm">קוד אישי ומערכת נעילה חכמה</p>
          </div>
          
          <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-4 border border-green-500/30 text-center">
            <div className="text-3xl mb-2">📱</div>
            <h4 className="text-white font-bold mb-1">גישה 24/7</h4>
            <p className="text-green-200 text-sm">פתיחה בכל עת עם הקוד או SMS</p>
          </div>
          
          <div className="bg-purple-500/20 backdrop-blur-md rounded-xl p-4 border border-purple-500/30 text-center">
            <div className="text-3xl mb-2">🔔</div>
            <h4 className="text-white font-bold mb-1">תזכורות חכמות</h4>
            <p className="text-purple-200 text-sm">הודעות SMS לפני סיום התקופה</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-bold mb-4">שאלות נפוצות</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-white font-medium mb-1">איך אני פותח את הלוקר?</h4>
              <p className="text-slate-300">עם הקוד בן 4 ספרות שתקבל לאחר התשלום</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">מה קורה אם אשכח את הקוד?</h4>
              <p className="text-slate-300">הקוד נשמר גם ב-SMS ובמערכת - תוכל לבקש שליחה מחדש</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">האם יש הגבלה על סוג החפצים?</h4>
              <p className="text-slate-300">אסור לשמור חפצים מסוכנים, מזון מתכלה או חומרים דליקים</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LockerRentalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען לוקרים...</div>
      </div>
    }>
      <LockerRentalContent />
    </Suspense>
  );
} 