'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'

// SVG Icons
const CheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3H21L19 13H5L3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3L1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 13V21H17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UnlockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7A5 5 0 0 1 17 7V8" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
)

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
    <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const TruckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="3" width="15" height="13" stroke="white" strokeWidth="2"/>
    <polygon points="16,8 20,8 23,11 23,16 16,16" stroke="white" strokeWidth="2"/>
    <circle cx="5.5" cy="18.5" r="2.5" stroke="white" strokeWidth="2"/>
    <circle cx="18.5" cy="18.5" r="2.5" stroke="white" strokeWidth="2"/>
  </svg>
)

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7V22H9V16H15V22H22V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function SuccessContent() {
  const searchParams = useSearchParams()
  const trackingCode = searchParams.get('trackingCode')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* הודעת הצלחה */}
        <div className="glass-card text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckIcon />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              החבילה הוזנה בהצלחה!
            </h1>
            <p className="text-white/70 text-lg">
              התא נפתח, הודעה נשלחה ללקוח
            </p>
          </div>

          {/* פרטי הצלחה */}
          <div className="bg-white/10 rounded-lg p-6 mb-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">
              סיכום התהליך
            </h3>
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-green-300">
                <PackageIcon />
                <span>החבילה נשמרה במערכת</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-300">
                <UnlockIcon />
                <span>התא נפתח בהצלחה</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-300">
                <EmailIcon />
                <span>הודעת אימייל נשלחה ללקוח</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-300">
                <LockIcon />
                <span>התא מוגדר כתפוס</span>
              </div>
            </div>
          </div>

          {/* קוד מעקב */}
          {trackingCode && (
            <div className="bg-purple-500/20 rounded-lg p-4 mb-6 border border-purple-400/30">
              <h4 className="font-semibold text-purple-300 mb-2">קוד מעקב</h4>
              <div className="font-mono text-xl bg-white/10 p-3 rounded border border-white/20 text-white">
                {trackingCode}
              </div>
            </div>
          )}

          {/* כפתורי פעולה */}
          <div className="space-y-3">
            <Link 
              href="/courier"
              className="btn-primary w-full text-lg py-3 inline-flex items-center justify-center gap-2"
            >
              <TruckIcon />
              הזן חבילה נוספת
            </Link>
            
            <Link 
              href="/"
              className="btn-secondary w-full text-lg py-3 inline-flex items-center justify-center gap-2"
            >
              <HomeIcon />
              חזרה לעמוד הראשי
            </Link>
          </div>

          {/* מעבר אוטומטי */}
          <div className="mt-6 text-sm text-white/60">
            מעבר אוטומטי לדף הראשי בעוד {countdown} שניות...
          </div>
        </div>

        {/* מידע נוסף */}
        <div className="mt-8 glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            טיפים לשליח
          </h3>
          <ul className="space-y-2 text-white/70">
            <li>• וודא שהחבילה הוכנסה לתא המתאים</li>
            <li>• התא ינעל אוטומטית לאחר מספר שניות</li>
            <li>• הלקוח יקבל הודעה עם פרטי האיסוף</li>
            <li>• ניתן לעקוב אחרי הסטטוס במערכת הניהול</li>
          </ul>
        </div>

        {/* סטטיסטיקות יומיות */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/30 text-white rounded-lg p-6 backdrop-blur">
          <h3 className="text-lg font-semibold mb-4">הסטטיסטיקות שלך היום</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-sm text-white/70">חבילות הוזנו</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">8</div>
              <div className="text-sm text-white/70">נאספו</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">67%</div>
              <div className="text-sm text-white/70">שיעור איסוף</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">טוען...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

// מעבר אוטומטי לעמוד הראשי לאחר 5 שניות
if (typeof window !== 'undefined') {
  setTimeout(() => {
    window.location.href = '/courier'
  }, 5000)
} 