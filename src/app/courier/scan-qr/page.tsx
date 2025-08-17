'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface CustomerData {
  name: string
  email: string
  phone: string
  tracking_code: string
  description?: string
  package_id?: number
  active?: boolean
}

interface LockerInfo {
  lockerId: string
  cellId: string
  cellCode: string
  cellNumber: string
  size: string
  lockerName?: string
  location?: string
  city?: string
  street?: string
}

// SVG Icons
const QRCodeIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
)

const CameraIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
)

const StopIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ScanIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const LightbulbIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

function ScanQRContent() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [lockerInfo, setLockerInfo] = useState<LockerInfo | null>(null)
  const [manualInput, setManualInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerInitialized, setScannerInitialized] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tracking_code: '',
    description: ''
  })
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // קבלת כל הפרמטרים מה-URL
  const size = searchParams.get('size') || 'MEDIUM'
  const lockerId = searchParams.get('lockerId') || ''
  const cellId = searchParams.get('cellId') || ''
  const cellCode = searchParams.get('cellCode') || ''
  const cellNumber = searchParams.get('cellNumber') || ''
  const lockerName = searchParams.get('lockerName') || ''
  const location = searchParams.get('location') || ''

  // אתחול פרטי הלוקר
  useEffect(() => {
    const info: LockerInfo = {
      lockerId,
      cellId,
      cellCode,
      cellNumber,
      size,
      lockerName: decodeURIComponent(lockerName),
      location: decodeURIComponent(location),
      city: 'תל אביב', // ברירת מחדל - ניתן לקבל מ-API
      street: 'רחוב הטכנולוגיה 1' // ברירת מחדל - ניתן לקבל מ-API
    }
    setLockerInfo(info)
    console.log('🏢 פרטי לוקר:', info)
  }, [lockerId, cellId, cellCode, cellNumber, size, lockerName, location])

  // אתחול הסורק
  useEffect(() => {
    if (showScanner && !scannerInitialized) {
      initializeScanner()
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [showScanner, scannerInitialized])

  const initializeScanner = () => {
    const qrCodeSuccessCallback = (decodedText: string) => {
      console.log('QR Code נסרק:', decodedText)
      handleQRScan(decodedText)
      stopScanner()
    }

    const qrCodeErrorCallback = (errorMessage: string) => {
      // לא נציג שגיאות כי זה קורה הרבה במהלך הסריקה
      console.log('QR Scanner:', errorMessage)
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      formatsToSupport: [ 0 ], // QR_CODE format
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    }

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        config,
        /* verbose= */ false
      )
      
      scannerRef.current.render(qrCodeSuccessCallback, qrCodeErrorCallback)
      setScannerInitialized(true)
    } catch (error) {
      console.error('שגיאה באתחול הסורק:', error)
      alert('שגיאה בגישה למצלמה. בדוק הרשאות המצלמה.')
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
      setScannerInitialized(false)
    }
    setShowScanner(false)
  }

  const startScanner = () => {
    setShowScanner(true)
    setManualInput(false)
  }

  // טיפול בנתוני QR
  const handleQRScan = (qrText: string) => {
    console.log('🔍 QR נסרק:', qrText)
    
    try {
      // ניסיון לפענח כ-JSON
      const data = JSON.parse(qrText)
      console.log('📊 נתוני QR שנפענחו:', data)
      
      // טיפול בפורמט המיוחד: {"‭+972 54-3981642‬":26588285,"pckage_id":235246,"user_name":"עידו ","phone":972545464421,"email":"Ido.moshe1986@gmail.com","description":"אחלה חבילה 5","active":true}
      let customerInfo: CustomerData
      
      if (data.user_name || data.email || data.phone) {
        // פורמט מיוחד עם user_name, pckage_id וכו'
        const phoneKey = Object.keys(data).find(key => key.startsWith('+972') || key.startsWith('972'))
        const trackingFromPhone = phoneKey ? data[phoneKey] : null
        
        customerInfo = {
          name: data.user_name || data.name || 'לקוח',
          email: data.email || '',
          phone: String(data.phone || phoneKey || ''),
          tracking_code: String(trackingFromPhone || data.pckage_id || data.package_id || generateTrackingCode()),
          description: data.description || '',
          package_id: data.pckage_id || data.package_id,
          active: data.active !== false
        }
      } else if (data.name && data.email && data.phone) {
        // פורמט רגיל
        customerInfo = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          tracking_code: data.tracking_code || generateTrackingCode(),
          description: data.description || '',
          package_id: data.package_id,
          active: data.active !== false
        }
      } else {
        throw new Error('נתונים חסרים')
      }
      
      console.log('✅ נתוני לקוח עובדו:', customerInfo)
      setCustomerData(customerInfo)
      setFormData({
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        tracking_code: customerInfo.tracking_code,
        description: customerInfo.description || ''
      })
      
    } catch (error) {
      console.error('❌ שגיאה בפענוח QR:', error)
      
      // אם זה לא JSON, ננסה לטפל בפורמטים אחרים
      if (qrText.includes('@')) {
        // אם יש @ זה כנראה אימייל
        const demoData: CustomerData = {
          name: 'לקוח חדש',
          email: qrText,
          phone: '',
          tracking_code: generateTrackingCode(),
          active: true
        }
        setCustomerData(demoData)
        setFormData({
          name: demoData.name,
          email: demoData.email,
          phone: demoData.phone,
          tracking_code: demoData.tracking_code,
          description: ''
        })
      } else {
        // פורמט לא מזוהה - ננסה להשתמש בטקסט כשם
        const demoData: CustomerData = {
          name: qrText.substring(0, 50), // מוגבל ל-50 תווים
          email: '',
          phone: '',
          tracking_code: generateTrackingCode(),
          active: true
        }
        setCustomerData(demoData)
        setFormData({
          name: demoData.name,
          email: demoData.email,
          phone: demoData.phone,
          tracking_code: demoData.tracking_code,
          description: ''
        })
      }
    }
  }

  const generateTrackingCode = () => {
    return 'XYZ' + Math.random().toString(36).substr(2, 6).toUpperCase()
  }

  const handleManualSubmit = () => {
    if (formData.name && formData.email && formData.phone) {
      const trackingCode = formData.tracking_code || generateTrackingCode()
      
      const data: CustomerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        tracking_code: trackingCode,
        description: formData.description || '',
        active: true
      }
      setCustomerData(data)
      console.log('✅ נתוני הזנה ידנית אושרו:', data)
    } else {
      alert('אנא מלא את כל השדות החובה (שם, אימייל, טלפון)')
    }
  }

  const handleFinalSubmit = async () => {
    if (!customerData || !lockerInfo) return
    
    setLoading(true)
    
    try {
      console.log('💾 מתחיל תהליך שמירת חבילה...', { customerData, lockerInfo })
      
      // שלב 1: שמירת החבילה במסד הנתונים
      const packageData = {
        // נתוני לקוח
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email,
        trackingCode: customerData.tracking_code,
        description: customerData.description || '',
        packageId: customerData.package_id,
        
        // נתוני לוקר ותא
        lockerId: parseInt(lockerId),
        cellId: parseInt(cellId),
        cellCode: cellCode,
        cellNumber: parseInt(cellNumber),
        size: size,
        
        // נתוני מיקום
        city: lockerInfo.city,
        street: lockerInfo.street,
        location: lockerInfo.location,
        lockerName: lockerInfo.lockerName,
        
        // מטא-דאטה
        active: customerData.active !== false,
        deliveryType: 'COURIER_PICKUP'
      }
      
      console.log('📤 שולח נתוני חבילה:', packageData)
      
      const response = await fetch('/api/packages/create-with-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packageData)
      })

      const result = await response.json()
      console.log('📥 תגובת שרת:', result)
      
      if (response.ok && result.success) {
        console.log('✅ החבילה נשמרה בהצלחה:', result)
        
        // שלב 2: פתיחת התא (רק אם נדרש)
        await initiateUnlockCell()
        
        // שלב 3: מעבר לדף הצלחה עם כל הפרטים
        const successParams = new URLSearchParams({
          trackingCode: customerData.tracking_code,
          cellCode: cellCode,
          lockerId: lockerId,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          packageSaved: 'true',
          notificationsSent: result.notificationsSent ? 'true' : 'false',
          // הנתונים הדינמיים החדשים
          description: customerData.description || '',
          city: lockerInfo.city || '',
          street: lockerInfo.street || '',
          location: lockerInfo.location || '',
          lockerName: lockerInfo.lockerName || '',
          unlockCode: result.unlockCode || ''
        })
        
        router.push(`/courier/success?${successParams.toString()}`)
        
      } else {
        throw new Error(result.message || 'שגיאה בשמירת החבילה')
      }
      
    } catch (error) {
      console.error('❌ שגיאה בתהליך שמירת החבילה:', error)
      
      // Fallback - ננסה עדיין לפתוח את התא ולעבור לדף הצלחה
      console.log('⚠️ מעבר למצב fallback')
      
      try {
        await initiateUnlockCell()
        console.log('✅ התא נפתח במצב fallback')
      } catch (unlockError) {
        console.error('❌ שגיאה גם בפתיחת התא:', unlockError)
      }
      
      // מעבר לדף הצלחה עם אזהרה - עם כל הנתונים
      alert(`⚠️ החבילה נשמרה חלקית. שגיאה: ${error instanceof Error ? error.message : 'לא ידועה'}`)
      
      const fallbackParams = new URLSearchParams({
        trackingCode: customerData.tracking_code,
        cellCode: cellCode,
        lockerId: lockerId,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        fallback: 'true',
        packageSaved: 'false',
        notificationsSent: 'false',
        // הנתונים הדינמיים
        description: customerData.description || '',
        city: lockerInfo?.city || '',
        street: lockerInfo?.street || '',
        location: lockerInfo?.location || '',
        lockerName: lockerInfo?.lockerName || ''
      })
      
      router.push(`/courier/success?${fallbackParams.toString()}`)
      
    } finally {
      setLoading(false)
    }
  }

  // פונקציה לפתיחת התא
  const initiateUnlockCell = async () => {
    if (!lockerId || !cellNumber) {
      console.log('⚠️ חסרים נתוני לוקר/תא לפתיחה')
      return
    }
    
    try {
      console.log('🔓 פותח תא...', { lockerId, cellNumber })
      
      const unlockResponse = await fetch('/api/lockers/unlock-cell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lockerId: parseInt(lockerId),
          cellId: cellNumber,
          packageId: customerData?.tracking_code || 'COURIER-SCAN',
          clientToken: 'COURIER-SCAN-TOKEN'
        })
      })

      const unlockResult = await unlockResponse.json()
      console.log('🔓 תגובת פתיחת תא:', unlockResult)
      
      if (unlockResult.status === 'success') {
        console.log('✅ התא נפתח בהצלחה')
      } else {
        console.log('⚠️ בעיה בפתיחת התא, אך ממשיכים')
      }
      
    } catch (error) {
      console.error('❌ שגיאה בפתיחת התא:', error)
      // לא זורקים שגיאה - זה לא קריטי
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href={`/courier/select-locker?size=${size}`} className="text-white hover:text-purple-300 mb-4 inline-flex items-center gap-2 transition-colors">
            <BackIcon />
            חזרה לבחירת לוקר
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            סריקת QR Code
          </h1>
          <p className="text-white/70">
            סרוק את QR הלקוח או הזן פרטים ידנית
          </p>
        </div>

        {/* מידע על הלוקר והתא - מעוצב */}
        {lockerInfo && (
          <div className="glass-card mb-8 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-400/30">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-300 mb-2">🏢 פרטי הלוקר והתא</h2>
              <p className="text-emerald-100">התא שנבחר להפקדת החבילה</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* פרטי מיקום */}
              <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-400/30">
                <h3 className="font-bold text-emerald-300 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  מיקום
                </h3>
                <div className="space-y-2 text-emerald-100">
                  <p><span className="font-medium">עיר:</span> {lockerInfo.city}</p>
                  <p><span className="font-medium">כתובת:</span> {lockerInfo.street}</p>
                  <p><span className="font-medium">מיקום:</span> {lockerInfo.location}</p>
                </div>
              </div>

              {/* פרטי לוקר */}
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
                <h3 className="font-bold text-blue-300 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  לוקר
                </h3>
                <div className="space-y-2 text-blue-100">
                  <p><span className="font-medium">מזהה:</span> #{lockerInfo.lockerId}</p>
                  <p><span className="font-medium">שם:</span> {lockerInfo.lockerName}</p>
                  <p><span className="font-medium">גודל חבילה:</span> <span className="font-bold text-blue-300">{lockerInfo.size}</span></p>
                </div>
              </div>

              {/* פרטי תא */}
              <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-400/30">
                <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  תא
                </h3>
                <div className="space-y-2 text-purple-100">
                  <p><span className="font-medium">קוד תא:</span> <span className="font-bold text-purple-300">{lockerInfo.cellCode}</span></p>
                  <p><span className="font-medium">מספר תא:</span> #{lockerInfo.cellNumber}</p>
                  <p><span className="font-medium">ID תא:</span> #{lockerInfo.cellId}</p>
                </div>
              </div>
            </div>

            {/* מידע נוסף */}
            <div className="mt-6 bg-emerald-600/10 rounded-lg p-4 border border-emerald-400/20">
              <div className="flex items-center justify-center gap-2 text-emerald-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">התא יוקצה לחבילה אוטומטית לאחר הסריקה</span>
              </div>
            </div>
          </div>
        )}

        {!customerData ? (
          <div className="space-y-6">
            {/* אפשרויות סריקה */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* סריקת QR */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  סריקת QR Code
                </h3>
                
                {!showScanner ? (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white/10 rounded-lg mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                      <CameraIcon />
                    </div>
                    <button
                      onClick={startScanner}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-white border border-purple-300/30 backdrop-blur-sm rounded-lg px-4 py-3 transition-all flex items-center justify-center gap-2 mb-2"
                    >
                      <ScanIcon />
                      הפעל סורק QR
                    </button>
                    <p className="text-sm text-white/60">
                      יש צורך בהרשאת מצלמה
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div id="qr-reader" className="mx-auto mb-4"></div>
                    <button
                      onClick={stopScanner}
                      className="w-full bg-red-500/20 hover:bg-red-500/30 text-white border border-red-300/30 backdrop-blur-sm rounded-lg px-4 py-3 transition-all flex items-center justify-center gap-2"
                    >
                      <StopIcon />
                      עצור סריקה
                    </button>
                    <p className="text-sm text-white/60 mt-2">
                      כוון את המצלמה על QR Code
                    </p>
                  </div>
                )}
              </div>

              {/* הזנה ידנית */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  הזנה ידנית
                </h3>
                <div className="text-center">
                  <div className="w-32 h-32 bg-white/10 rounded-lg mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                    <EditIcon />
                  </div>
                  <button
                    onClick={() => {
                      setManualInput(!manualInput)
                      if (showScanner) stopScanner()
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm rounded-lg px-4 py-3 transition-all"
                  >
                    {manualInput ? 'בטל הזנה ידנית' : 'הזן פרטים ידנית'}
                  </button>
                  <p className="text-sm text-white/60 mt-2">
                    למקרה שאין QR Code
                  </p>
                </div>
              </div>
            </div>

            {/* טופס הזנה ידנית */}
            {manualInput && (
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6">פרטי הלקוח</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      שם מלא *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                      placeholder="הזן שם מלא"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      אימייל *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                      placeholder="הזן כתובת אימייל"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      טלפון *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                      placeholder="הזן מספר טלפון"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      קוד מעקב (אופציונלי)
                    </label>
                    <input
                      type="text"
                      value={formData.tracking_code}
                      onChange={(e) => setFormData({...formData, tracking_code: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                      placeholder="יוגרל אוטומטי אם לא יוזן"
                    />
                  </div>
                </div>

                {/* תיאור החבילה */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    תיאור החבילה (אופציונלי)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm resize-none"
                    placeholder="תיאור החבילה או הערות נוספות..."
                    rows={3}
                  />
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={handleManualSubmit}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-8 py-3 rounded-lg transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <CheckIcon />
                    אשר פרטים
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* הצגת נתוני הלקוח ואישור */
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              פרטי הלקוח אושרו
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* פרטי לקוח */}
              <div className="bg-green-500/20 border border-green-400/30 p-6 rounded-xl backdrop-blur-sm">
                <h4 className="font-bold text-green-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  פרטי הלקוח
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-green-300 font-medium">שם:</span>
                    <span className="text-white">{customerData.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-300 font-medium">אימייל:</span>
                    <span className="text-white text-sm">{customerData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-300 font-medium">טלפון:</span>
                    <span className="text-white">{customerData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-300 font-medium">קוד מעקב:</span>
                    <span className="text-green-400 font-mono font-bold">{customerData.tracking_code}</span>
                  </div>
                  {customerData.description && (
                    <div className="mt-4 pt-3 border-t border-green-400/30">
                      <span className="text-green-300 font-medium">תיאור החבילה:</span>
                      <p className="text-white mt-1 text-sm bg-green-600/10 p-2 rounded">{customerData.description}</p>
                    </div>
                  )}
                  {customerData.package_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-300 font-medium">מזהה חבילה:</span>
                      <span className="text-green-400 font-mono">#{customerData.package_id}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* פרטי מיקום */}
              <div className="bg-blue-500/20 border border-blue-400/30 p-6 rounded-xl backdrop-blur-sm">
                <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  פרטי המיקום והתא
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-medium">עיר:</span>
                    <span className="text-white">{lockerInfo?.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-medium">כתובת:</span>
                    <span className="text-white">{lockerInfo?.street}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-medium">לוקר:</span>
                    <span className="text-blue-400 font-bold">#{lockerId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-medium">תא:</span>
                    <span className="text-blue-400 font-bold">{cellCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-medium">גודל:</span>
                    <span className="text-white">{size}</span>
                  </div>
                </div>
                
                {/* אזהרה */}
                <div className="mt-4 pt-3 border-t border-blue-400/30">
                  <div className="bg-blue-600/20 p-3 rounded-lg flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-yellow-300 font-medium text-sm">שים לב!</p>
                      <p className="text-yellow-100 text-xs">התא ייפתח אוטומטית לאחר שמירת החבילה</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setCustomerData(null)
                  setFormData({name: '', email: '', phone: '', tracking_code: '', description: ''})
                }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm rounded-lg px-6 py-3 transition-all flex items-center gap-2"
                disabled={loading}
              >
                <RefreshIcon />
                סרוק שוב
              </button>
              
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-8 py-3 rounded-lg transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    שומר...
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    שמור חבילה ופתח תא
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* הוראות */}
        <div className="mt-8 glass-card p-4 border-yellow-400/30">
          <div className="flex items-center gap-2 mb-2">
            <LightbulbIcon />
            <h3 className="font-semibold text-yellow-400">הוראות שימוש</h3>
          </div>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• לחץ על "הפעל סורק QR" כדי להפעיל את המצלמה</li>
            <li>• כוון את המצלמה על QR Code של הלקוח</li>
            <li>• אם אין QR Code, השתמש בהזנה ידנית</li>
            <li>• לאחר אישור הפרטים, התא ייפתח אוטומטית</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function ScanQRPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">טוען...</div>
      </div>
    }>
      <ScanQRContent />
    </Suspense>
  )
} 