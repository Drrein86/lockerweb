'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Package {
  id: string
  trackingCode: string
  description: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE'
  lockerLocation: string
  cellNumber: number
  arrivalDate: string
  status: 'PENDING' | 'DELIVERED' | 'COLLECTED'
  senderName: string
  qrCode: string
}

interface Notification {
  id: string
  type: 'SMS' | 'EMAIL' | 'PUSH'
  message: string
  timestamp: string
  isRead: boolean
}

export default function CustomerDemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const router = useRouter()

  // נתונים דמה
  const demoPackages: Package[] = [
    {
      id: '1',
      trackingCode: 'LW001234',
      description: 'אוזניות Bluetooth',
      size: 'SMALL',
      lockerLocation: 'כניסה ראשית - קומה 1',
      cellNumber: 5,
      arrivalDate: '2024-01-15',
      status: 'DELIVERED',
      senderName: 'Amazon Israel',
      qrCode: 'QR_LW001234'
    },
    {
      id: '2',
      trackingCode: 'LW001235',
      description: 'ספר "שיטות תכנות"',
      size: 'MEDIUM',
      lockerLocation: 'כניסה ראשית - קומה 1',
      cellNumber: 12,
      arrivalDate: '2024-01-16',
      status: 'DELIVERED',
      senderName: 'ספריית סטימצקי',
      qrCode: 'QR_LW001235'
    },
    {
      id: '3',
      trackingCode: 'LW001236',
      description: 'נעלי ספורט Nike',
      size: 'LARGE',
      lockerLocation: 'כניסה ראשית - קומה 1',
      cellNumber: 8,
      arrivalDate: '2024-01-17',
      status: 'PENDING',
      senderName: 'Nike Store',
      qrCode: 'QR_LW001236'
    }
  ]

  const demoNotifications: Notification[] = [
    {
      id: '1',
      type: 'SMS',
      message: '📦 החבילה שלך מ-Amazon הגיעה! קוד: LW001234',
      timestamp: '2024-01-15T14:30:00Z',
      isRead: false
    },
    {
      id: '2',
      type: 'EMAIL',
      message: '📚 ספר "שיטות תכנות" מחכה לך בתא 12',
      timestamp: '2024-01-16T09:15:00Z',
      isRead: true
    },
    {
      id: '3',
      type: 'PUSH',
      message: '👟 נעלי הספורט מ-Nike הגיעו! איסוף במיקום: כניסה ראשית',
      timestamp: '2024-01-17T11:45:00Z',
      isRead: false
    }
  ]

  useEffect(() => {
    setNotifications(demoNotifications)
  }, [])

  const steps = [
    {
      title: 'התראות על חבילות',
      description: 'קבלת הודעות SMS/אימייל על הגעת החבילות',
      icon: '📱',
      color: 'from-blue-500 to-purple-600'
    },
    {
      title: 'רשימת החבילות',
      description: 'צפייה בחבילות הממתינות לאיסוף',
      icon: '📦',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'איסוף חבילה',
      description: 'סריקת QR קוד ופתיחת התא',
      icon: '🔓',
      color: 'from-pink-500 to-red-600'
    },
    {
      title: 'השלמת האיסוף',
      description: 'אישור איסוף ועדכון הסטטוס',
      icon: '✅',
      color: 'from-green-500 to-blue-600'
    }
  ]

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg)
    setCurrentStep(2)
  }

  const handleScanCode = () => {
    setShowScanner(true)
    // סימולציה של סריקה
    setTimeout(() => {
      setScannedCode(selectedPackage?.qrCode || '')
      setShowScanner(false)
      handleUnlock()
    }, 2000)
  }

  const handleUnlock = async () => {
    setIsUnlocking(true)
    // סימולציה של פתיחת תא
    setTimeout(() => {
      setIsUnlocking(false)
      setShowCelebration(true)
      setCurrentStep(3)
      
      // עדכון סטטוס החבילה
      if (selectedPackage) {
        selectedPackage.status = 'COLLECTED'
      }
      
      setTimeout(() => {
        setShowCelebration(false)
      }, 3000)
    }, 3000)
  }

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'SMALL': return '📦'
      case 'MEDIUM': return '📫'
      case 'LARGE': return '🗃️'
      default: return '📦'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400'
      case 'DELIVERED': return 'text-green-400'
      case 'COLLECTED': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'בדרך'
      case 'DELIVERED': return 'הגיעה'
      case 'COLLECTED': return 'נאספה'
      default: return 'לא ידוע'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* רקע אנימציה */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* כוכבים */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.8, 0.1],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
            <button
              onClick={() => router.push('/demo')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm sm:text-base"
            >
              <span>←</span>
              <span>חזרה לדף הבחירה</span>
            </button>
            <div className="text-xl sm:text-2xl">👤</div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mb-2 sm:mb-4">
            לקוח דמה
          </h1>
          <p className="text-white/80 text-base sm:text-lg mb-4 sm:mb-8">
            התנסו במסע המלא של לקוח במערכת הלוקרים החכמה
          </p>

          {/* Progress Bar */}
          <div className="max-w-full sm:max-w-4xl mx-auto mb-4 sm:mb-8 px-1">
            <div className="flex justify-between items-center relative overflow-x-auto scrollbar-thin scrollbar-thumb-blue-400/30 scrollbar-track-transparent">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
              {steps.map((step, index) => (
                <div key={index} className="relative z-10 min-w-[60px] sm:min-w-[80px]">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl transition-all duration-500 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                      : 'bg-white/20 text-white/40'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="absolute top-10 sm:top-16 left-1/2 transform -translate-x-1/2 text-center w-24 sm:w-32">
                    <div className="text-white/90 font-medium text-xs sm:text-sm">{step.title}</div>
                    <div className="text-white/60 text-[10px] sm:text-xs mt-1 max-w-32">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">📱</div>
                  <h2 className="text-2xl font-bold text-white">התראות על חבילות</h2>
                </div>
                
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border transition-all duration-300 ${
                        notification.isRead 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-blue-500/20 border-blue-400/50 ring-2 ring-blue-400/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {notification.type === 'SMS' ? '💬' : notification.type === 'EMAIL' ? '📧' : '🔔'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white/80">
                              {notification.type}
                            </span>
                            <span className="text-xs text-white/60">
                              {new Date(notification.timestamp).toLocaleString('he-IL')}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-white">{notification.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    המשך לרשימת החבילות →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="packages"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">📦</div>
                  <h2 className="text-2xl font-bold text-white">החבילות שלי</h2>
                </div>
                
                <div className="grid gap-2 sm:gap-6">
                  {demoPackages.map((pkg) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">
                            {getSizeIcon(pkg.size)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{pkg.description}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pkg.status)} bg-white/10`}>
                                {getStatusText(pkg.status)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
                              <div>
                                <span className="text-white/50">קוד מעקב:</span>
                                <span className="text-white ml-2 font-mono">{pkg.trackingCode}</span>
                              </div>
                              <div>
                                <span className="text-white/50">שולח:</span>
                                <span className="text-white ml-2">{pkg.senderName}</span>
                              </div>
                              <div>
                                <span className="text-white/50">מיקום:</span>
                                <span className="text-white ml-2">{pkg.lockerLocation}</span>
                              </div>
                              <div>
                                <span className="text-white/50">תא:</span>
                                <span className="text-white ml-2">#{pkg.cellNumber}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {pkg.status === 'DELIVERED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePackageSelect(pkg)
                            }}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                          >
                            איסוף →
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && selectedPackage && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">🔓</div>
                  <h2 className="text-2xl font-bold text-white">איסוף חבילה</h2>
                </div>
                
                <div className="text-center mb-8">
                  <div className="bg-white/5 rounded-xl p-3 sm:p-6 border border-white/10 mb-4 sm:mb-6">
                    <div className="text-3xl mb-2 sm:mb-4">{getSizeIcon(selectedPackage.size)}</div>
                    <h3 className="text-base sm:text-xl font-semibold text-white mb-1 sm:mb-2">{selectedPackage.description}</h3>
                    <div className="text-white/70 space-y-1 text-xs sm:text-base">
                      <p>קוד מעקב: <span className="font-mono text-white">{selectedPackage.trackingCode}</span></p>
                      <p>מיקום: <span className="text-white">{selectedPackage.lockerLocation}</span></p>
                      <p>תא: <span className="text-white">#{selectedPackage.cellNumber}</span></p>
                    </div>
                  </div>
                  
                  {!showScanner && !isUnlocking && (
                    <button
                      onClick={handleScanCode}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-8 py-2 sm:py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-xs sm:text-base"
                    >
                      📱 סרוק QR קוד
                    </button>
                  )}
                  
                  {showScanner && (
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 sm:p-8 border border-purple-400/30">
                      <div className="text-6xl mb-4 animate-pulse">📱</div>
                      <h3 className="text-xl font-semibold text-white mb-2">סורק QR קוד...</h3>
                      <p className="text-white/70">הנח את הטלפון מול הקוד על הלוקר</p>
                      <div className="mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      </div>
                    </div>
                  )}
                  
                  {isUnlocking && (
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 sm:p-8 border border-green-400/30">
                      <div className="text-6xl mb-4 animate-bounce">🔓</div>
                      <h3 className="text-xl font-semibold text-white mb-2">פותח תא...</h3>
                      <p className="text-white/70">התא נפתח בעוד רגע</p>
                      <div className="mt-4">
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
                <div className="text-8xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">איסוף הושלם בהצלחה!</h2>
                <p className="text-white/80 text-lg mb-8">
                  החבילה נאספה בהצלחה. תודה שהשתמשת במערכת הלוקרים החכמה!
                </p>
                
                <div className="bg-green-500/20 rounded-xl p-3 sm:p-6 border border-green-400/30 mb-4 sm:mb-8">
                  <div className="text-2xl mb-1 sm:mb-2">✅</div>
                  <h3 className="text-base sm:text-lg font-semibold text-green-400 mb-1 sm:mb-2">פרטי האיסוף</h3>
                  <div className="text-white/80 space-y-1 text-xs sm:text-base">
                    <p>חבילה: {selectedPackage?.description}</p>
                    <p>תאריך איסוף: {new Date().toLocaleDateString('he-IL')}</p>
                    <p>שעת איסוף: {new Date().toLocaleTimeString('he-IL')}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                  <button
                    onClick={() => {
                      setCurrentStep(1)
                      setSelectedPackage(null)
                    }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    חזרה לרשימת החבילות
                  </button>
                  <button
                    onClick={() => router.push('/demo')}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 border border-white/20"
                  >
                    חזרה לדף הבחירה
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration Effect */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-4xl"
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    scale: 0,
                  }}
                  animate={{
                    y: window.innerHeight + 100,
                    scale: [0, 1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 2,
                    ease: "easeOut",
                  }}
                >
                  🎉
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 