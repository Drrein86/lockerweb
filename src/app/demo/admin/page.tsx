'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Package {
  id: string
  trackingCode: string
  description: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE'
  customerName: string
  customerPhone: string
  senderName: string
  status: 'PENDING' | 'ASSIGNED' | 'DELIVERED' | 'COLLECTED'
  cellNumber?: number
  lockerId?: number
  lockerLocation?: string
  assignedAt?: string
  deliveredAt?: string
}

interface Cell {
  id: number
  cellNumber: number
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE'
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  hasPackage: boolean
  packageId?: string
  isLocked: boolean
  content?: string
}

interface Locker {
  id: number
  name: string
  location: string
  status: 'ONLINE' | 'OFFLINE'
  cells: Cell[]
}

export default function AdminDemoPage() {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [showCellModal, setShowCellModal] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [lockers, setLockers] = useState<Locker[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const router = useRouter()

  // נתוני דמה משופרים
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
      lockerId: 1,
      lockerLocation: 'לוקר כניסה ראשית',
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
      lockerId: 2,
      lockerLocation: 'לוקר חניון',
      assignedAt: '2024-01-14T14:20:00Z',
      deliveredAt: '2024-01-14T16:45:00Z'
    },
    {
      id: '4',
      trackingCode: 'LW001240',
      description: 'מסך מחשב 24 אינץ',
      size: 'WIDE',
      customerName: 'אלי רוזן',
      customerPhone: '053-7777777',
      senderName: 'KSP',
      status: 'ASSIGNED',
      cellNumber: 12,
      lockerId: 3,
      lockerLocation: 'לוקר מרכזי',
      assignedAt: '2024-01-15T09:15:00Z'
    }
  ]

  const createDemoCell = (id: number, cellNumber: number, size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE', status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' = 'AVAILABLE', packageId?: string): Cell => {
    const hasPackage = status === 'OCCUPIED'
    const package_info = packageId ? demoPackages.find(p => p.id === packageId) : null
    
    return {
      id,
      cellNumber,
      size,
      status,
      hasPackage,
      packageId,
      isLocked: hasPackage,
      content: hasPackage && package_info ? package_info.description : undefined
    }
  }

  const demoLockers: Locker[] = [
    {
      id: 1,
      name: 'לוקר כניסה ראשית',
      location: 'קומה 1 - כניסה ראשית',
      status: 'ONLINE',
      cells: [
        createDemoCell(1, 1, 'SMALL'),
        createDemoCell(2, 2, 'SMALL'),
        createDemoCell(3, 3, 'SMALL'),
        createDemoCell(4, 4, 'SMALL'),
        createDemoCell(5, 5, 'MEDIUM'),
        createDemoCell(6, 6, 'MEDIUM'),
        createDemoCell(7, 7, 'MEDIUM'),
        createDemoCell(8, 8, 'MEDIUM'),
        createDemoCell(9, 9, 'LARGE'),
        createDemoCell(10, 10, 'LARGE'),
        createDemoCell(11, 11, 'LARGE'),
        createDemoCell(12, 12, 'WIDE'),
        createDemoCell(13, 13, 'WIDE'),
        createDemoCell(14, 14, 'SMALL', 'MAINTENANCE'),
        createDemoCell(15, 15, 'LARGE', 'OCCUPIED', '2'),
        createDemoCell(16, 16, 'MEDIUM')
      ]
    },
    {
      id: 2,
      name: 'לוקר חניון',
      location: 'קומת חניון - רמה -1',
      status: 'ONLINE',
      cells: [
        createDemoCell(17, 1, 'SMALL'),
        createDemoCell(18, 2, 'SMALL'),
        createDemoCell(19, 3, 'SMALL'),
        createDemoCell(20, 4, 'MEDIUM'),
        createDemoCell(21, 5, 'MEDIUM'),
        createDemoCell(22, 6, 'MEDIUM'),
        createDemoCell(23, 7, 'MEDIUM'),
        createDemoCell(24, 8, 'MEDIUM', 'OCCUPIED', '3'),
        createDemoCell(25, 9, 'LARGE'),
        createDemoCell(26, 10, 'LARGE'),
        createDemoCell(27, 11, 'LARGE'),
        createDemoCell(28, 12, 'WIDE'),
        createDemoCell(29, 13, 'WIDE'),
        createDemoCell(30, 14, 'SMALL'),
        createDemoCell(31, 15, 'MEDIUM'),
        createDemoCell(32, 16, 'LARGE')
      ]
    },
    {
      id: 3,
      name: 'לוקר מרכזי',
      location: 'קומה 2 - מרכז קניות',
      status: 'ONLINE',
      cells: [
        createDemoCell(33, 1, 'SMALL'),
        createDemoCell(34, 2, 'SMALL'),
        createDemoCell(35, 3, 'SMALL'),
        createDemoCell(36, 4, 'SMALL'),
        createDemoCell(37, 5, 'MEDIUM'),
        createDemoCell(38, 6, 'MEDIUM'),
        createDemoCell(39, 7, 'MEDIUM'),
        createDemoCell(40, 8, 'LARGE'),
        createDemoCell(41, 9, 'LARGE'),
        createDemoCell(42, 10, 'LARGE'),
        createDemoCell(43, 11, 'WIDE'),
        createDemoCell(44, 12, 'WIDE', 'OCCUPIED', '4'),
        createDemoCell(45, 13, 'WIDE'),
        createDemoCell(46, 14, 'MEDIUM'),
        createDemoCell(47, 15, 'LARGE'),
        createDemoCell(48, 16, 'SMALL')
      ]
    }
  ]

  const [newPackage, setNewPackage] = useState({
    description: '',
    size: 'MEDIUM' as 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE',
    customerName: '',
    customerPhone: '',
    senderName: ''
  })

  useEffect(() => {
    setPackages(demoPackages)
    setLockers(demoLockers)
  }, [])

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'SMALL': return '📦'
      case 'MEDIUM': return '📫'
      case 'LARGE': return '🗃️'
      case 'WIDE': return '📮'
      default: return '📦'
    }
  }

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'SMALL': return 'text-blue-400'
      case 'MEDIUM': return 'text-green-400'
      case 'LARGE': return 'text-purple-400'
      case 'WIDE': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400'
      case 'ASSIGNED': return 'bg-blue-500/20 text-blue-400'
      case 'DELIVERED': return 'bg-green-500/20 text-green-400'
      case 'COLLECTED': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'ממתין'
      case 'ASSIGNED': return 'שויך'
      case 'DELIVERED': return 'נמסר'
      case 'COLLECTED': return 'נאסף'
      default: return 'לא ידוע'
    }
  }

  const getCellStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500/20 border-green-400/50 hover:bg-green-500/30'
      case 'OCCUPIED': return 'bg-red-500/20 border-red-400/50'
      case 'MAINTENANCE': return 'bg-yellow-500/20 border-yellow-400/50'
      default: return 'bg-gray-500/20 border-gray-400/50'
    }
  }

  const getCellStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'זמין'
      case 'OCCUPIED': return 'תפוס'
      case 'MAINTENANCE': return 'תחזוקה'
      default: return 'לא ידוע'
    }
  }

  const handleCellClick = (cell: Cell, locker: Locker) => {
    setSelectedCell(cell)
    setSelectedLocker(locker)
    setShowCellModal(true)
  }

  const handleOpenCell = async () => {
    if (!selectedCell || !selectedLocker) return
    
    setIsProcessing(true)
    
    // סימולציה של פתיחת תא
    setTimeout(() => {
      setIsProcessing(false)
      if (selectedCell.status === 'AVAILABLE') {
        setShowAssignDialog(true)
      } else {
        // הודעה על מצב התא
        setNotificationMessage(`תא ${selectedCell.cellNumber} ${selectedCell.status === 'OCCUPIED' ? 'תפוס' : 'בתחזוקה'}`)
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
      }
      setShowCellModal(false)
    }, 1500)
  }

  const handleAssignPackage = async () => {
    if (!selectedCell || !selectedLocker || !selectedPackage) return
    
    setIsProcessing(true)
    
    // סימולציה של שיוך חבילה
    setTimeout(() => {
      // עדכון החבילה
      const updatedPackages = packages.map(pkg => 
        pkg.id === selectedPackage.id 
          ? {
              ...pkg,
              status: 'ASSIGNED' as const,
              cellNumber: selectedCell.cellNumber,
              lockerId: selectedLocker.id,
              lockerLocation: selectedLocker.name,
              assignedAt: new Date().toISOString()
            }
          : pkg
      )
      setPackages(updatedPackages)

      // עדכון התא
      const updatedLockers = lockers.map(locker => 
        locker.id === selectedLocker.id 
          ? {
              ...locker,
              cells: locker.cells.map(cell => 
                cell.id === selectedCell.id
                  ? {
                      ...cell,
                      status: 'OCCUPIED' as const,
                      hasPackage: true,
                      packageId: selectedPackage.id,
                      isLocked: true,
                      content: selectedPackage.description
                    }
                  : cell
              )
            }
          : locker
      )
      setLockers(updatedLockers)

      // שליחת הודעה ללקוח
      setNotificationMessage(`📦 חבילה הוכנסה לתא ${selectedCell.cellNumber} בהצלחה!\n📱 הודעה נשלחה ללקוח ${selectedPackage.customerName}`)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 4000)

      setIsProcessing(false)
      setShowAssignDialog(false)
      setSelectedPackage(null)
      setSelectedCell(null)
      setSelectedLocker(null)
    }, 2000)
  }

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
    setNewPackage({
      description: '',
      size: 'MEDIUM',
      customerName: '',
      customerPhone: '',
      senderName: ''
    })
    
    setNotificationMessage(`📦 חבילה ${pkg.description} נוספה למערכת בהצלחה!`)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/demo')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <span>←</span>
              <span>חזרה לדף הבחירה</span>
            </button>
            <div className="text-2xl">👨‍💼</div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-4">
            ממשק ניהול לוקרים
          </h1>
          <p className="text-white/80 text-lg mb-8">
            נהלו חבילות, שייכו לתאים ושלחו הודעות ללקוחות
          </p>
        </div>

        {/* רווח פשוט */}
        <div className="mb-12"></div>

        {/* תוכן ראשי */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* עמודה שמאל - ניהול חבילות */}
          <div className="xl:col-span-1 space-y-6">
            {/* הוספת חבילה */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📦</span>
                <span>הוספת חבילה</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">תיאור החבילה</label>
                  <input
                    type="text"
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="משקפי שמש Ray-Ban"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">גודל</label>
                  <select
                    value={newPackage.size}
                    onChange={(e) => setNewPackage({...newPackage, size: e.target.value as 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE'})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="SMALL">📦 קטן</option>
                    <option value="MEDIUM">📫 בינוני</option>
                    <option value="LARGE">🗃️ גדול</option>
                    <option value="WIDE">📮 רחב</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">שם לקוח</label>
                  <input
                    type="text"
                    value={newPackage.customerName}
                    onChange={(e) => setNewPackage({...newPackage, customerName: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="יוסי כהן"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">טלפון</label>
                  <input
                    type="text"
                    value={newPackage.customerPhone}
                    onChange={(e) => setNewPackage({...newPackage, customerPhone: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="050-1234567"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">שם שולח</label>
                  <input
                    type="text"
                    value={newPackage.senderName}
                    onChange={(e) => setNewPackage({...newPackage, senderName: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="חנות ABC"
                  />
                </div>
                
                <button
                  onClick={handleAddPackage}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  ➕ הוסף חבילה
                </button>
              </div>
            </div>

            {/* רשימת חבילות */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span>
                <span>חבילות במערכת ({packages.length})</span>
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedPackage?.id === pkg.id 
                        ? 'bg-purple-500/20 border-purple-400/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {getSizeIcon(pkg.size)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white text-sm">{pkg.description}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                            {getStatusText(pkg.status)}
                          </span>
                        </div>
                        <div className="text-xs text-white/70">
                          <p>קוד: {pkg.trackingCode}</p>
                          <p>לקוח: {pkg.customerName}</p>
                          {pkg.cellNumber && <p>תא: #{pkg.cellNumber}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* עמודה ימין - לוקרים */}
          <div className="xl:col-span-3">
            <div className="space-y-8">
              {lockers.map((locker) => (
                <div key={locker.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🏢</div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{locker.name}</h3>
                        <p className="text-white/70">{locker.location}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      locker.status === 'ONLINE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${locker.status === 'ONLINE' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm">{locker.status === 'ONLINE' ? 'מחובר' : 'מנותק'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {locker.cells.map((cell) => (
                      <motion.div
                        key={cell.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`aspect-square rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                          getCellStatusColor(cell.status)
                        } ${
                          cell.status === 'AVAILABLE' 
                            ? 'hover:scale-105' 
                            : cell.status === 'OCCUPIED' 
                              ? 'cursor-pointer' 
                              : 'cursor-not-allowed opacity-60'
                        }`}
                        onClick={() => handleCellClick(cell, locker)}
                      >
                        <div className="h-full flex flex-col items-center justify-center p-2">
                          <div className="text-2xl mb-1">{getSizeIcon(cell.size)}</div>
                          <div className="text-xs font-bold text-white">#{cell.cellNumber}</div>
                          <div className={`text-[10px] ${getSizeColor(cell.size)}`}>
                            {cell.size}
                          </div>
                          <div className="text-[10px] text-white/70 mt-1">
                            {getCellStatusText(cell.status)}
                          </div>
                          {cell.hasPackage && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <div className={`w-2 h-2 rounded-full ${cell.isLocked ? 'bg-red-400' : 'bg-green-400'}`}></div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cell Modal */}
        <AnimatePresence>
          {showCellModal && selectedCell && selectedLocker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full"
              >
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{getSizeIcon(selectedCell.size)}</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    תא #{selectedCell.cellNumber}
                  </h3>
                  <p className="text-white/70">{selectedLocker.name}</p>
                  <p className="text-white/60 text-sm">{selectedLocker.location}</p>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">גודל:</span>
                        <span className={`ml-2 ${getSizeColor(selectedCell.size)}`}>{selectedCell.size}</span>
                      </div>
                      <div>
                        <span className="text-white/60">סטטוס:</span>
                        <span className="ml-2 text-white">{getCellStatusText(selectedCell.status)}</span>
                      </div>
                      <div>
                        <span className="text-white/60">נעילה:</span>
                        <span className="ml-2 text-white">{selectedCell.isLocked ? '🔒 נעול' : '🔓 פתוח'}</span>
                      </div>
                      <div>
                        <span className="text-white/60">תוכן:</span>
                        <span className="ml-2 text-white">{selectedCell.hasPackage ? '📦 יש חבילה' : '📭 ריק'}</span>
                      </div>
                    </div>
                    
                    {selectedCell.content && (
                      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white/60 text-sm">תוכן התא:</span>
                        <p className="text-white text-sm mt-1">{selectedCell.content}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleOpenCell}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    {isProcessing ? 'פותח...' : '🔓 פתח תא'}
                  </button>
                  <button
                    onClick={() => setShowCellModal(false)}
                    disabled={isProcessing}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    ביטול
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assign Dialog */}
        <AnimatePresence>
          {showAssignDialog && selectedCell && selectedLocker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full"
              >
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">📦</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    שיוך חבילה לתא
                  </h3>
                  <p className="text-white/70">תא #{selectedCell.cellNumber} פתוח ומוכן לקבלת חבילה</p>
                </div>
                
                {selectedPackage ? (
                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-center">
                        <div className="text-2xl mb-2">{getSizeIcon(selectedPackage.size)}</div>
                        <h4 className="font-semibold text-white">{selectedPackage.description}</h4>
                        <p className="text-white/70 text-sm">לקוח: {selectedPackage.customerName}</p>
                        <p className="text-white/70 text-sm">גודל: {selectedPackage.size}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleAssignPackage}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                      >
                        {isProcessing ? 'משייך...' : '✅ שייך חבילה'}
                      </button>
                      <button
                        onClick={() => setShowAssignDialog(false)}
                        disabled={isProcessing}
                        className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-400/30 mb-4">
                      <div className="text-2xl mb-2">⚠️</div>
                      <p className="text-white">אין חבילה נבחרת</p>
                      <p className="text-white/70 text-sm">נא לבחור חבילה מהרשימה משמאל</p>
                    </div>
                    <button
                      onClick={() => setShowAssignDialog(false)}
                      className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                    >
                      ביטול
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 z-50 bg-green-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30 max-w-md"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="text-lg font-bold text-green-400 mb-2">הודעה</h3>
                <p className="text-white text-sm whitespace-pre-line">{notificationMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 