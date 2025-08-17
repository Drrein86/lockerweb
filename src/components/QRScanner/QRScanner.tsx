'use client'

import React, { useEffect, useRef, useState } from 'react'

// Dynamic import for html5-qrcode will be done at runtime

interface PackageData {
  package_id: number
  user_name: string
  phone: string | number
  email: string
  description: string
  active: boolean
}

interface QRScannerProps {
  onScanSuccess: (data: PackageData) => void
  onError?: (error: string) => void
  isActive: boolean
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onError, isActive }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const scannerRef = useRef<any>(null)
  const elementId = 'qr-code-scanner'

  useEffect(() => {
    let isMounted = true
    
    if (isActive && !isScanning) {
      startScanner().catch((error) => {
        if (isMounted) {
          console.error('שגיאה בהפעלת הסורק:', error)
          const errorMsg = 'נכשל בהפעלת סורק QR: ' + (error.message || 'שגיאה לא ידועה')
          setError(errorMsg)
          onError?.(errorMsg)
        }
      })
    } else if (!isActive && isScanning) {
      stopScanner()
    }

    return () => {
      isMounted = false
      // הוספת delay קטן כדי לוודא שה-DOM מוכן לניקוי
      setTimeout(() => {
        stopScanner()
      }, 100)
    }
  }, [isActive])

  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        stopScanner()
      }

      // בדיקה שהדפדפן תומך במצלמה
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'הדפדפן לא תומך בגישה למצלמה'
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      // טעינה דינמית של המודול html5-qrcode
      let Html5QrcodeScanner: any
      try {
        const qrCodeModule = await import('html5-qrcode')
        console.log('🔍 נטען מודול html5-qrcode:', qrCodeModule)
        Html5QrcodeScanner = qrCodeModule.Html5QrcodeScanner
        
        if (!Html5QrcodeScanner) {
          throw new Error('Html5QrcodeScanner לא נמצא במודול')
        }
      } catch (importError) {
        console.error('❌ נכשל בטעינת html5-qrcode:', importError)
        const errorMsg = 'סורק QR לא זמין - נכשל בטעינת המודול: ' + (importError instanceof Error ? importError.message : 'שגיאה לא ידועה')
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      }

      const onQrCodeScanSuccess = (decodedText: string, decodedResult: any) => {
        console.log('🔍 QR נסרק בהצלחה:', decodedText)
        
        try {
          // ניסיון לפענח JSON
          const parsedData = JSON.parse(decodedText)
          console.log('📋 נתונים שנפענחו:', parsedData)
          
          // בדיקת תקינות הנתונים
          if (validatePackageData(parsedData)) {
            setScanResult(decodedText)
            setError('')
            onScanSuccess(parsedData)
            stopScanner()
          } else {
            const errorMsg = 'QR Code לא מכיל נתוני חבילה תקינים'
            setError(errorMsg)
            onError?.(errorMsg)
          }
        } catch (jsonError) {
          console.error('❌ שגיאה בפענוח JSON:', jsonError)
          const errorMsg = 'QR Code לא מכיל JSON תקין'
          setError(errorMsg)
          onError?.(errorMsg)
        }
      }

      const onQrCodeScanError = (error: string) => {
        // לא נציג שגיאות סריקה רגילות - רק כשיש בעיה חמורה
        if (error.includes('NotAllowedError')) {
          const errorMsg = 'נדרשת הרשאה למצלמה'
          setError(errorMsg)
          onError?.(errorMsg)
        }
      }

      // בדיקה שהelement קיים לפני יצירת הסורק
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('לא נמצא element עבור הסורק במזהה: ' + elementId)
      }

      scannerRef.current = new Html5QrcodeScanner(elementId, config, false)
      scannerRef.current.render(onQrCodeScanSuccess, onQrCodeScanError)
      setIsScanning(true)
      setError('')
      console.log('✅ סורק QR הופעל בהצלחה')
      
    } catch (scannerError) {
      console.error('❌ שגיאה בהפעלת סורק QR:', scannerError)
      const errorMsg = 'לא ניתן להפעיל את סורק QR: ' + (scannerError instanceof Error ? scannerError.message : 'שגיאה לא ידועה')
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        console.log('🛑 עוצר סורק QR...')
        
        // בדיקה שהelement עדיין קיים ב-DOM
        const element = document.getElementById(elementId)
        if (element && element.parentNode) {
          scannerRef.current.clear()
          console.log('✅ סורק QR נעצר בהצלחה')
        } else {
          console.log('⚠️ Element כבר לא קיים ב-DOM, מדלג על clear()')
        }
      } catch (clearError) {
        console.error('❌ שגיאה בעצירת סורק:', clearError)
        
        // ניסיון ניקוי ידני של הelement
        try {
          const element = document.getElementById(elementId)
          if (element) {
            element.innerHTML = ''
            console.log('🧹 ניקוי ידני של element הושלם')
          }
        } catch (manualCleanError) {
          console.error('❌ גם ניקוי ידני נכשל:', manualCleanError)
        }
      } finally {
        // תמיד נאפס את הref והstate
        scannerRef.current = null
        setIsScanning(false)
      }
    }
  }

  const validatePackageData = (data: any): data is PackageData => {
    return (
      data &&
      typeof data === 'object' &&
      (data.package_id || data.pckage_id) && // תמיכה בשני הכתבים
      data.user_name &&
      data.phone &&
      data.email &&
      data.description !== undefined &&
      data.active !== undefined
    )
  }

  const retryScanning = () => {
    setError('')
    setScanResult('')
    startScanner().catch((error) => {
      console.error('שגיאה בחזרה על הסריקה:', error)
      const errorMsg = 'נכשל בהפעלת סורק QR: ' + (error.message || 'שגיאה לא ידועה')
      setError(errorMsg)
      onError?.(errorMsg)
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            סריקת QR Code
          </h3>
          <p className="text-white/70 text-sm">
            מקם את ה-QR Code במרכז המסגרת
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-300 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">שגיאה בסריקה</span>
            </div>
            <p className="text-red-200 text-sm">{error}</p>
            <button
              onClick={retryScanning}
              className="mt-3 btn-primary bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              נסה שוב
            </button>
          </div>
        )}

        {scanResult && !error && (
          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-green-300 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">QR נסרק בהצלחה!</span>
            </div>
            <p className="text-green-200 text-xs">הנתונים הועברו לטופס</p>
          </div>
        )}

        {/* אזור הסורק */}
        <div className="mb-4">
          <div 
            id={elementId}
            className="qr-scanner-container"
            style={{
              width: '100%',
              border: '2px dashed rgba(59, 130, 246, 0.5)',
              borderRadius: '12px',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}
          >
            {!isScanning && !error && (
              <div className="text-center text-white/70">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <p className="text-sm">טוען סורק QR...</p>
              </div>
            )}
          </div>
        </div>

        {/* הוראות שימוש */}
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 text-right">
          <h4 className="font-semibold text-blue-300 mb-2">💡 הוראות סריקה:</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• וודא שיש תאורה טובה</li>
            <li>• החזק את המכשיר יציב</li>
            <li>• מקם את ה-QR במרכז המסגרת</li>
            <li>• המתן לסריקה אוטומטית</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default QRScanner
