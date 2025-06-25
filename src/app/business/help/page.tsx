'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function HelpContent() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    urgency: 'normal'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitted(true);
      setIsSubmitting(false);
    }, 2000);
  };

  const handleInputChange = (field: keyof typeof contactForm, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-500/20 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 text-center">
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              הפנייה נשלחה בהצלחה!
            </h1>
            
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">מה קורה עכשיו?</h2>
              <div className="space-y-3 text-green-200">
                <p>📧 קיבלת אישור במייל</p>
                <p>⏰ נחזור אליך תוך 24 שעות</p>
                <p>📱 במקרה דחוף - התקשר אלינו</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setContactForm({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: '',
                    urgency: 'normal'
                  });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                שלח פנייה נוספת
              </button>
              
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/business" className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4">
            <span className="mr-2">←</span> חזרה לדף הבית
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            ☎️ יצירת קשר ועזרה
          </h1>
          <p className="text-slate-300 text-lg">
            נשמח לעזור לך עם כל שאלה או בעיה
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">שלח לנו הודעה</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white mb-2">שם מלא *</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
                  placeholder="הזן את שמך המלא"
                />
              </div>

              <div>
                <label className="block text-white mb-2">אימייל *</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-white mb-2">טלפון</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
                  placeholder="050-1234567"
                />
              </div>

              <div>
                <label className="block text-white mb-2">נושא הפנייה *</label>
                <select
                  required
                  value={contactForm.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
                >
                  <option value="">בחר נושא</option>
                  <option value="technical">בעיה טכנית</option>
                  <option value="payment">בעיית תשלום</option>
                  <option value="locker">בעיה עם לוקר</option>
                  <option value="refund">בקשת החזר</option>
                  <option value="general">שאלה כללית</option>
                  <option value="suggestion">הצעה לשיפור</option>
                </select>
              </div>

              <div>
                <label className="block text-white mb-2">דחיפות</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'low', label: 'נמוכה', color: 'green' },
                    { value: 'normal', label: 'רגילה', color: 'blue' },
                    { value: 'urgent', label: 'דחופה', color: 'red' }
                  ].map(urgency => (
                    <button
                      key={urgency.value}
                      type="button"
                      onClick={() => handleInputChange('urgency', urgency.value)}
                      className={`p-3 rounded-xl border transition-all ${
                        contactForm.urgency === urgency.value
                          ? `border-${urgency.color}-400 bg-${urgency.color}-400/20 text-${urgency.color}-200`
                          : 'border-white/20 text-white hover:border-white/40'
                      }`}
                    >
                      {urgency.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">הודעה *</label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
                  placeholder="תאר את הבעיה או השאלה שלך..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all ${
                  isSubmitting
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>שולח הודעה...</span>
                  </div>
                ) : (
                  'שלח הודעה'
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">🚨</span>
                מקרה חירום?
              </h3>
              <p className="text-red-200 mb-4">
                אם הלוקר לא נפתח או יש בעיה דחופה
              </p>
              <div className="space-y-3">
                <a href="tel:03-1234567" className="block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors text-center">
                  📞 התקשר עכשיו: 03-1234567
                </a>
                <button className="w-full bg-red-600/30 hover:bg-red-600/50 text-red-200 font-medium py-2 px-4 rounded-xl transition-colors">
                  💬 צ'אט חי (בשעות העבודה)
                </button>
              </div>
            </div>

            {/* Contact Methods */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">דרכי יצירת קשר</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <h4 className="text-white font-medium">אימייל</h4>
                    <p className="text-slate-300 text-sm">support@lockers.co.il</p>
                    <p className="text-slate-400 text-xs">מענה תוך 24 שעות</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h4 className="text-white font-medium">טלפון</h4>
                    <p className="text-slate-300 text-sm">03-1234567</p>
                    <p className="text-slate-400 text-xs">ראשון-חמישי 8:00-20:00</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💬</span>
                  <div>
                    <h4 className="text-white font-medium">WhatsApp</h4>
                    <p className="text-slate-300 text-sm">050-1234567</p>
                    <p className="text-slate-400 text-xs">מענה מהיר בשעות העבודה</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Quick Links */}
            <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
              <h3 className="text-xl font-bold text-white mb-4">שאלות נפוצות</h3>
              
              <div className="space-y-3">
                <Link href="/business/info" className="block bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 p-3 rounded-lg transition-colors">
                  <h4 className="font-medium">איך פותחים לוקר?</h4>
                  <p className="text-sm opacity-80">הדרכה מלאה לפתיחת לוקרים</p>
                </Link>
                
                <Link href="/business/info" className="block bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 p-3 rounded-lg transition-colors">
                  <h4 className="font-medium">בעיות תשלום</h4>
                  <p className="text-sm opacity-80">פתרונות לבעיות תשלום נפוצות</p>
                </Link>
                
                <Link href="/business/info" className="block bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 p-3 rounded-lg transition-colors">
                  <h4 className="font-medium">תנאי השירות</h4>
                  <p className="text-sm opacity-80">מדיניות והוראות שימוש</p>
                </Link>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
              <h3 className="text-xl font-bold text-white mb-4">שעות פעילות</h3>
              
              <div className="space-y-2 text-green-200">
                <div className="flex justify-between">
                  <span>ראשון-חמישי:</span>
                  <span>08:00-20:00</span>
                </div>
                <div className="flex justify-between">
                  <span>שישי:</span>
                  <span>08:00-15:00</span>
                </div>
                <div className="flex justify-between">
                  <span>שבת:</span>
                  <span>סגור</span>
                </div>
                <div className="border-t border-green-400/30 pt-2 mt-3">
                  <div className="flex justify-between font-bold">
                    <span>לוקרים:</span>
                    <span>24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remote Support */}
        <div className="mt-8 bg-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">🔧</span>
            תמיכה טכנית מרחוק
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🔓</div>
              <h4 className="text-white font-bold mb-1">פתיחת לוקר מרחוק</h4>
              <p className="text-purple-200 text-sm">אם הקוד לא עובד, נוכל לפתוח מרחוק</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="text-white font-bold mb-1">אבחון מערכת</h4>
              <p className="text-purple-200 text-sm">בדיקת תקינות הלוקר בזמן אמת</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="text-white font-bold mb-1">איפוס מערכת</h4>
              <p className="text-purple-200 text-sm">איפוס וחידוש קודי גישה</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען עזרה...</div>
      </div>
    }>
      <HelpContent />
    </Suspense>
  );
} 