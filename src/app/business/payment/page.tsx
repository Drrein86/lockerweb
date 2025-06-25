'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Mock product data for payment
const productData = {
  sandwich_1: { name: 'סנדוויץ\' טונה', price: 25, image: '🥪', locker: 'A01' },
  salad_1: { name: 'סלט ירוק', price: 18, image: '🥗', locker: 'A02' },
  water_1: { name: 'מים מינרליים', price: 8, image: '💧', locker: 'B01' },
  coffee_1: { name: 'קפה קר', price: 15, image: '☕', locker: 'B02' },
  charger_1: { name: 'מטען נייד', price: 45, image: '🔋', locker: 'C01' },
  headphones_1: { name: 'אוזניות Bluetooth', price: 80, image: '🎧', locker: 'C02' }
};

function PaymentContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  const type = searchParams.get('type') || 'purchase';
  const duration = searchParams.get('duration');
  const size = searchParams.get('size');

  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const product = productData[productId];
  
  // Calculate price based on type
  let totalPrice = 0;
  let priceBreakdown = '';
  
  if (type === 'purchase' && product) {
    totalPrice = product.price;
    priceBreakdown = `מחיר מוצר: ₪${product.price}`;
  } else if (type === 'rental' && product && duration) {
    const hourlyRate = Math.round(product.price * 0.1); // 10% of purchase price per hour
    totalPrice = hourlyRate * parseInt(duration);
    priceBreakdown = `₪${hourlyRate} × ${duration} שעות = ₪${totalPrice}`;
  } else if (type === 'locker-rental' && size && duration) {
    const sizeRates = { small: 5, medium: 8, large: 12, wide: 15 };
    const hourlyRate = sizeRates[size] || 5;
    totalPrice = hourlyRate * parseInt(duration);
    priceBreakdown = `לוקר ${size} - ₪${hourlyRate} × ${duration} שעות = ₪${totalPrice}`;
  }

  const handlePayment = async () => {
    if (paymentMethod === 'credit-card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv)) {
      alert('אנא מלא את כל פרטי כרטיס האשראי');
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setAccessCode(code);
      setPaymentComplete(true);
      setProcessing(false);
    }, 3000);
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-500/20 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 text-center">
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              התשלום בוצע בהצלחה!
            </h1>
            
            {/* Access Code */}
            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">קוד הגישה שלך:</h2>
              <div className="text-6xl font-mono text-green-400 mb-4 tracking-wider">
                {accessCode}
              </div>
              <p className="text-green-200 text-sm">
                שמור קוד זה - תצטרך אותו לפתיחת הלוקר
              </p>
            </div>

            {/* Purchase Details */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-right">
              <h3 className="font-bold text-white mb-2">פרטי הרכישה:</h3>
              {product && (
                <>
                  <p className="text-slate-300">מוצר: {product.name} {product.image}</p>
                  <p className="text-slate-300">לוקר: {product.locker}</p>
                </>
              )}
              <p className="text-slate-300">{priceBreakdown}</p>
              <p className="text-green-400 font-bold">סה"כ: ₪{totalPrice}</p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/20 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-white mb-2">הוראות שימוש:</h3>
              <ol className="text-blue-200 text-sm space-y-1 text-right">
                <li>1. גש ללוקר המצוין</li>
                <li>2. הקש את הקוד בן 4 הספרות</li>
                <li>3. הלוקר ייפתח אוטומטית</li>
                <li>4. קח את המוצר וסגור את הלוקר</li>
              </ol>
            </div>

            {/* SMS Notification */}
            <div className="bg-purple-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">📱</span>
                <p className="text-purple-200">
                  הקוד נשלח גם ב-SMS למספר הטלפון שלך
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link href="/business/unlock">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors">
                  פתח לוקר עכשיו
                </button>
              </Link>
              
              <Link href="/business">
                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                  חזרה לדף הבית
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            💳 תשלום
          </h1>
          <p className="text-blue-200 text-lg">
            השלם את התשלום לקבלת הקוד
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">סיכום הזמנה</h2>
          
          {product && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{product.image}</div>
                <div>
                  <h3 className="text-white font-medium">{product.name}</h3>
                  <p className="text-blue-300 text-sm">לוקר: {product.locker}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="border-t border-white/20 pt-4">
            <div className="flex justify-between text-blue-200 mb-2">
              <span>{priceBreakdown}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-white">
              <span>סה"כ לתשלום:</span>
              <span className="text-green-400">₪{totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">אמצעי תשלום</h2>
          
          <div className="space-y-4">
            {/* Credit Card */}
            <div 
              onClick={() => setPaymentMethod('credit-card')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'credit-card' 
                  ? 'border-green-400 bg-green-400/10' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💳</span>
                <div>
                  <h3 className="text-white font-medium">כרטיס אשראי</h3>
                  <p className="text-slate-400 text-sm">ויזה, מאסטרקארד, אמריקן אקספרס</p>
                </div>
              </div>
            </div>

            {/* Digital Wallet */}
            <div 
              onClick={() => setPaymentMethod('digital-wallet')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'digital-wallet' 
                  ? 'border-green-400 bg-green-400/10' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="text-white font-medium">ארנק דיגיטלי</h3>
                  <p className="text-slate-400 text-sm">Apple Pay, Google Pay, PayPal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Card Form */}
        {paymentMethod === 'credit-card' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">פרטי כרטיס אשראי</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">מספר כרטיס</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">תוקף</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white mb-2">שם בעל הכרטיס</label>
                <input
                  type="text"
                  placeholder="שם מלא"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className={`w-full font-bold py-4 px-6 rounded-xl transition-all ${
            processing
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {processing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>מעבד תשלום...</span>
            </div>
          ) : (
            `שלם ₪${totalPrice}`
          )}
        </button>

        {/* Security Info */}
        <div className="mt-6 bg-blue-500/20 backdrop-blur-md rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔒</span>
            <p className="text-blue-200 text-sm">
              התשלום מאובטח ומוצפן. פרטי הכרטיס שלך מוגנים
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען תשלום...</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
} 