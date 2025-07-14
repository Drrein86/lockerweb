'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const [selectedMode, setSelectedMode] = useState<'customer' | 'admin' | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  // עיצוב מרהיב עם אנימציות
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }



  const handleModeSelect = (mode: 'customer' | 'admin') => {
    setSelectedMode(mode)
    setShowLogin(true)
  }

  const handleDirectAccess = () => {
    if (selectedMode === 'customer') {
      router.push('/demo/customer')
    } else if (selectedMode === 'admin') {
      router.push('/demo/admin')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* רקע אנימציה */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* כוכבים נוצצים */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!showLogin ? (
            // דף בחירת מצב
            <motion.div
              key="selection"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="min-h-screen flex flex-col items-center justify-center"
            >
              {/* כותרת ראשית */}
              <motion.div
                variants={itemVariants}
                className="text-center mb-16"
              >
                <motion.h1 
                  className="text-6xl md:text-8xl font-black text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 bg-clip-text mb-6"
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  LockerWeb
                </motion.h1>
                <motion.p 
                  className="text-xl md:text-2xl text-white/80 font-light max-w-2xl mx-auto leading-relaxed"
                  variants={itemVariants}
                >
                  מערכת לוקרים חכמה ומתקדמת לעתיד הלוגיסטיקה
                </motion.p>
                <motion.div
                  variants={itemVariants}
                  className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full border border-purple-400/30 backdrop-blur-sm inline-block"
                >
                  <span className="text-purple-300 font-medium">🚀 הדגמה אינטראקטיבית</span>
                </motion.div>
              </motion.div>

              {/* בחירת מצב */}
              <motion.div
                variants={itemVariants}
                className="grid md:grid-cols-2 gap-8 max-w-4xl w-full"
              >
                {/* מצב לקוח */}
                <motion.div
                  onClick={() => handleModeSelect('customer')}
                  className="group relative cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl blur-xl transition-all duration-500 group-hover:blur-2xl"></div>
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-500">
                    <div className="text-center">
                      <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                        👤
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">
                        חווית לקוח
                      </h3>
                      <p className="text-white/70 mb-6 leading-relaxed">
                        התנסו במסע המלא של לקוח - קבלת הודעות, איסוף חבילות ופתיחת תאים
                      </p>
                      <div className="space-y-2 text-sm text-white/60">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          <span>קבלת הודעות SMS</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          <span>סריקת QR קוד</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                          <span>פתיחת תא בזמן אמת</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* מצב אדמין */}
                <motion.div
                  onClick={() => handleModeSelect('admin')}
                  className="group relative cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl blur-xl transition-all duration-500 group-hover:blur-2xl"></div>
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-purple-400/50 transition-all duration-500">
                    <div className="text-center">
                      <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                        👨‍💼
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">
                        ממשק אדמין
                      </h3>
                      <p className="text-white/70 mb-6 leading-relaxed">
                        נהלו את המערכת - הכנסת חבילות, שיוך לתאים ובקרה מלאה על הלוקרים
                      </p>
                      <div className="space-y-2 text-sm text-white/60">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          <span>הוספת חבילות</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                          <span>שיוך לתאים</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          <span>ניהול מלא</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* פיצרים */}
              <motion.div
                variants={itemVariants}
                className="mt-16 text-center"
              >
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="text-3xl mb-3">🚀</div>
                    <h4 className="text-white font-semibold mb-2">טכנולוגיה מתקדמת</h4>
                    <p className="text-white/60 text-sm">WebSocket, עדכונים בזמן אמת</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="text-3xl mb-3">📱</div>
                    <h4 className="text-white font-semibold mb-2">ממשק נוח</h4>
                    <p className="text-white/60 text-sm">עיצוב רספונסיבי ואינטואיטיבי</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="text-3xl mb-3">🔒</div>
                    <h4 className="text-white font-semibold mb-2">אבטחה מתקדמת</h4>
                    <p className="text-white/60 text-sm">הצפנה וקודים ייחודיים</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            // דף התחברות
            <motion.div
              key="login"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="min-h-screen flex flex-col items-center justify-center"
            >
              <motion.div
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full mx-4"
              >
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">
                    {selectedMode === 'customer' ? '👤' : '👨‍💼'}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedMode === 'customer' ? 'כניסת לקוח' : 'כניסת אדמין'}
                  </h2>
                  <p className="text-white/70">
                    {selectedMode === 'customer' 
                      ? 'הכנסו פרטים או לחצו כניסה ישירה' 
                      : 'הכנסו נתוני אדמין או לחצו כניסה ישירה'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">
                      {selectedMode === 'customer' ? 'מספר טלפון' : 'שם משתמש'}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={selectedMode === 'customer' ? '050-1234567' : 'admin'}
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">סיסמה</label>
                    <input
                      type="password"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleDirectAccess}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      🚀 כניסה ישירה (הדגמה)
                    </button>
                    
                    <button
                      onClick={handleDirectAccess}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-white/20 hover:border-white/40"
                    >
                      כניסה רגילה
                    </button>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowLogin(false)}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    ← חזרה לבחירת מצב
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 