'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function UnlockContent() {
  const [code, setCode] = useState(['', '', '', '']);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // Valid codes for demo (in real app, this would be validated on server)
  const validCodes = ['1234', '5678', '9012', '3456', '7890'];

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleUnlock = async () => {
    const enteredCode = code.join('');
    
    if (enteredCode.length !== 4) {
      setUnlockError('אנא הזן קוד בן 4 ספרות');
      return;
    }

    setIsUnlocking(true);
    setUnlockError('');

    // Simulate API call
    setTimeout(() => {
      if (validCodes.includes(enteredCode)) {
        setUnlockSuccess(true);
      } else {
        setUnlockError('קוד שגוי. אנא נסה שוב');
        setCode(['', '', '', '']);
      }
      setIsUnlocking(false);
    }, 2000);
  };

  const resetForm = () => {
    setCode(['', '', '', '']);
    setUnlockSuccess(false);
    setUnlockError('');
  };

  if (unlockSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-500/20 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 text-center">
            <div className="text-6xl mb-6 animate-bounce">🔓</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              הלוקר נפתח בהצלחה!
            </h1>
            
            {/* Success Animation */}
            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-white mb-2">
                קח את המוצר שלך
              </h2>
              <p className="text-green-200">
                הלוקר פתוח עכשיו - אנא קח את המוצר וסגור את הדלת
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/20 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-white mb-2">הוראות:</h3>
              <ol className="text-blue-200 text-sm space-y-1">
                <li>1. פתח את דלת הלוקר</li>
                <li>2. קח את המוצר מהלוקר</li>
                <li>3. סגור את הדלת היטב</li>
                <li>4. הלוקר ייננעל אוטומטית</li>
              </ol>
            </div>

            {/* Timer */}
            <div className="bg-yellow-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">⏰</span>
                <p className="text-yellow-200">
                  הלוקר ייסגר אוטומטית תוך 60 שניות
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={resetForm}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                פתח לוקר נוסף
              </button>
              
              <Link href="/business">
                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                  חזרה לדף הבית
                </button>
              </Link>
            </div>

            {/* Thank You Message */}
            <div className="mt-8 text-center">
              <p className="text-2xl mb-2">🙏</p>
              <p className="text-white font-medium">
                תודה שבחרת בשירותי הלוקר שלנו!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/business" className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4">
            <span className="mr-2">←</span> חזרה לדף הבית
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            🔓 פתיחת לוקר
          </h1>
          <p className="text-slate-300 text-lg">
            הזן את הקוד בן 4 הספרות לפתיחת הלוקר
          </p>
        </div>

        {/* Code Input */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            קוד גישה
          </h2>
          
          <div className="flex justify-center space-x-4 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-16 h-16 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:border-green-400 focus:outline-none transition-colors"
                maxLength={1}
              />
            ))}
          </div>

          {unlockError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-red-400 text-xl">❌</span>
                <p className="text-red-200">{unlockError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={isUnlocking || code.join('').length !== 4}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all ${
              isUnlocking || code.join('').length !== 4
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isUnlocking ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>פותח לוקר...</span>
              </div>
            ) : (
              'פתח לוקר'
            )}
          </button>
        </div>

        {/* Alternative Options */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">אפשרויות נוספות</h3>
          
          <div className="space-y-4">
            <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/30 text-blue-200 font-medium py-3 px-4 rounded-xl transition-colors">
              📱 פתח עם QR Code (בקרוב)
            </button>
            
            <button className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/30 text-purple-200 font-medium py-3 px-4 rounded-xl transition-colors">
              📧 שלח קוד שוב ל-SMS
            </button>
          </div>
        </div>

        {/* Demo Codes */}
        <div className="bg-yellow-500/20 backdrop-blur-md rounded-xl p-4 border border-yellow-500/30">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="text-white font-bold mb-2">קודי דמו לבדיקה:</h4>
              <p className="text-yellow-200 text-sm">
                1234, 5678, 9012, 3456, 7890
              </p>
              <p className="text-yellow-300 text-xs mt-1">
                (באפליקציה האמיתית תקבל קוד אישי ייחודי)
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
          <h3 className="text-white font-bold mb-4">זקוק לעזרה?</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-xl">❓</span>
              <p className="text-blue-200 text-sm">
                לא זוכר את הקוד? בדוק את ה-SMS שנשלח אליך
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xl">🔧</span>
              <p className="text-blue-200 text-sm">
                הלוקר לא נפתח? נסה להזין את הקוד שוב
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xl">📞</span>
              <p className="text-blue-200 text-sm">
                בעיות טכניות? צור קשר עם התמיכה
              </p>
            </div>
          </div>
          
          <Link href="/business/help">
            <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-colors">
              יצירת קשר לתמיכה
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnlockPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    }>
      <UnlockContent />
    </Suspense>
  );
} 