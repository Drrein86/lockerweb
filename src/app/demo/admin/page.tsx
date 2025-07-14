'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Package {
  id: string
  trackingCode: string
  description: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE'
  customerName: string
  customerPhone: string
  senderName: string
  status: 'PENDING' | 'ASSIGNED' | 'DELIVERED' | 'COLLECTED'
  cellNumber?: number
  lockerLocation?: string
  assignedAt?: string
  deliveredAt?: string
}

interface Cell {
  id: number
  cellNumber: number
  size: 'SMALL' | 'MEDIUM' | 'LARGE'
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  hasPackage: boolean
  packageId?: string
  isLocked: boolean
}

interface Locker {
  id: number
  name: string
  location: string
  status: 'ONLINE' | 'OFFLINE'
  cells: Cell[]
}

export default function AdminDemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [showAddPackage, setShowAddPackage] = useState(false)
  const [showAssignCell, setShowAssignCell] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const router = useRouter()

  // נתונים דמה
  const demoPackages: Package[] = [
    {
      id: '1',
      trackingCode: 'LW001237',
      description: 'משקפי שמש Ray-Ban',
      size: 'SMALL',
      customerName: 'יוסי כהן',
      customerPhone: '050-1234567',
      senderName: 'אופטיקה הדר',
      status: 'PENDING'
    },
    {
      id: '2',
      trackingCode: 'LW001238',
      description: 'תיק גב לטיולים',
      size: 'LARGE',
      customerName: 'מירי לוי',
      customerPhone: '052-9876543',
      senderName: 'ספורט אקטיב',
      status: 'ASSIGNED',
      cellNumber: 15,
      lockerLocation: 'כניסה ראשית - קומה 1',
      assignedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '3',
      trackingCode: 'LW001239',
      description: 'ספר קוקינה איטלקית',
      size: 'MEDIUM',
      customerName: 'דני גולדברג',
      customerPhone: '054-5555555',
      senderName: 'ספריית צומת',
      status: 'DELIVERED',
      cellNumber: 8,
      lockerLocation: 'כניסה ראשית - קומה 1',
      assignedAt: '2024-01-14T14:20:00Z',
      deliveredAt: '2024-01-14T16:45:00Z'
    }
  ]

  const demoLocker: Locker = {
    id: 1,
    name: 'לוקר ראשי',
    location: 'כניסה ראשית - קומה 1',
    status: 'ONLINE',
    cells: [
      { id: 1, cellNumber: 1, size: 'SMALL', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 2, cellNumber: 2, size: 'SMALL', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 3, cellNumber: 3, size: 'MEDIUM', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 4, cellNumber: 4, size: 'MEDIUM', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 5, cellNumber: 5, size: 'LARGE', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 6, cellNumber: 6, size: 'LARGE', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 7, cellNumber: 7, size: 'SMALL', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 8, cellNumber: 8, size: 'MEDIUM', status: 'OCCUPIED', hasPackage: true, isLocked: true, packageId: '3' },
      { id: 9, cellNumber: 9, size: 'LARGE', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 10, cellNumber: 10, size: 'SMALL', status: 'MAINTENANCE', hasPackage: false, isLocked: false },
      { id: 11, cellNumber: 11, size: 'MEDIUM', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 12, cellNumber: 12, size: 'LARGE', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 13, cellNumber: 13, size: 'SMALL', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 14, cellNumber: 14, size: 'MEDIUM', status: 'AVAILABLE', hasPackage: false, isLocked: false },
      { id: 15, cellNumber: 15, size: 'LARGE', status: 'OCCUPIED', hasPackage: true, isLocked: true, packageId: '2' },
      { id: 16, cellNumber: 16, size: 'SMALL', status: 'AVAILABLE', hasPackage: false, isLocked: false },
    ]
  }

  const [locker, setLocker] = useState<Locker>(demoLocker)

  useEffect(() => {
    setPackages(demoPackages)
  }, [])

  const steps = [
    {
      title: 'הוספת חבילה',
      description: 'קלט פרטי חבילה חדשה למערכת',
      icon: '📦',
      color: 'from-blue-500 to-purple-600'
    },
    {
      title: 'שיוך לתא',
      description: 'בחירת תא מתאים לפי הגודל',
      icon: '🏠',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'הכנסה לתא',
      description: 'פתיחת התא והכנסת החבילה',
      icon: '🔓',
      color: 'from-pink-500 to-red-600'
    },
    {
      title: 'שליחת הודעה',
      description: 'יצירת הודעה ללקוח',
      icon: '📱',
      color: 'from-green-500 to-blue-600'
    }
  ]

  const [newPackage, setNewPackage] = useState({
    description: '',
    size: 'MEDIUM' as 'SMALL' | 'MEDIUM' | 'LARGE',
    customerName: '',
    customerPhone: '',
    senderName: ''
  })

  const handleAddPackage = () => {
    if (!newPackage.description || !newPackage.customerName || !newPackage.customerPhone) {
      alert('נא למלא את כל השדות הנדרשים')
      return
    }

    const packageId = (packages.length + 1).toString()
    const trackingCode = `LW00${String(packageId).padStart(4, '0')}`
    
    const pkg: Package = {
      id: packageId,
      trackingCode,
      description: newPackage.description,
      size: newPackage.size,
      customerName: newPackage.customerName,
      customerPhone: newPackage.customerPhone,
      senderName: newPackage.senderName,
      status: 'PENDING'
    }

    setPackages([...packages, pkg])
    setSelectedPackage(pkg)
    setNewPackage({
      description: '',
      size: 'MEDIUM',
      customerName: '',
      customerPhone: '',
      senderName: ''
    })
    setShowAddPackage(false)
    setCurrentStep(1)
  }

  const handleSelectCell = (cell: Cell) => {
    if (cell.status !== 'AVAILABLE') return
    if (!selectedPackage) return
    
    // בדיקת התאמת גודל
    if (cell.size !== selectedPackage.size) {
      if (!(cell.size === 'LARGE' && selectedPackage.size === 'MEDIUM') &&
          !(cell.size === 'LARGE' && selectedPackage.size === 'SMALL') &&
          !(cell.size === 'MEDIUM' && selectedPackage.size === 'SMALL')) {
        alert('גודל התא לא מתאים לגודל החבילה')
        return
      }
    }

    setSelectedCell(cell)
    setShowAssignCell(true)
  }

  const handleAssignToCell = async () => {
    if (!selectedPackage || !selectedCell) return
    
    setIsProcessing(true)
    
    // סימולציה של פתיחת תא
    setTimeout(() => {
      // עדכון החבילה
      const updatedPackages = packages.map(pkg => 
        pkg.id === selectedPackage.id 
          ? {
              ...pkg,
              status: 'ASSIGNED' as const,
              cellNumber: selectedCell.cellNumber,
              lockerLocation: locker.location,
              assignedAt: new Date().toISOString()
            }
          : pkg
      )
      setPackages(updatedPackages)
      setSelectedPackage(updatedPackages.find(p => p.id === selectedPackage.id) || null)

      // עדכון התא
      const updatedCells = locker.cells.map(cell => 
        cell.id === selectedCell.id
          ? {
              ...cell,
              status: 'OCCUPIED' as const,
              hasPackage: true,
              packageId: selectedPackage.id,
              isLocked: true
            }
          : cell
      )
      setLocker({ ...locker, cells: updatedCells })

      setIsProcessing(false)
      setShowAssignCell(false)
      setCurrentStep(2)
    }, 2000)
  }

  const handleConfirmDelivery = () => {
    if (!selectedPackage) return
    
    const updatedPackages = packages.map(pkg => 
      pkg.id === selectedPackage.id 
        ? {
            ...pkg,
            status: 'DELIVERED' as const,
            deliveredAt: new Date().toISOString()
          }
        : pkg
    )
    setPackages(updatedPackages)
    setSelectedPackage(updatedPackages.find(p => p.id === selectedPackage.id) || null)
    setCurrentStep(3)
  }

  const handleSendNotification = () => {
    const message = `📦 חבילה מ-${selectedPackage?.senderName} הגיעה! קוד: ${selectedPackage?.trackingCode}. מיקום: ${selectedPackage?.lockerLocation}, תא ${selectedPackage?.cellNumber}`
    setNotificationMessage(message)
    setShowNotification(true)
    
    setTimeout(() => {
      setShowNotification(false)
      setCurrentStep(0)
      setSelectedPackage(null)
      setSelectedCell(null)
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

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'SMALL': return 'text-blue-400'
      case 'MEDIUM': return 'text-purple-400'
      case 'LARGE': return 'text-pink-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400 bg-yellow-500/20'
      case 'ASSIGNED': return 'text-blue-400 bg-blue-500/20'
      case 'DELIVERED': return 'text-green-400 bg-green-500/20'
      case 'COLLECTED': return 'text-purple-400 bg-purple-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'ממתין לשיוך'
      case 'ASSIGNED': return 'שויך לתא'
      case 'DELIVERED': return 'הועבר ללוקר'
      case 'COLLECTED': return 'נאסף'
      default: return 'לא ידוע'
    }
  }

  const getCellStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500/20 border-green-400/50'
      case 'OCCUPIED': return 'bg-red-500/20 border-red-400/50'
      case 'MAINTENANCE': return 'bg-yellow-500/20 border-yellow-400/50'
      default: return 'bg-gray-500/20 border-gray-400/50'
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
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
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
            <div className="text-xl sm:text-2xl">👨‍💼</div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-2 sm:mb-4">
            אדמין דמה
          </h1>
          <p className="text-white/80 text-base sm:text-lg mb-4 sm:mb-8">
            נהלו את המערכת - הוספת חבילות, שיוך לתאים ובקרה מלאה
          </p>

          {/* Progress Bar */}
          <div className="max-w-full sm:max-w-4xl mx-auto mb-4 sm:mb-8 px-1">
            <div className="flex justify-between items-center relative overflow-x-auto scrollbar-thin scrollbar-thumb-purple-400/30 scrollbar-track-transparent">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
              {steps.map((step, index) => (
                <div key={index} className="relative z-10 min-w-[60px] sm:min-w-[80px]">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl transition-all duration-500 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
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
              key="add-package"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">📦</div>
                  <h2 className="text-2xl font-bold text-white">ניהול חבילות</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  {/* רשימת חבילות קיימות */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">חבילות במערכת</h3>
                    <div className="space-y-2 sm:space-y-4 max-h-60 sm:max-h-96 overflow-y-auto pr-1">
                      {packages.map((pkg) => (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                            selectedPackage?.id === pkg.id 
                              ? 'bg-purple-500/20 border-purple-400/50' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                          onClick={() => setSelectedPackage(pkg)}
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">
                                {getSizeIcon(pkg.size)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-white">{pkg.description}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                                    {getStatusText(pkg.status)}
                                  </span>
                                </div>
                                <div className="text-xs sm:text-sm text-white/70">
                                  <p>קוד: {pkg.trackingCode}</p>
                                  <p>לקוח: {pkg.customerName}</p>
                                  {pkg.cellNumber && <p>תא: #{pkg.cellNumber}</p>}
                                </div>
                              </div>
                            </div>
                            
                            {pkg.status === 'ASSIGNED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPackage(pkg)
                                  setCurrentStep(2)
                                }}
                                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded-lg text-sm transition-all"
                              >
                                אישור הכנסה
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* הוספת חבילה חדשה */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">הוספת חבילה חדשה</h3>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-6 border border-white/10">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/70 text-sm mb-2">תיאור החבילה</label>
                          <input
                            type="text"
                            value={newPackage.description}
                            onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="לדוגמה: משקפי שמש Ray-Ban"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white/70 text-sm mb-2">גודל החבילה</label>
                          <select
                            value={newPackage.size}
                            onChange={(e) => setNewPackage({...newPackage, size: e.target.value as any})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="SMALL">קטן (📦)</option>
                            <option value="MEDIUM">בינוני (📫)</option>
                            <option value="LARGE">גדול (🗃️)</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white/70 text-sm mb-2">שם הלקוח</label>
                            <input
                              type="text"
                              value={newPackage.customerName}
                              onChange={(e) => setNewPackage({...newPackage, customerName: e.target.value})}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="שם מלא"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-white/70 text-sm mb-2">טלפון</label>
                            <input
                              type="tel"
                              value={newPackage.customerPhone}
                              onChange={(e) => setNewPackage({...newPackage, customerPhone: e.target.value})}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="050-1234567"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-white/70 text-sm mb-2">שם השולח</label>
                          <input
                            type="text"
                            value={newPackage.senderName}
                            onChange={(e) => setNewPackage({...newPackage, senderName: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="שם החנות/השולח"
                          />
                        </div>
                        
                        <button
                          onClick={handleAddPackage}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                        >
                          ➕ הוסף חבילה
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && selectedPackage && (
            <motion.div
              key="select-cell"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-6xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">🏠</div>
                  <h2 className="text-2xl font-bold text-white">בחירת תא</h2>
                </div>
                
                <div className="mb-6">
                  <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-400/30">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getSizeIcon(selectedPackage.size)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{selectedPackage.description}</h3>
                        <p className="text-white/70">גודל: {selectedPackage.size} | לקוח: {selectedPackage.customerName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span>פנוי</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span>תפוס</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span>תחזוקה</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-4">
                  {locker.cells.map((cell) => (
                    <motion.div
                      key={cell.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`aspect-square rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        getCellStatusColor(cell.status)
                      } ${
                        cell.status === 'AVAILABLE' 
                          ? 'hover:scale-105 hover:bg-white/10' 
                          : 'cursor-not-allowed opacity-60'
                      }`}
                      onClick={() => handleSelectCell(cell)}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-1 sm:p-2">
                        <div className="text-2xl mb-1">{getSizeIcon(cell.size)}</div>
                        <div className="text-xs sm:text-base font-bold text-white">#{cell.cellNumber}</div>
                        <div className={`text-[10px] sm:text-xs ${getSizeColor(cell.size)}`}>{cell.size}</div>
                        {cell.hasPackage && (
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-1"></div>
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
              key="insert-package"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">🔓</div>
                  <h2 className="text-2xl font-bold text-white">הכנסת חבילה לתא</h2>
                </div>
                
                <div className="text-center">
                  <div className="bg-white/5 rounded-xl p-3 sm:p-6 border border-white/10 mb-4 sm:mb-6">
                    <div className="text-3xl mb-2 sm:mb-4">{getSizeIcon(selectedPackage.size)}</div>
                    <h3 className="text-base sm:text-xl font-semibold text-white mb-1 sm:mb-2">{selectedPackage.description}</h3>
                    <div className="text-white/70 space-y-1 text-xs sm:text-base">
                      <p>לקוח: {selectedPackage.customerName}</p>
                      <p>טלפון: {selectedPackage.customerPhone}</p>
                      {selectedPackage.cellNumber && <p>תא: #{selectedPackage.cellNumber}</p>}
                    </div>
                  </div>
                  
                  {selectedPackage.status === 'ASSIGNED' && !isProcessing && (
                    <div className="space-y-2 sm:space-y-4">
                      <div className="bg-green-500/20 rounded-xl p-4 border border-green-400/30">
                        <div className="text-2xl mb-2">✅</div>
                        <h4 className="text-lg font-semibold text-green-400 mb-2">התא נפתח בהצלחה!</h4>
                        <p className="text-white/80">הכנס את החבילה לתא ולחץ על "אישור הכנסה"</p>
                      </div>
                      
                      <button
                        onClick={handleConfirmDelivery}
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-xs sm:text-base"
                      >
                        ✅ אישור הכנסה לתא
                      </button>
                    </div>
                  )}
                  
                  {selectedPackage.status === 'PENDING' && (
                    <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-400/30">
                      <div className="text-2xl mb-2">⏳</div>
                      <h4 className="text-lg font-semibold text-yellow-400 mb-2">חבילה לא שויכה לתא</h4>
                      <p className="text-white/80">נא לשייך קודם את החבילה לתא</p>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                      >
                        חזרה לבחירת תא
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && selectedPackage && (
            <motion.div
              key="send-notification"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">📱</div>
                  <h2 className="text-2xl font-bold text-white">שליחת הודעה ללקוח</h2>
                </div>
                
                <div className="text-center">
                  <div className="bg-white/5 rounded-xl p-3 sm:p-6 border border-white/10 mb-4 sm:mb-6">
                    <div className="text-3xl mb-2 sm:mb-4">✅</div>
                    <h3 className="text-base sm:text-xl font-semibold text-white mb-1 sm:mb-2">החבילה הוכנסה בהצלחה!</h3>
                    <div className="text-white/70 space-y-1 text-xs sm:text-base">
                      <p>חבילה: {selectedPackage.description}</p>
                      <p>תא: #{selectedPackage.cellNumber}</p>
                      <p>מיקום: {selectedPackage.lockerLocation}</p>
                      <p>לקוח: {selectedPackage.customerName}</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/20 rounded-xl p-3 sm:p-6 border border-blue-400/30 mb-4 sm:mb-6">
                    <div className="text-2xl mb-3">📨</div>
                    <h4 className="text-lg font-semibold text-blue-400 mb-3">תוכן ההודעה:</h4>
                    <div className="bg-white/10 rounded-lg p-2 sm:p-4 text-right">
                      <p className="text-white">
                        📦 חבילה מ-{selectedPackage.senderName} הגיעה!<br/>
                        קוד: {selectedPackage.trackingCode}<br/>
                        מיקום: {selectedPackage.lockerLocation}<br/>
                        תא: #{selectedPackage.cellNumber}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSendNotification}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-xs sm:text-base"
                  >
                    📱 שלח הודעת SMS
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Modal */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20 max-w-md w-full text-center"
              >
                <div className="text-6xl mb-2 sm:mb-4">📱</div>
                <h3 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-4">הודעה נשלחה!</h3>
                <div className="bg-green-500/20 rounded-lg p-2 sm:p-4 border border-green-400/30">
                  <p className="text-white text-sm">{notificationMessage}</p>
                </div>
                <div className="mt-4 text-white/70 text-sm">
                  הודעה נשלחה ללקוח {selectedPackage?.customerName} למספר {selectedPackage?.customerPhone}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assign Cell Modal */}
        <AnimatePresence>
          {showAssignCell && selectedCell && selectedPackage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20 max-w-md w-full"
              >
                <div className="text-center mb-3 sm:mb-6">
                  <div className="text-4xl mb-1 sm:mb-3">🔗</div>
                  <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2">אישור שיוך לתא</h3>
                </div>
                
                <div className="space-y-2 sm:space-y-4 mb-3 sm:mb-6">
                  <div className="bg-white/5 rounded-lg p-2 sm:p-4 border border-white/10">
                    <div className="text-center">
                      <div className="text-2xl mb-1 sm:mb-2">{getSizeIcon(selectedPackage.size)}</div>
                      <h4 className="font-semibold text-white">{selectedPackage.description}</h4>
                      <p className="text-white/70 text-sm">גודל: {selectedPackage.size}</p>
                    </div>
                  </div>
                  
                  <div className="text-center text-white/60 text-xs sm:text-base">↓</div>
                  
                  <div className="bg-white/5 rounded-lg p-2 sm:p-4 border border-white/10">
                    <div className="text-center">
                      <div className="text-2xl mb-1 sm:mb-2">{getSizeIcon(selectedCell.size)}</div>
                      <h4 className="font-semibold text-white">תא #{selectedCell.cellNumber}</h4>
                      <p className="text-white/70 text-sm">גודל: {selectedCell.size}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handleAssignToCell}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-xs sm:text-base"
                  >
                    {isProcessing ? 'פותח תא...' : '✅ אישור ופתיחה'}
                  </button>
                  <button
                    onClick={() => setShowAssignCell(false)}
                    disabled={isProcessing}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-xs sm:text-base"
                  >
                    ביטול
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