'use client';

import { Suspense } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function InfoContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/business" className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4">
            <span className="mr-2">←</span> חזרה לדף הבית
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            ❓ מידע ושאלות נפוצות
          </h1>
          <p className="text-slate-300 text-lg">
            כל מה שצריך לדעת על שירותי הלוקר
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">🔧</span>
            איך זה עובד?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">1️⃣</div>
              <h3 className="text-white font-bold mb-2">בחר שירות</h3>
              <p className="text-slate-300 text-sm">
                קנייה, השכרה או שמירת חפצים
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">2️⃣</div>
              <h3 className="text-white font-bold mb-2">שלם מאובטח</h3>
              <p className="text-slate-300 text-sm">
                תשלום בכרטיס אשראי או ארנק דיגיטלי
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">3️⃣</div>
              <h3 className="text-white font-bold mb-2">קבל קוד</h3>
              <p className="text-slate-300 text-sm">
                קוד בן 4 ספרות במסך וב-SMS
              </p>
            </div>
          </div>
        </div>

        {/* Service Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
            <div className="text-center">
              <div className="text-4xl mb-3">🛍️</div>
              <h3 className="text-white font-bold mb-3">קניית מוצר</h3>
              <ul className="text-green-200 text-sm space-y-1 text-right">
                <li>• אוכל ושתייה</li>
                <li>• גאדג'טים ואביזרים</li>
                <li>• קוסמטיקה</li>
                <li>• תשלום חד פעמי</li>
                <li>• קבלה מיידית</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
            <div className="text-center">
              <div className="text-4xl mb-3">⏳</div>
              <h3 className="text-white font-bold mb-3">השכרת מוצר</h3>
              <ul className="text-blue-200 text-sm space-y-1 text-right">
                <li>• ציוד ספורט</li>
                <li>• ציוד צילום</li>
                <li>• גאדג'טים</li>
                <li>• תשלום לפי שעות</li>
                <li>• החזרה חובה</li>
              </ul>
            </div>
          </div>

          <div className="bg-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
            <div className="text-center">
              <div className="text-4xl mb-3">🔐</div>
              <h3 className="text-white font-bold mb-3">השכרת לוקר</h3>
              <ul className="text-purple-200 text-sm space-y-1 text-right">
                <li>• 4 גדלים שונים</li>
                <li>• גישה 24/7</li>
                <li>• שמירה בטוחה</li>
                <li>• תשלום לפי זמן</li>
                <li>• תזכורות SMS</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">❓</span>
            שאלות נפוצות
          </h2>

          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">איך אני פותח את הלוקר?</h3>
              <p className="text-slate-300 text-sm">
                לאחר התשלום תקבל קוד בן 4 ספרות. הזן את הקוד במסך הלוקר והוא ייפתח אוטומטית. 
                הקוד נשלח גם ב-SMS לטלפון שלך.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">מה קורה אם אשכח את הקוד?</h3>
              <p className="text-slate-300 text-sm">
                הקוד נשמר במערכת ונשלח ב-SMS. תוכל לבקש שליחה מחדש או לפנות לתמיכה. 
                בעתיד נוסיף גם אפשרות פתיחה עם QR Code.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">איך עובד התשלום בהשכרה?</h3>
              <p className="text-slate-300 text-sm">
                בהשכרת מוצרים משלמים פיקדון + דמי השכרה. הפיקדון מוחזר בהחזרת המוצר במצב תקין. 
                איחור בהחזרה גורר תשלום נוסף.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">מה הזמינות של הלוקרים?</h3>
              <p className="text-slate-300 text-sm">
                הלוקרים פעילים 24/7. המערכת מעודכנת בזמן אמת ומציגה רק לוקרים זמינים. 
                ניתן לגשת אליהם בכל שעה ביממה.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">איזה אמצעי תשלום מקבלים?</h3>
              <p className="text-slate-300 text-sm">
                כרטיסי אשראי (ויזה, מאסטרקארד, אמריקן אקספרס) וארנקים דיגיטליים 
                (Apple Pay, Google Pay, PayPal). בעתיד נוסיף תשלום במזומן.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-bold mb-2">מה קורה אם הלוקר לא נפתח?</h3>
              <p className="text-slate-300 text-sm">
                נסה להזין את הקוד שוב. אם זה לא עוזר, פנה לתמיכה טכנית. 
                יש לנו מערכת ניטור 24/7 ונוכל לפתוח את הלוקר מרחוק.
              </p>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">🕒</span>
            זמני פעילות
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-bold mb-2">לוקרים</h3>
              <p className="text-green-200">פעילים 24/7 - גישה בכל עת</p>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-2">תמיכה טכנית</h3>
              <p className="text-green-200">
                ראשון-חמישי: 08:00-20:00<br/>
                שישי: 08:00-15:00<br/>
                שבת: סגור
              </p>
            </div>
          </div>
        </div>

        {/* Payment Policy */}
        <div className="bg-yellow-500/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">💳</span>
            מדיניות תשלומים
          </h2>
          
          <ul className="text-yellow-200 space-y-2 text-sm">
            <li>• <strong>קנייה:</strong> תשלום מלא מראש, ללא החזרים</li>
            <li>• <strong>השכרת מוצר:</strong> פיקדון + דמי השכרה, הפיקדון מוחזר</li>
            <li>• <strong>השכרת לוקר:</strong> תשלום מראש לפי התקופה</li>
            <li>• <strong>איחורים:</strong> תשלום נוסף לפי התעריף</li>
            <li>• <strong>ביטול:</strong> ללא ביטולים לאחר התשלום</li>
            <li>• <strong>החזרים:</strong> רק במקרה של תקלה טכנית</li>
          </ul>
        </div>

        {/* Security */}
        <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">🔒</span>
            אבטחה ובטיחות
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-bold mb-2">אבטחת מידע</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• הצפנת SSL לכל התשלומים</li>
                <li>• אין שמירה של פרטי כרטיס אשראי</li>
                <li>• קודי גישה ייחודיים לכל עסקה</li>
                <li>• מערכת ניטור 24/7</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-2">אבטחה פיזית</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• מצלמות אבטחה בכל הלוקרים</li>
                <li>• נעילה אלקטרונית מתקדמת</li>
                <li>• חיישני פריצה ותנועה</li>
                <li>• גיבוי חשמל לכל המערכות</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">📞</span>
            פרטי יצירת קשר
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">📧</div>
              <h3 className="text-white font-bold mb-1">אימייל</h3>
              <p className="text-purple-200 text-sm">support@lockers.co.il</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="text-white font-bold mb-1">טלפון</h3>
              <p className="text-purple-200 text-sm">03-1234567</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="text-white font-bold mb-1">צ'אט</h3>
              <p className="text-purple-200 text-sm">זמין באתר בשעות העבודה</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/business/help">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                יצירת קשר לתמיכה
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען מידע...</div>
      </div>
    }>
      <InfoContent />
    </Suspense>
  );
} 