'use client'

import { useState } from 'react'
import { 
  sendLockerDataToRailway, 
  updateLockerDataInRailway, 
  getLockersFromRailway, 
  checkRailwayConnection,
  LockerData 
} from '@/lib/railway-api'

interface RailwaySyncProps {
  lockerData?: LockerData
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export default function RailwaySync({ lockerData, onSuccess, onError }: RailwaySyncProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  // בדיקת חיבור לשרת Railway
  const checkConnection = async () => {
    setIsLoading(true)
    try {
      const result = await checkRailwayConnection()
      if (result.success) {
        setConnectionStatus('connected')
        onSuccess?.(result.message)
      } else {
        setConnectionStatus('disconnected')
        onError?.(result.error || 'לא ניתן להתחבר לשרת Railway')
      }
    } catch (error) {
      setConnectionStatus('disconnected')
      onError?.(error instanceof Error ? error.message : 'שגיאה לא ידועה')
    } finally {
      setIsLoading(false)
    }
  }

  // שליחת נתוני לוקר לשרת Railway
  const sendLockerToRailway = async () => {
    if (!lockerData) {
      onError?.('אין נתוני לוקר לשליחה')
      return
    }

    setIsLoading(true)
    try {
      const result = await sendLockerDataToRailway(lockerData)
      if (result.success) {
        onSuccess?.(result.message)
      } else {
        onError?.(result.error || 'שגיאה בשליחת נתונים')
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'שגיאה לא ידועה')
    } finally {
      setIsLoading(false)
    }
  }

  // עדכון נתוני לוקר ב-Railway
  const updateLockerInRailway = async () => {
    if (!lockerData?.id) {
      onError?.('אין מזהה לוקר לעדכון')
      return
    }

    setIsLoading(true)
    try {
      const result = await updateLockerDataInRailway(lockerData.id, lockerData)
      if (result.success) {
        onSuccess?.(result.message)
      } else {
        onError?.(result.error || 'שגיאה בעדכון נתונים')
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'שגיאה לא ידועה')
    } finally {
      setIsLoading(false)
    }
  }

  // קבלת רשימת לוקרים מ-Railway
  const getLockersFromRailwayServer = async () => {
    setIsLoading(true)
    try {
      const result = await getLockersFromRailway()
      if (result.success) {
        onSuccess?.(`התקבלו ${result.data?.length || 0} לוקרים מ-Railway`)
        console.log('📦 רשימת לוקרים מ-Railway:', result.data)
      } else {
        onError?.(result.error || 'שגיאה בקבלת רשימת לוקרים')
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'שגיאה לא ידועה')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500'
      case 'disconnected': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢'
      case 'disconnected': return '🔴'
      default: return '⚪'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🛤️ סנכרון עם Railway</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${getStatusColor()}`}>
            {getStatusIcon()} {connectionStatus === 'connected' ? 'מחובר' : 
                              connectionStatus === 'disconnected' ? 'מנותק' : 'לא ידוע'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* בדיקת חיבור */}
        <button
          onClick={checkConnection}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'בודק...' : '🔍 בדוק חיבור לשרת Railway'}
        </button>

        {/* שליחת לוקר חדש */}
        {lockerData && (
          <button
            onClick={sendLockerToRailway}
            disabled={isLoading || connectionStatus !== 'connected'}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? 'שולח...' : '📤 שלח לוקר חדש ל-Railway'}
          </button>
        )}

        {/* עדכון לוקר קיים */}
        {lockerData?.id && (
          <button
            onClick={updateLockerInRailway}
            disabled={isLoading || connectionStatus !== 'connected'}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? 'מעדכן...' : '🔄 עדכן לוקר ב-Railway'}
          </button>
        )}

        {/* קבלת רשימת לוקרים */}
        <button
          onClick={getLockersFromRailwayServer}
          disabled={isLoading || connectionStatus !== 'connected'}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'מביא...' : '📥 קבל רשימת לוקרים מ-Railway'}
        </button>
      </div>

      {/* מידע על הנתונים */}
      {lockerData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">📋 נתוני לוקר זמינים:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>מזהה:</strong> {lockerData.id}</p>
            <p><strong>שם:</strong> {lockerData.name}</p>
            <p><strong>מיקום:</strong> {lockerData.location}</p>
            <p><strong>IP:</strong> {lockerData.ip}</p>
            <p><strong>סטטוס:</strong> {lockerData.status}</p>
            <p><strong>תאים:</strong> {lockerData.cells.length}</p>
          </div>
        </div>
      )}

      {/* הודעות למשתמש */}
      <div className="mt-4 text-xs text-gray-500">
        <p>💡 <strong>טיפ:</strong> וודא שהגדרת את המשתנים הבאים ב-.env.local:</p>
        <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
          NEXT_PUBLIC_RAILWAY_API_URL=https://your-app.up.railway.app<br/>
          NEXT_PUBLIC_RAILWAY_API_KEY=your-api-key
        </code>
      </div>
    </div>
  )
} 