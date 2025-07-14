'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DemoCell {
  id: string
  number: number
  size: 'small' | 'medium' | 'large' | 'wide'
  status: 'empty' | 'occupied' | 'opening' | 'closing'
  isLocked: boolean
  package?: {
    id: string
    trackingCode: string
    customerName: string
    customerPhone: string
    size: string
    description: string
    insertedAt: string
  }
  lastOpened?: string
}

interface DemoLocker {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'maintenance'
  cells: DemoCell[]
  totalCells: number
  occupiedCells: number
  availableCells: number
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string
}

interface Notification {
  id: string
  type: 'sms' | 'email' | 'push'
  message: string
  timestamp: string
  status: 'sent' | 'delivered' | 'failed'
}

export default function LockersManagementPage() {
  const [selectedMode, setSelectedMode] = useState<'demo' | 'real'>('demo')
  const [demoLockers, setDemoLockers] = useState<DemoLocker[]>([])
  const [selectedLocker, setSelectedLocker] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [customers] = useState<Customer[]>([
    { id: '1', name: 'יוסי כהן', phone: '050-1234567', email: 'yossi@example.com' },
    { id: '2', name: 'שרה לוי', phone: '052-7654321', email: 'sara@example.com' },
    { id: '3', name: 'דני אביב', phone: '054-9876543', email: 'danny@example.com' },
    { id: '4', name: 'רינה גולד', phone: '053-1357924', email: 'rina@example.com' },
    { id: '5', name: 'אלי רוזן', phone: '055-2468135', email: 'eli@example.com' }
  ])

  // יצירת נתונים דמו
  useEffect(() => {
    const createDemoData = () => {
      const lockers: DemoLocker[] = []
      
      for (let i = 1; i <= 3; i++) {
        const cells: DemoCell[] = []
        
        for (let j = 1; j <= 16; j++) {
          const cellId = `L${i}C${j}`
          
          // הגדרת גדלים שונים באופן ריאליסטי
          let size: 'small' | 'medium' | 'large' | 'wide'
          if (j <= 6) size = 'small'
          else if (j <= 12) size = 'medium'
          else if (j <= 14) size = 'large'
          else size = 'wide'
          
          // יצירת חבילות דמו לחלק מהתאים
          const hasPackage = Math.random() < 0.3 // 30% מהתאים מכילים חבילות
          const package_ = hasPackage ? {
            id: `PKG${Date.now()}-${i}-${j}`,
            trackingCode: `TRK${String(Math.random()).substring(2, 8)}`,
            customerName: customers[Math.floor(Math.random() * customers.length)].name,
            customerPhone: customers[Math.floor(Math.random() * customers.length)].phone,
            size: size,
            description: `חבילה ${j} של לוקר ${i}`,
            insertedAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
          } : undefined
          
          cells.push({
            id: cellId,
            number: j,
            size,
            status: hasPackage ? 'occupied' : 'empty',
            isLocked: true,
            package: package_,
            lastOpened: hasPackage ? new Date(Date.now() - Math.random() * 86400000).toISOString() : undefined
          })
        }
        
        const occupiedCells = cells.filter(c => c.status === 'occupied').length
        
        lockers.push({
          id: `locker_${i}`,
          name: `לוקר ${i}`,
          location: i === 1 ? 'כניסה ראשית' : i === 2 ? 'חניון תחתון' : 'קומה 2',
          status: Math.random() > 0.1 ? 'online' : 'offline',
          cells,
          totalCells: 16,
          occupiedCells,
          availableCells: 16 - occupiedCells
        })
      }
      
      setDemoLockers(lockers)
      setSelectedLocker(lockers[0].id)
    }
    
    createDemoData()
  }, [customers])

  const getCellSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1'
      case 'medium': return 'col-span-2 row-span-1'
      case 'large': return 'col-span-2 row-span-2'
      case 'wide': return 'col-span-3 row-span-1'
      default: return 'col-span-1 row-span-1'
    }
  }

  const getCellIcon = (size: string) => {
    switch (size) {
      case 'small': return '📦'
      case 'medium': return '📫'
      case 'large': return '🗃️'
      case 'wide': return '📮'
      default: return '📦'
    }
  }

  const handleCellClick = (lockerId: string, cellId: string) => {
    const locker = demoLockers.find(l => l.id === lockerId)
    const cell = locker?.cells.find(c => c.id === cellId)
    
    if (!cell) return

    if (cell.status === 'empty') {
      setSelectedLocker(lockerId)
      setSelectedCell(cellId)
      setShowPackageForm(true)
    } else if (cell.status === 'occupied') {
      // פתיחת תא עם חבילה
      openCell(lockerId, cellId)
    }
  }

  const openCell = (lockerId: string, cellId: string) => {
    setDemoLockers(prev => 
      prev.map(locker => 
        locker.id === lockerId 
          ? {
              ...locker,
              cells: locker.cells.map(cell =>
                cell.id === cellId
                  ? { ...cell, status: 'opening' as const, isLocked: false }
                  : cell
              )
            }
          : locker
      )
    )

    // סגירה אוטומטית לאחר 3 שניות
    setTimeout(() => {
      setDemoLockers(prev => 
        prev.map(locker => 
          locker.id === lockerId 
            ? {
                ...locker,
                cells: locker.cells.map(cell =>
                  cell.id === cellId
                    ? { ...cell, status: 'closing' as const }
                    : cell
                )
              }
            : locker
        )
      )

      setTimeout(() => {
        setDemoLockers(prev => 
          prev.map(locker => 
            locker.id === lockerId 
              ? {
                  ...locker,
                  cells: locker.cells.map(cell =>
                    cell.id === cellId
                      ? { ...cell, status: cell.package ? 'occupied' as const : 'empty' as const, isLocked: true }
                      : cell
                  )
                }
              : locker
          )
        )
      }, 1000)
    }, 3000)
  }

  const insertPackage = (packageData: any) => {
    if (!selectedLocker || !selectedCell) return

    const trackingCode = `TRK${String(Math.random()).substring(2, 8)}`
    const newPackage = {
      id: `PKG${Date.now()}`,
      trackingCode,
      customerName: packageData.customerName,
      customerPhone: packageData.customerPhone,
      size: packageData.size,
      description: packageData.description,
      insertedAt: new Date().toISOString()
    }

    // עדכון התא עם החבילה
    setDemoLockers(prev => 
      prev.map(locker => 
        locker.id === selectedLocker 
          ? {
              ...locker,
              cells: locker.cells.map(cell =>
                cell.id === selectedCell
                  ? { 
                      ...cell, 
                      status: 'occupied' as const,
                      isLocked: true,
                      package: newPackage,
                      lastOpened: new Date().toISOString()
                    }
                  : cell
              ),
              occupiedCells: locker.occupiedCells + 1,
              availableCells: locker.availableCells - 1
            }
          : locker
      )
    )

    // שליחת הודעה ללקוח
    sendNotification(newPackage, packageData.customerPhone)
    
    setShowPackageForm(false)
    setSelectedCell(null)
    setSelectedLocker(null)
  }

  const sendNotification = (package_: any, customerPhone: string) => {
    const notification: Notification = {
      id: `NOT${Date.now()}`,
      type: 'sms',
      message: `חבילה ${package_.trackingCode} הוכנסה בהצלחה ללוקר! קוד איסוף: ${package_.trackingCode}`,
      timestamp: new Date().toISOString(),
      status: 'sent'
    }

    setNotifications(prev => [notification, ...prev])

    // סימולציה של משלוח הודעה
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, status: 'delivered' as const }
            : n
        )
      )
    }, 2000)
  }

  const removePackage = (lockerId: string, cellId: string) => {
    setDemoLockers(prev => 
      prev.map(locker => 
        locker.id === lockerId 
          ? {
              ...locker,
              cells: locker.cells.map(cell =>
                cell.id === cellId
                  ? { 
                      ...cell, 
                      status: 'empty' as const,
                      package: undefined,
                      lastOpened: new Date().toISOString()
                    }
                  : cell
              ),
              occupiedCells: locker.occupiedCells - 1,
              availableCells: locker.availableCells + 1
            }
          : locker
      )
    )
  }

  const selectedLockerData = demoLockers.find(l => l.id === selectedLocker)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* כותרת קבועה */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🔧 ניהול לוקרים - מצב הדמה</h1>
              <p className="text-white/70">ממשק הדמה לניהול לוקרים חכמים עם 3 לוקרים ו-16 תאים כל אחד</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.open('/demo', '_blank')}
                className="btn bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg transition-all font-bold shadow-lg"
              >
                🎯 דף הדגמה ללקוחות
              </button>
              <button
                onClick={() => setSelectedMode(selectedMode === 'demo' ? 'real' : 'demo')}
                className="btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
              >
                {selectedMode === 'demo' ? '🔧 מצב ניהול אמיתי' : '🎭 מצב הדמה'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* תוכן ראשי עם ריווח מהכותרת */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* סטטיסטיקות כלליות */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">לוקרים פעילים</h3>
                <p className="text-3xl font-bold text-green-400">
                  {demoLockers.filter(l => l.status === 'online').length}/3
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">תאים תפוסים</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {demoLockers.reduce((sum, l) => sum + l.occupiedCells, 0)}/48
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">תפוסה כללית</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {Math.round((demoLockers.reduce((sum, l) => sum + l.occupiedCells, 0) / 48) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* בחירת לוקר */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">בחר לוקר לניהול</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoLockers.map((locker) => (
              <motion.div
                key={locker.id}
                onClick={() => setSelectedLocker(locker.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedLocker === locker.id
                    ? 'bg-purple-500/30 border-2 border-purple-400'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${
                    locker.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <h3 className="text-lg font-semibold text-white">{locker.name}</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">מיקום:</span>
                    <span className="text-white">{locker.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">תאים תפוסים:</span>
                    <span className="text-white">{locker.occupiedCells}/{locker.totalCells}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">סטטוס:</span>
                    <span className={`${locker.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                      {locker.status === 'online' ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* תצוגת תאים */}
        {selectedLockerData && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedLockerData.name} - {selectedLockerData.location}
                </h2>
                <p className="text-white/70">
                  לחץ על תא ריק להכנסת חבילה או על תא תפוס לפתיחה
                </p>
              </div>
              
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white/70">ריק</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-white/70">תפוס</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-white/70">פותח</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="grid grid-cols-6 gap-3 h-96">
                {selectedLockerData.cells.map((cell) => (
                  <motion.div
                    key={cell.id}
                    onClick={() => handleCellClick(selectedLockerData.id, cell.id)}
                    className={`
                      ${getCellSizeClass(cell.size)}
                      bg-white/10 border-2 rounded-lg cursor-pointer transition-all
                      hover:bg-white/20 hover:scale-105
                      ${cell.status === 'empty' ? 'border-green-400/50' : 
                        cell.status === 'occupied' ? 'border-red-400/50' : 
                        'border-yellow-400/50'}
                      ${cell.status === 'opening' ? 'animate-pulse' : ''}
                      flex flex-col items-center justify-center p-2
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{getCellIcon(cell.size)}</div>
                      <div className="text-xs font-medium text-white mb-1">
                        תא {cell.number}
                      </div>
                      <div className="text-xs text-white/60 mb-1">
                        {cell.size === 'small' ? 'קטן' : 
                         cell.size === 'medium' ? 'בינוני' : 
                         cell.size === 'large' ? 'גדול' : 'רחב'}
                      </div>
                      
                      {cell.status === 'occupied' && cell.package && (
                        <div className="text-xs text-white/80 text-center">
                          <div className="truncate">{cell.package.customerName}</div>
                          <div className="text-xs text-white/60">
                            {cell.package.trackingCode}
                          </div>
                        </div>
                      )}
                      
                      {cell.status === 'opening' && (
                        <div className="text-xs text-yellow-400 animate-pulse">
                          פותח...
                        </div>
                      )}
                      
                      {cell.status === 'empty' && (
                        <div className="text-xs text-green-400">
                          זמין
                        </div>
                      )}
                    </div>
                    
                    <div className={`w-2 h-2 rounded-full mt-1 ${
                      cell.status === 'empty' ? 'bg-green-400' : 
                      cell.status === 'occupied' ? 'bg-red-400' : 
                      'bg-yellow-400 animate-pulse'
                    }`}></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* התראות אחרונות */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">התראות אחרונות</h2>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {notification.type === 'sms' ? '📱' : 
                       notification.type === 'email' ? '📧' : '🔔'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white">{notification.message}</div>
                      <div className="text-xs text-white/60 mt-1">
                        {new Date(notification.timestamp).toLocaleString('he-IL')}
                      </div>
                    </div>
                    <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs ${
                      notification.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                      notification.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {notification.status === 'delivered' ? 'נמסר' :
                       notification.status === 'sent' ? 'נשלח' : 'שגיאה'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* טופס הכנסת חבילה */}
      <AnimatePresence>
        {showPackageForm && (
          <PackageForm
            onSubmit={insertPackage}
            onCancel={() => {
              setShowPackageForm(false)
              setSelectedCell(null)
              setSelectedLocker(null)
            }}
            customers={customers}
            selectedCell={selectedCell}
            selectedLocker={selectedLocker}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PackageForm({ onSubmit, onCancel, customers, selectedCell, selectedLocker }: {
  onSubmit: (data: any) => void
  onCancel: () => void
  customers: Customer[]
  selectedCell: string | null
  selectedLocker: string | null
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    size: 'medium',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const selectCustomer = (customer: Customer) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-xl max-w-md w-full p-6 border border-white/20"
      >
        <h3 className="text-2xl font-bold text-white mb-6">
          📦 הכנסת חבילה חדשה
        </h3>
        
        <div className="mb-4 p-3 bg-blue-500/20 rounded-lg">
          <div className="text-sm text-blue-300">
            לוקר: {selectedLocker} | תא: {selectedCell}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">בחר לקוח מהרשימה</label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto mb-3">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => selectCustomer(customer)}
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm"
                >
                  <div className="text-white">{customer.name}</div>
                  <div className="text-white/60">{customer.phone}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">שם הלקוח</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">טלפון</label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={e => setFormData({...formData, customerPhone: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">גודל חבילה</label>
            <select
              value={formData.size}
              onChange={e => setFormData({...formData, size: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">קטן</option>
              <option value="medium">בינוני</option>
              <option value="large">גדול</option>
              <option value="wide">רחב</option>
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">תיאור החבילה</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="תיאור החבילה..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              📦 הכנס חבילה
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-6 py-3 rounded-lg font-medium transition-all"
            >
              ביטול
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
} 