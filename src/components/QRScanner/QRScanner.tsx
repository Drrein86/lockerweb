'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, QrcodeSuccessCallback, QrcodeErrorCallback } from 'html5-qrcode'

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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const elementId = 'qr-code-scanner'

  useEffect(() => {
    if (isActive && !isScanning) {
      startScanner()
    } else if (!isActive && isScanning) {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isActive])

  const startScanner = () => {
    if (scannerRef.current) {
      stopScanner()
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

    const onScanSuccess: QrcodeSuccessCallback = (decodedText, decodedResult) => {
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

    const onScanError: QrcodeErrorCallback = (error) => {
      // לא נציג שגיאות סריקה רגילות - רק כשיש בעיה חמורה
      if (error.includes('NotAllowedError')) {
        const errorMsg = 'נדרשת הרשאה למצלמה'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }

    try {
      scannerRef.current = new Html5QrcodeScanner(elementId, config, false)
      scannerRef.current.render(onScanSuccess, onScanError)
      setIsScanning(true)
      setError('')
    } catch (scannerError) {
      console.error('❌ שגיאה בהפעלת סורק QR:', scannerError)
      const errorMsg = 'לא ניתן להפעיל את סורק QR'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
        scannerRef.current = null
        setIsScanning(false)
      } catch (clearError) {
        console.error('שגיאה בעצירת סורק:', clearError)
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
    startScanner()
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
              <div className="text-center text-white/50">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>לחץ להפעלת המצלמה</p>
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
