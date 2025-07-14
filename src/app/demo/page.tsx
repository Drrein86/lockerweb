'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const [selectedMode, setSelectedMode] = useState<'customer' | 'admin' | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentParticle, setCurrentParticle] = useState(0)
  const router = useRouter()

  // מעקב מיקום עכבר לאפקטים
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // אנימציות מתקדמות
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { y: 60, opacity: 0, scale: 0.8 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        duration: 0.8
      }
    }
  }

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  const glowVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
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
      {/* רקע מתקדם עם אפקטים חזותיים */}
      <div className="absolute inset-0 overflow-hidden">
        {/* אורות נעים */}
        <motion.div 
          className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" as const
          }}
          style={{
            top: '10%',
            right: '10%',
          }}
        />
        
        <motion.div 
          className="absolute w-80 h-80 bg-blue-500/25 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 80, 0],
            y: [0, 60, -60, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 2
          }}
          style={{
            bottom: '20%',
            left: '15%',
          }}
        />

        <motion.div 
          className="absolute w-60 h-60 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 60, -60, 0],
            y: [0, -40, 40, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 4
          }}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* חלקיקים נוצצים מתקדמים */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(150)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut" as const
            }}
          />
        ))}
      </div>

      {/* אפקט מעקב עכבר */}
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: mousePosition.x - 192,
          y: mousePosition.y - 192,
        }}
        transition={{
          type: "spring",
          stiffness: 50,
          damping: 30
        }}
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!showLogin ? (
            // דף בחירת מצב משודרג
            <motion.div
              key="selection"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="min-h-screen flex flex-col items-center justify-center"
            >
              {/* כותרת ראשית משודרגת */}
              <motion.div
                variants={itemVariants}
                className="text-center mb-8 sm:mb-12 lg:mb-16"
              >
                <motion.h1 
                  className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 bg-clip-text mb-4 sm:mb-6"
                  variants={floatingVariants}
                  animate="animate"
                >
                  LockerWeb
                </motion.h1>
                
                <motion.div
                  variants={glowVariants}
                  animate="animate"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-3xl -z-10"
                />
                
                <motion.p 
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 font-light max-w-xs sm:max-w-2xl lg:max-w-4xl mx-auto leading-relaxed px-4"
                  variants={itemVariants}
                >
                  מערכת לוקרים חכמה ומתקדמת
                  <br />
                  <span className="text-purple-300 font-medium">לעתיד הלוגיסטיקה</span>
                </motion.p>
                
                <motion.div
                  variants={itemVariants}
                  className="mt-4 sm:mt-6 lg:mt-8 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full border border-purple-400/30 backdrop-blur-sm inline-block"
                >
                  <span className="text-sm sm:text-base lg:text-lg text-purple-300 font-medium">
                    🚀 הדגמה אינטראקטיבית
                  </span>
                </motion.div>
              </motion.div>

              {/* בחירת מצב משודרגת */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-sm sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl w-full px-4"
              >
                {/* מצב לקוח */}
                <motion.div
                  onClick={() => handleModeSelect('customer')}
                  className="group relative cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  variants={itemVariants}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/25 to-purple-600/25 rounded-2xl sm:rounded-3xl blur-xl transition-all duration-500 group-hover:blur-2xl"
                    variants={glowVariants}
                    animate="animate"
                  />
                  
                  <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/20 hover:border-blue-400/50 transition-all duration-500 group-hover:bg-white/15">
                    <div className="text-center">
                      <motion.div 
                        className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform duration-300"
                        variants={floatingVariants}
                        animate="animate"
                      >
                        👤
                      </motion.div>
                      
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
                        חווית לקוח
                      </h3>
                      
                      <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-4 sm:mb-6 leading-relaxed">
                        התנסו במסע המלא של לקוח - קבלת הודעות, איסוף חבילות ופתיחת תאים
                      </p>
                      
                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm lg:text-base text-white/70">
                        <motion.div 
                          className="flex items-center justify-center gap-2 sm:gap-3"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                          <span>קבלת הודעות SMS</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center justify-center gap-2 sm:gap-3"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                          <span>סריקת QR קוד</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center justify-center gap-2 sm:gap-3"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                          <span>פתיחת תא בזמן אמת</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* מצב אדמין */}
                <motion.div
                  onClick={() => handleModeSelect('admin')}
                  className="group relative cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  variants={itemVariants}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/25 to-pink-600/25 rounded-2xl sm:rounded-3xl blur-xl transition-all duration-500 group-hover:blur-2xl"
                    variants={glowVariants}
                    animate="animate"
                  />
                  
                  <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/20 hover:border-purple-400/50 transition-all duration-500 group-hover:bg-white/15">
                    <div className="text-center">
                      <motion.div 
                        className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform duration-300"
                        variants={floatingVariants}
                        animate="animate"
                      >
                        👨‍💼
                      </motion.div>
                      
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
                        ממשק אדמין
                      </h3>
                      
                      <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-4 sm:mb-6 leading-relaxed">
                        נהלו את המערכת - הכנסת חבילות, שיוך לתאים ובקרה מלאה על הלוקרים
                      </p>
                      
                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm lg:text-base text-white/70">
                        <motion.div 
                          className="flex items-center justify-center gap-2 sm:gap-3"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                          <span>הוספת חבילות</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center justify-center gap-2 sm:gap-3"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                          <span>שיוך לתאים</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center justify-center gap-2 sm:gap-3"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                          <span>ניהול מלא</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* פיצרים משודרגים */}
              <motion.div
                variants={itemVariants}
                className="mt-8 sm:mt-12 lg:mt-16 text-center w-full px-4"
              >
                <motion.h3 
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8"
                  variants={itemVariants}
                >
                  מה מייחד אותנו?
                </motion.h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-xs sm:max-w-2xl lg:max-w-6xl mx-auto">
                  <motion.div 
                    className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:border-white/40 transition-all duration-300 group"
                    whileHover={{ scale: 1.05, y: -10 }}
                    variants={itemVariants}
                  >
                    <motion.div 
                      className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4"
                      variants={floatingVariants}
                      animate="animate"
                    >
                      🚀
                    </motion.div>
                    <h4 className="text-base sm:text-lg lg:text-xl text-white font-semibold mb-2 sm:mb-3">
                      טכנולוגיה מתקדמת
                    </h4>
                    <p className="text-xs sm:text-sm lg:text-base text-white/70 leading-relaxed">
                      WebSocket, עדכונים בזמן אמת, ואינטגרציה מלאה
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:border-white/40 transition-all duration-300 group"
                    whileHover={{ scale: 1.05, y: -10 }}
                    variants={itemVariants}
                  >
                    <motion.div 
                      className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4"
                      variants={floatingVariants}
                      animate="animate"
                    >
                      📱
                    </motion.div>
                    <h4 className="text-base sm:text-lg lg:text-xl text-white font-semibold mb-2 sm:mb-3">
                      ממשק נוח
                    </h4>
                    <p className="text-xs sm:text-sm lg:text-base text-white/70 leading-relaxed">
                      עיצוב רספונסיבי, אינטואיטיבי וחדשני
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:border-white/40 transition-all duration-300 group sm:col-span-2 lg:col-span-1"
                    whileHover={{ scale: 1.05, y: -10 }}
                    variants={itemVariants}
                  >
                    <motion.div 
                      className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4"
                      variants={floatingVariants}
                      animate="animate"
                    >
                      🔒
                    </motion.div>
                    <h4 className="text-base sm:text-lg lg:text-xl text-white font-semibold mb-2 sm:mb-3">
                      אבטחה מתקדמת
                    </h4>
                    <p className="text-xs sm:text-sm lg:text-base text-white/70 leading-relaxed">
                      הצפנה, קודים ייחודיים ואבטחה מלאה
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            // דף התחברות משודרג
            <motion.div
              key="login"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="min-h-screen flex flex-col items-center justify-center px-4"
            >
              <motion.div
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/20 max-w-sm sm:max-w-md lg:max-w-lg w-full relative overflow-hidden"
              >
                {/* אפקט רקע */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl sm:rounded-3xl"
                  variants={glowVariants}
                  animate="animate"
                />
                
                <div className="relative z-10">
                  <div className="text-center mb-6 sm:mb-8">
                    <motion.div 
                      className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6"
                      variants={floatingVariants}
                      animate="animate"
                    >
                      {selectedMode === 'customer' ? '👤' : '👨‍💼'}
                    </motion.div>
                    
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">
                      {selectedMode === 'customer' ? 'כניסת לקוח' : 'כניסת אדמין'}
                    </h2>
                    
                    <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed">
                      {selectedMode === 'customer' 
                        ? 'הכנסו פרטים או לחצו כניסה ישירה' 
                        : 'הכנסו נתוני אדמין או לחצו כניסה ישירה'
                      }
                    </p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <motion.div variants={itemVariants}>
                      <label className="block text-white/80 text-sm sm:text-base mb-2 sm:mb-3">
                        {selectedMode === 'customer' ? 'מספר טלפון' : 'שם משתמש'}
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                        placeholder={selectedMode === 'customer' ? '050-1234567' : 'admin'}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-white/80 text-sm sm:text-base mb-2 sm:mb-3">
                        סיסמה
                      </label>
                      <input
                        type="password"
                        className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                        placeholder="••••••••"
                      />
                    </motion.div>

                    <motion.div 
                      className="space-y-3 sm:space-y-4 pt-4 sm:pt-6"
                      variants={itemVariants}
                    >
                      <motion.button
                        onClick={handleDirectAccess}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        🚀 כניסה ישירה (הדגמה)
                      </motion.button>
                      
                      <motion.button
                        onClick={handleDirectAccess}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40 text-sm sm:text-base"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        כניסה רגילה
                      </motion.button>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="mt-6 sm:mt-8 text-center"
                    variants={itemVariants}
                  >
                    <motion.button
                      onClick={() => setShowLogin(false)}
                      className="text-white/70 hover:text-white transition-colors text-sm sm:text-base"
                      whileHover={{ scale: 1.05 }}
                    >
                      ← חזרה לבחירת מצב
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 