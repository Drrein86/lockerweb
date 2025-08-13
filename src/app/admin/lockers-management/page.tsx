'use client'

import { useState, useEffect } from 'react'

interface Cell {
  id: number
  cellNumber: number
  code: string
  name?: string
  size: string
  status: string
  isLocked: boolean
  isActive: boolean
  lockerId: number
  openCount: number
  lastOpenedAt?: string
}

interface Locker {
  id: number
  name: string
  location: string
  description?: string
  ip?: string
  port?: number
  deviceId?: string
  status: string
  lastSeen?: string
  isActive: boolean
  cells: Cell[]
}

export default function LockersManagementPage() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [liveLockers, setLiveLockers] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [showLockerForm, setShowLockerForm] = useState(false)
  const [showCellForm, setShowCellForm] = useState(false)
  const [controlLoading, setControlLoading] = useState<{ [key: string]: boolean }>({})
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedLiveLocker, setSelectedLiveLocker] = useState<any>(null)
  const [predefinedLockers, setPredefinedLockers] = useState<Locker[]>([])
  const [showCreateNewOption, setShowCreateNewOption] = useState(false)
  const [error, setError] = useState<string>('')
  const [loadTime, setLoadTime] = useState<string>('')
  
  // WebSocket Status
  const [wsStatus, setWsStatus] = useState<'מתחבר' | 'מחובר' | 'מנותק' | 'שגיאה'>('מתחבר')
  const [lastMessage, setLastMessage] = useState<string>('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  
  console.log('🚀 LockersManagementPage נטען')

  useEffect(() => {
    console.log('🔄 useEffect triggered - loading lockers...')
    loadLockers()
  }, [])

  // WebSocket Connection לשרת החומרה
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout
    let pingInterval: NodeJS.Timeout
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5

    const connect = () => {
      try {
        setWsStatus('מתחבר')
        // שימוש ב-API החדש במקום WebSocket
        console.log('🔗 מתחבר ל-WebSocket API החדש...')
        setWsStatus('מתחבר')
        
        try {
          // התחברות ל-Admin Status Stream עם authentication
          const adminSecret = '86428642' // זהה לשרת הישן
          const eventSource = new EventSource(`https://lockerweb-production.up.railway.app/api/admin/status-stream?secret=${adminSecret}`)
          
          eventSource.onopen = () => {
            setWsStatus('מחובר')
            setLastMessage('התחברת בהצלחה לשרת החדש')
            console.log('✅ התחברות לAPI WebSocket הצליחה')
            reconnectAttempts = 0
          }
          
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              setLastMessage(event.data)
              console.log('📨 התקבלה הודעה:', data)
              
              // טיפול בהודעות (כמו בשרת הישן)
              if (data.type === 'lockerUpdate') {
                // עדכון מצב לוקרים
                const states = data.data.lockers || {}
                let connectedCount = 0
                
                Object.values(states).forEach((state: any) => {
                  if (state.isOnline) connectedCount++
                })
                
                // עדכון מצב הלוקרים הישירות במקום ספירה
                setLiveLockers(states)
                console.log(`📊 עודכנו ${connectedCount}/${Object.keys(states).length} לוקרים מחוברים`)
              }
              
              if (data.type === 'cellOperation') {
                console.log(`🔄 פעולת תא: ${data.data.operation} על ${data.data.cellId} בלוקר ${data.data.lockerId}`)
              }
              
              if (data.type === 'lockerConnection') {
                console.log(`🔄 לוקר ${data.data.lockerId} ${data.data.connected ? 'התחבר' : 'התנתק'}`)
                // רענון מיידי של הנתונים
                loadLockers()
              }
              
              if (data.type === 'connected') {
                console.log('✅ חיבור Admin מאושר')
              }
            } catch (error) {
              console.error('❌ שגיאה בעיבוד הודעה:', error)
            }
          }
          
          eventSource.onerror = () => {
            setWsStatus('שגיאה')
            console.error('❌ שגיאת WebSocket API')
            eventSource.close()
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              reconnectAttempts++
              console.log(`🔄 ניסיון התחברות מחדש ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`)
              setTimeout(connect, 3000)
            }
          }
          
          // שמירת החיבור לניקוי
          ws = eventSource as any
          
        } catch (error) {
          console.error('❌ שגיאה ביצירת חיבור API:', error)
          setWsStatus('שגיאה')
        }

      } catch (error) {
        console.error('❌ שגיאה ביצירת חיבור WebSocket:', error)
        setWsStatus('שגיאה')
      }
    }

    // התחלת חיבור
    connect()

    return () => {
      // ניקוי החיבור
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const loadLockers = async () => {
    console.log('📊 מתחיל לטעון לוקרים...')
    console.log('📊 נקרא מ:', new Error().stack?.split('\n')[2] || 'לא ידוע')
    setError('')
    const startTime = Date.now()
    try {
      setLoading(true)
      console.log('🌐 שולח בקשה ל-Railway API:', 'https://lockerweb-production.up.railway.app/api/admin/lockers-management')
      const response = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management')
      console.log('📡 תגובה מהשרת:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText)
        const errorText = `HTTP error! status: ${response.status}`
        setError(errorText)
        throw new Error(errorText)
      }
      
      console.log('📋 מפענח JSON...')
      const data = await response.json()
      console.log('✅ נתונים התקבלו:', data)
      
      if (data.success && Array.isArray(data.lockers)) {
        const validatedLockers = data.lockers.map((locker: any) => ({
          ...locker,
          id: locker.id || Math.random(),
          cells: Array.isArray(locker.cells) ? locker.cells.map((cell: any) => ({
            ...cell,
            id: cell.id || Math.random(),
            cellNumber: cell.cellNumber || cell.id || Math.random()
          })) : []
        }))
        
        console.log(' מעדכן רשימת לוקרים:', validatedLockers.length, 'לוקרים')
        setLockers(validatedLockers)
      } else {
        console.error('שגיאה בטעינת לוקרים:', data.error)
        setError(data.error || 'שגיאה לא ידועה בטעינת לוקרים')
        setLockers([])
      }
    } catch (error) {
      console.error('❌ שגיאה בטעינת לוקרים:', error)
      console.error('🔍 פרטי השגיאה:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      setError(error instanceof Error ? error.message : 'שגיאה בטעינת לוקרים')
      setLockers([])
    } finally {
      const endTime = Date.now()
      const duration = endTime - startTime
      setLoadTime(`${duration}ms`)
      setLoading(false)
      console.log(`✅ טעינת לוקרים הושלמה תוך ${duration}ms`)
    }
  }



  const saveLocker = async (lockerData: Partial<Locker>) => {
    console.log('💾 מתחיל לשמור לוקר:', lockerData)
    try {
      const url = 'https://lockerweb-production.up.railway.app/api/admin/lockers-management'
      const method = lockerData.id ? 'PUT' : 'POST'
      console.log('🌐 שולח בקשה:', method, url)
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lockerData, type: 'locker' })
      })
      console.log('📡 תגובה מהשרת:', response.status, response.statusText)

      if (!response.ok) {
        console.error('❌ HTTP Error בשמירת לוקר:', response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ נתונים התקבלו:', data)
      
      if (data.success) {
        console.log('🔄 מרענן רשימת לוקרים...')
        await loadLockers()
        setShowLockerForm(false)
        setSelectedLocker(null)
        alert('לוקר נשמר בהצלחה!')
      } else {
        console.error('❌ שגיאה ב-API:', data.error)
        alert('❌ שגיאה: ' + (data.error || 'שגיאה לא ידועה'))
      }
    } catch (error) {
      console.error('❌ שגיאה בשמירת לוקר:', error)
      console.error('🔍 פרטי השגיאה:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      alert('שגיאה בשמירת לוקר: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'))
    }
  }

  const saveCell = async (cellData: Partial<Cell>) => {
    try {
      const url = 'https://lockerweb-production.up.railway.app/api/admin/lockers-management'
      const method = cellData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cellData, type: 'cell' })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        await loadLockers()
        setShowCellForm(false)
        setSelectedCell(null)
        alert('תא נשמר בהצלחה!')
      } else {
        alert('שגיאה: ' + (data.error || 'שגיאה לא ידועה'))
      }
    } catch (error) {
      console.error('שגיאה בשמירת תא:', error)
      alert('שגיאה בשמירת תא: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'))
    }
  }

  const deleteItem = async (id: number, type: 'locker' | 'cell') => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק ${type === 'locker' ? 'לוקר' : 'תא'} זה?`)) {
      return
    }

    try {
      const response = await fetch(`https://lockerweb-production.up.railway.app/api/admin/lockers-management?id=${id}&type=${type}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        await loadLockers()
      } else {
        alert('שגיאה: ' + (data.error || 'שגיאה לא ידועה'))
      }
    } catch (error) {
      console.error('שגיאה במחיקה:', error)
      alert('שגיאה במחיקה')
    }
  }

  const deleteLocker = (id: number) => deleteItem(id, 'locker')

  // פונקציה לשליחת הודעות דרך ה-API החדש
  const sendWebSocketMessage = async (message: any) => {
    try {
      // שליחה דרך /api/unlock עבור פקודות פתיחה (כמו בשרת הישן)
      if (message.type === 'unlock') {
        const response = await fetch('https://lockerweb-production.up.railway.app/api/unlock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'unlock',
            id: message.id || message.lockerId,
            cell: message.cell || message.cellId
          })
        })
        
        const data = await response.json()
        console.log('📤 פקודת פתיחה נשלחה:', message, '| תגובה:', data)
        return data
      }
      
      // שליחה דרך /api/ws עבור הודעות אחרות
      const response = await fetch('https://lockerweb-production.up.railway.app/api/ws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      })
      
      const data = await response.json()
      console.log('📤 הודעה נשלחה:', message, '| תגובה:', data)
      return data
    } catch (error) {
      console.error('❌ שגיאה בשליחת הודעה:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // פונקציות בקרת תאים בזמן אמת - משתמש באותו API כמו לוקרי DB
  const unlockCell = async (lockerId: string, cellId: string) => {
    const actionKey = `${lockerId}-${cellId}`
    setControlLoading(prev => ({ ...prev, [actionKey]: true }))
    
    try {
      // מציאת הלוקר במסד הנתונים לפי deviceId
      const lockersResponse = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management')
      const lockersData = await lockersResponse.json()
      
      let dbLockerId = null
      if (lockersData.success) {
        const foundLocker = lockersData.lockers.find((l: any) => l.deviceId === lockerId)
        if (foundLocker) {
          dbLockerId = foundLocker.id
        }
      }
      
      // אם לא נמצא במסד הנתונים, ננסה להשתמש ב-IP מהלוקר החי
      if (!dbLockerId) {
        const liveLocker = liveLockers[lockerId]
        if (liveLocker?.ip) {
          // יצירת לוקר זמני במסד הנתונים
          const createResponse = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'locker',
              name: `לוקר ${lockerId}`,
              location: 'לוקר בזמן אמת',
              description: `לוקר זמני נוצר מ-${liveLocker.ip}`,
              ip: liveLocker.ip,
              port: 80,
              deviceId: lockerId,
              status: 'ONLINE',
              isActive: true
            })
          })
          
          const createData = await createResponse.json()
          if (createData.success) {
            dbLockerId = createData.locker.id
          }
        }
      }
      
      if (!dbLockerId) {
        throw new Error('לא ניתן למצוא או ליצור לוקר במסד הנתונים')
      }
      
      // בדיקה אם הלוקר מחובר
      const liveLocker = liveLockers[lockerId]
      if (!liveLocker) {
        alert(`הלוקר ${lockerId} לא נמצא ברשימת הלוקרים המחוברים. אנא ודא שה-ESP32 מחובר לשרת WebSocket.`)
        return
      }
      
      if (!liveLocker.isOnline) {
        alert(`הלוקר ${lockerId} לא מחובר לשרת WebSocket. אנא ודא שה-ESP32 מחובר ופעיל.`)
        return
      }
      
      console.log(`🔓 מנסה לפתוח תא ${cellId} בלוקר ${lockerId} (DB ID: ${dbLockerId})`)
      
      const requestBody = {
        lockerId: lockerId, // שימוש במזהה הלוקר המקורי (מחרוזת)
        cellId: cellId,
        packageId: `ADMIN-${Date.now()}`, // מזהה ייחודי לפתיחה על ידי מנהל
        clientToken: 'ADMIN-TOKEN' // טוקן מנהל
      }
      
      console.log(`📤 שולח בקשה לפתיחת תא:`, requestBody)
      
      // שימוש ב-API לפתיחת תא
      const response = await fetch('https://lockerweb-production.up.railway.app/api/lockers/unlock-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log(`📥 תגובה מהשרת:`, response.status, response.statusText)
      
      const result = await response.json()
      console.log(`📋 תוצאה מפורטת:`, result)
      
      if (response.ok && result.status === 'success') {
        let message = `תא ${cellId} נפתח בהצלחה בלוקר ${lockerId}`
        
        if (result.simulated) {
          message += '\n\n🔧 הערה: זוהי סימולציה כי ESP32 לא מחובר כרגע.'
        }
        
        alert(message)
        console.log(`✅ ${message}`)
        
        // עדכון מקומי של הסטטוס
        setLiveLockers(prev => ({
          ...prev,
          [lockerId]: {
            ...prev[lockerId],
            cells: {
              ...prev[lockerId]?.cells,
              [cellId]: {
                ...prev[lockerId]?.cells?.[cellId],
                locked: false,
                lastOpened: new Date().toISOString()
              }
            }
          }
        }))
      } else {
        let errorMessage = 'שגיאה לא ידועה'
        
        if (response.status === 503) {
          errorMessage = 'הלוקר לא מחובר לשרת WebSocket. אנא ודא שה-ESP32 מחובר ופעיל.'
        } else if (result.error) {
          errorMessage = result.error
        } else if (result.message) {
          errorMessage = result.message
        }
        
        alert(`שגיאה בפתיחת תא: ${errorMessage}`)
        console.error(`❌ שגיאה בפתיחת תא:`, result)
      }
    } catch (error) {
      console.error('שגיאה בפתיחת תא:', error)
      alert('שגיאה בפתיחת תא: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'))
    } finally {
      setControlLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // טעינת לוקרים מוגדרים מראש (ללא חיבור לשרת חומרה)
  const loadPredefinedLockers = async () => {
    try {
      const response = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management')
      const data = await response.json()
      
      if (data.success) {
        // מסנן רק לוקרים שאין להם deviceId או שלא מחוברים
        const unassignedLockers = data.lockers.filter((locker: Locker) => 
          !locker.deviceId || locker.status !== 'ONLINE'
        )
        setPredefinedLockers(unassignedLockers)
      }
    } catch (error) {
      console.error('שגיאה בטעינת לוקרים מוגדרים:', error)
    }
  }

  // פתיחת דיאלוג שיוך לוקר חי
  const openAssignDialog = (liveLocker: any) => {
    setSelectedLiveLocker(liveLocker)
    setShowAssignDialog(true)
    loadPredefinedLockers()
  }

  // שיוך לוקר חי ללוקר קיים
  const assignToExistingLocker = async (predefinedLockerId: number) => {
    try {
      // קודם נקבל את נתוני הלוקר הקיים
      const existingLocker = predefinedLockers.find(l => l.id === predefinedLockerId)
      if (!existingLocker) {
        throw new Error('לוקר לא נמצא')
      }

      const requestBody = {
          type: 'locker',
          id: predefinedLockerId,
          name: existingLocker.name,
          location: existingLocker.location,
          description: existingLocker.description,
          deviceId: selectedLiveLocker.id,
          ip: selectedLiveLocker.ip,
          port: existingLocker.port || 80,
          status: selectedLiveLocker.isOnline ? 'ONLINE' : 'OFFLINE',
          isActive: existingLocker.isActive
      }
      
      console.log('📤 שולח בקשת PUT עם נתונים:', requestBody)

      const response = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📥 קיבלתי תגובה:', response.status, response.statusText)

      const data = await response.json()

      if (data.success) {
        alert('לוקר חי שויך בהצלחה ללוקר קיים!')
        await loadLockers()
        
        // יצירת תאים אוטומטית אם יש
        if (selectedLiveLocker.cells && Object.keys(selectedLiveLocker.cells).length > 0) {
          await createCellsFromLive(predefinedLockerId, selectedLiveLocker.cells)
        }
        
        setShowAssignDialog(false)
        setSelectedLiveLocker(null)
      } else {
        console.error('❌ שגיאה בשיוך הלוקר:', data)
        alert('שגיאה בשיוך הלוקר: ' + (data.error || 'שגיאה לא ידועה'))
        if (data.fallback) {
          console.log('💡 מידע נוסף:', data.fallback)
        }
      }
    } catch (error) {
      console.error('שגיאה בשיוך לוקר:', error)
      alert('שגיאה בחיבור לשרת')
    }
  }

  // שיוך לוקר חי למערכת (יצירת לוקר חדש)
  const assignLiveLocker = async (liveLocker: any) => {
    try {
      const newLocker = {
        type: 'locker',
        name: `לוקר ${liveLocker.id}`,
        location: 'לא הוגדר',
        description: `לוקר חי מחובר - ${liveLocker.ip}`,
        ip: liveLocker.ip,
        port: 80,
        deviceId: liveLocker.id,
        status: liveLocker.isOnline ? 'ONLINE' : 'OFFLINE',
        isActive: true
      }

      const response = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocker)
      })

      const data = await response.json()

      if (data.success) {
        alert('לוקר נוסף בהצלחה למערכת!')
        await loadLockers()
        
        // יצירת תאים אוטומטית אם יש
        if (liveLocker.cells && Object.keys(liveLocker.cells).length > 0) {
          await createCellsFromLive(data.locker.id, liveLocker.cells)
        }
      } else {
        alert('שגיאה בהוספת הלוקר: ' + data.error)
      }
    } catch (error) {
      console.error('שגיאה בשיוך לוקר:', error)
      alert('שגיאה בחיבור לשרת')
    }
  }

  // יצירת תאים מלוקר חי
  const createCellsFromLive = async (lockerId: number, liveCells: any) => {
    try {
      for (const [cellId, cellData] of Object.entries(liveCells) as [string, any][]) {
        const newCell = {
          type: 'cell',
          lockerId: lockerId,
          cellNumber: parseInt(cellId) || 1,
          code: `LOC${String(lockerId).padStart(3, '0')}_CELL${cellId}`,
          name: `תא ${cellId}`,
          size: 'MEDIUM', // ברירת מחדל
          isActive: true
        }

        await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCell)
        })
      }
      
      await loadLockers()
      console.log('✅ תאים נוצרו אוטומטית מהלוקר החי')
    } catch (error) {
      console.error('שגיאה ביצירת תאים:', error)
    }
  }

  // עדכון הגדרות תא
  const updateCellSettings = async (cellId: number, settings: { size?: string, name?: string, isActive?: boolean }) => {
    try {
      const response = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cell',
          id: cellId,
          ...settings
        })
      })

      const data = await response.json()

      if (data.success) {
        await loadLockers()
        alert('הגדרות התא עודכנו בהצלחה!')
      } else {
        alert('שגיאה בעדכון הגדרות: ' + data.error)
      }
    } catch (error) {
      console.error('שגיאה בעדכון הגדרות:', error)
      alert('שגיאה בחיבור לשרת')
    }
  }

  const controlCell = async (cellId: number, lockerId: number, action: 'open' | 'close') => {
    console.log('🎮 controlCell נקרא:', { cellId, lockerId, action })
    console.log('🔍 טיפוסי פרמטרים:', {
      cellId: typeof cellId,
      lockerId: typeof lockerId,
      action: typeof action
    })
    
    // בדיקת תקינות הפרמטרים
    if (!cellId || !lockerId) {
      console.error('❌ חסרים פרמטרים:', { cellId, lockerId })
      alert('❌ שגיאה: חסרים פרטי תא או לוקר')
      return
    }
    
    console.log('✅ פרמטרים תקינים, ממשיך...')

    const controlKey = `${cellId}-${action}`
    
    // בדיקה שהפונקציה לא רצה כבר
    if (controlLoading[controlKey]) {
      console.log('⚠️ controlCell כבר רץ עבור:', controlKey)
      return
    }
    
    setControlLoading(prev => ({ ...prev, [controlKey]: true }))

    try {
      let response, data
      
      if (action === 'open') {
        console.log('🔓 שולח בקשה לפתיחת תא:', { lockerId, cellId })
        console.log('📤 URL:', 'https://lockerweb-production.up.railway.app/api/lockers/unlock-cell')
        console.log('📤 Method:', 'POST')
        
        const requestBody = {
          lockerId: lockerId,
          cellId: cellId,
          packageId: `ADMIN-${Date.now()}`,
          clientToken: 'ADMIN-TOKEN'
        }
        console.log('📤 Request Body:', requestBody)
        
        // עבור פתיחת תאים, נשתמש ב-API המיוחד שתומך בסימולציה
        response = await fetch('https://lockerweb-production.up.railway.app/api/lockers/unlock-cell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        console.log('📡 תגובה מפתיחת תא:', response.status, response.statusText)
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()))
      } else {
        console.log('🔒 שולח בקשה לסגירת תא:', { lockerId, cellId })
        console.log('📤 URL:', 'https://lockerweb-production.up.railway.app/api/admin/cell-control')
        console.log('📤 Method:', 'POST')
        
        const requestBody = {
          cellId,
          lockerId,
          action,
          userId: 'admin'
        }
        console.log('📤 Request Body:', requestBody)
        
        response = await fetch('https://lockerweb-production.up.railway.app/api/admin/cell-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        console.log('📡 תגובה מסגירת תא:', response.status, response.statusText)
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()))
      }

      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      data = await response.json()
      console.log('📋 נתוני תגובה:', data)
      console.log('📋 מבנה התגובה:', {
        hasSuccess: 'success' in data,
        hasError: 'error' in data,
        hasMessage: 'message' in data,
        hasSimulated: 'simulated' in data,
        keys: Object.keys(data)
      })
      
      // בדיקה אם התגובה הצליחה (תמיכה בשני פורמטים)
      const isSuccess = data.success === true || data.status === 'success'
      console.log('🔍 בדיקת הצלחה:', {
        dataSuccess: data.success,
        dataStatus: data.status,
        isSuccess: isSuccess
      })
      
      if (isSuccess) {
        const actionText = action === 'open' ? 'התא נפתח' : 'התא נסגר'
        console.log(`✅ ${actionText} בהצלחה!`)
        console.log('🔄 קורא ל-loadLockers לעדכון הנתונים...')
        alert(`✅ ${actionText} בהצלחה!`)
        
        // בדיקה שלא נקרא פעמיים
        if (!loading) {
          await loadLockers()
          console.log('✅ loadLockers הושלם')
        } else {
          console.log('⚠️ loadLockers כבר רץ, לא קורא שוב')
        }
      } else {
        console.error('❌ שגיאה בתגובה:', data)
        if (data.simulated) {
          alert('⚠️ לוקר לא זמין כרגע, נסה שוב מאוחר יותר')
        } else {
          alert('❌ שגיאה: ' + (data.error || data.message || 'שגיאה לא ידועה'))
        }
      }
    } catch (error) {
      console.error('❌ שגיאה בבקרת תא:', error)
      console.error('🔍 פרטי השגיאה:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      alert('שגיאה בבקרת תא: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'))
    } finally {
      setControlLoading(prev => ({ ...prev, [controlKey]: false }))
      console.log('🏁 controlCell הסתיים')
      console.log('🏁 מצב loading:', controlKey, 'הוסר')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">טוען נתונים...</p>
          <p className="text-white/60 text-sm mt-2">מתחבר לשרת...</p>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering LockersManagementPage with:', {
    loading,
    lockersCount: lockers.length,
    liveLockersCount: Object.keys(liveLockers).length,
    wsStatus,
    error,
    timestamp: new Date().toISOString()
  })

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">🔧 ניהול לוקרים</h1>
            <p className="text-white/70 text-sm sm:text-base">ממשק ניהול לוקרים ותאים</p>
            <div className="text-xs text-white/50 mt-1">
              סטטוס: {loading ? 'טוען...' : 'מוכן'} | לוקרים: {lockers.length} | זמן: {loadTime || 'לא נמדד'} | שגיאות: {error ? 'כן' : 'לא'}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowLockerForm(true)}
              className="w-full sm:w-auto btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base"
            >
              + הוסף לוקר חדש
            </button>
            <button
              onClick={loadLockers}
              className="w-full sm:w-auto btn bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base"
            >
              🔄 רענן
            </button>
            <button
              onClick={async () => {
                try {
                  setLoading(true)
                  const response = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management')
                  const data = await response.json()
                  console.log('🔍 בדיקה מהירה:', { status: response.status, data })
                  alert(`API בדיקה:\nסטטוס: ${response.status}\nלוקרים: ${data.lockers?.length || 0}\nהצלחה: ${data.success}`)
                } catch (err) {
                  console.error('❌ שגיאה בבדיקה:', err)
                  alert('שגיאה: ' + (err instanceof Error ? err.message : 'שגיאה לא ידועה'))
                } finally {
                  setLoading(false)
                }
              }}
              className="w-full sm:w-auto btn bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base"
            >
              🔍 בדוק API
            </button>
            <button
              onClick={() => {
                console.log('🔍 בדיקת קונסול - מצב נוכחי:', {
                  loading,
                  lockersCount: lockers.length,
                  liveLockersCount: Object.keys(liveLockers).length,
                  wsStatus,
                  error,
                  loadTime,
                  timestamp: new Date().toISOString()
                })
                alert('נבדק בקונסול - פתח את Developer Tools')
              }}
              className="w-full sm:w-auto btn bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base"
            >
              📊 בדוק קונסול
            </button>
          </div>
        </div>

        {/* מידע דיבוג */}
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
          <div className="text-sm text-yellow-300">
            <strong>דיבוג:</strong> הדף נטען בהצלחה. 
            טעינה: {loading ? 'כן' : 'לא'} | 
            לוקרים: {lockers.length} | 
            WebSocket: {wsStatus} | 
            זמן טעינה: {loadTime || 'לא נמדד'} | 
            שגיאות: {error ? error.substring(0, 50) + '...' : 'אין'}
          </div>
        </div>

        {/* הודעה על מצב חיבור */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-blue-500/10 backdrop-blur-md rounded-lg p-6 border border-blue-400/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-400">סטטוס חיבור לשרת החומרה</h3>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  wsStatus === 'מחובר' ? 'bg-green-400 animate-pulse' : 
                  wsStatus === 'מתחבר' ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`}></div>
                <span className="text-sm text-white/70">{wsStatus}</span>
              </div>
            </div>
            
            {Object.keys(liveLockers).length === 0 ? (
              <div className="text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h4 className="text-lg font-bold text-blue-400 mb-2">מחפש לוקרים חיים...</h4>
                <p className="text-white/70 mb-4">
                  המערכת מחפשת לוקרים אמיתיים המחוברים לשרת החומרה בזמן אמת.
                </p>
                {wsStatus !== 'מחובר' && (
                  <p className="text-orange-300 text-sm">
                    💡 וודא שהשרת החומרה פועל על Railway
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-bold text-green-400 mb-2">לוקרים מחוברים:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(liveLockers).map(([lockerId, locker]) => (
                    <div key={lockerId} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{lockerId}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          locker.isOnline ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        {locker.isOnline ? 'מחובר' : 'לא מחובר'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* סטטוס WebSocket */}
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  wsStatus === 'מחובר' ? 'bg-green-400 animate-pulse' : 
                  wsStatus === 'מתחבר' ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`}></div>
                <span className="font-medium text-white">
                  שרת החומרה: {wsStatus}
                </span>
              </div>
              <div className="text-sm text-white/60 truncate max-w-xs">
                {lastMessage && `עדכון אחרון: ${new Date().toLocaleTimeString('he-IL')}`}
              </div>
            </div>
          </div>
        </div>

        {/* לוקרים חיים בזמן אמת */}
        {Object.keys(liveLockers).length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
              לוקרים חיים בזמן אמת ({Object.keys(liveLockers).length})
            </h2>
            <div className="bg-blue-500/10 rounded-lg p-4 mb-4 border border-blue-400/30">
              <p className="text-sm text-blue-300">
                💡 <strong>הסבר:</strong> לוקרים אלה מחוברים לשרת החומרה אך עדיין לא שויכו למערכת. 
                לחץ על "שייך למערכת" כדי להוסיף אותם למערכת ולאפשר שליטה בתאים.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.values(liveLockers).map((liveLocker: any, index: number) => (
                <div key={liveLocker.id || `live_${index}`} className="bg-blue-500/10 backdrop-blur-md rounded-lg p-4 sm:p-6 border border-blue-400/30 hover:bg-blue-500/20 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-4 h-4 rounded-full ${liveLocker.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <h3 className="text-lg font-bold text-white truncate">{String(liveLocker.id)}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          liveLocker.isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {liveLocker.isOnline ? 'מחובר' : 'מנותק'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/70">
                        <div>IP: {String(liveLocker.ip || 'לא מוגדר')}</div>
                        <div>עדכון אחרון: {liveLocker.lastSeen ? new Date(liveLocker.lastSeen).toLocaleString('he-IL') : 'לא מוגדר'}</div>
                        <div>תאים: {Object.keys(liveLocker.cells || {}).length}</div>
                        <div>סטטוס: {liveLocker.isOnline ? '🟢 פעיל' : '🔴 לא פעיל'}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => openAssignDialog(liveLocker)}
                        className="w-full sm:w-auto px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm transition-all"
                      >
                        🔗 שייך למערכת
                      </button>
                      {liveLocker.isOnline && (
                        <button
                          onClick={() => {
                            // רענון נתוני הלוקר
                            console.log('🔄 מרענן נתוני לוקר:', liveLocker.id)
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-all"
                        >
                          🔄 רענן נתונים
                        </button>
                      )}
                    </div>
                  </div>

                  {/* תאים של הלוקר החי - מידע בלבד */}
                  {liveLocker.cells && Object.keys(liveLocker.cells).length > 0 && (
                    <div className="border-t border-white/10 pt-4">
                      <h4 className="text-sm font-semibold text-white mb-3">תאים זמינים (לפני שיוך):</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {Object.entries(liveLocker.cells).map(([cellId, cellData]: [string, any]) => (
                          <div key={`${liveLocker.id}-${cellId}`} className="bg-white/10 rounded-lg p-2 border border-white/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-white">תא {cellId}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                cellData.locked ? 'bg-red-400' : 'bg-green-400'
                              }`}></div>
                            </div>
                            <div className="text-xs text-white/60">
                              <div>{cellData.locked ? 'נעול' : 'פתוח'}</div>
                              {cellData.hasPackage && <div className="text-orange-300">יש חבילה</div>}
                              <div className="text-blue-300 mt-1">⏳ ממתין לשיוך</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* לוקרים במערכת */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full"></span>
            לוקרים במערכת ({lockers.length})
          </h2>
          <div className="bg-white/10 rounded-lg p-4 mb-4 border border-white/20">
            <p className="text-sm text-white/70">
              💡 <strong>הסבר:</strong> לוקרים אלה שויכו למערכת וניתן לשלוט בתאים שלהם.
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          {lockers.map((locker, index) => (
            <div key={locker.id || `locker_${index}`} className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all">
              {/* פרטי לוקר */}
              <div className="border-b border-white/10 pb-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{String(locker.name || `לוקר ${locker.id}`)}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${locker.status === 'ONLINE' ? 'text-green-400' : 'text-red-400'} bg-white/10 inline-block w-fit`}>
                        {String(locker.status || 'לא מוגדר')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      <div><span className="text-white/60">מיקום:</span> <span className="text-white">{String(locker.location || 'לא מוגדר')}</span></div>
                      <div><span className="text-white/60">IP:</span> <span className="text-white">{String(locker.ip || 'לא מוגדר')}</span></div>
                      <div><span className="text-white/60">Device ID:</span> <span className="text-white">{String(locker.deviceId || 'לא מוגדר')}</span></div>
                      <div><span className="text-white/60">סטטוס:</span> <span className={`${locker.status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>{String(locker.status || 'לא מוגדר')}</span></div>
                      <div className="sm:col-span-2"><span className="text-white/60">עדכון אחרון:</span> <span className="text-white">{locker.lastSeen ? new Date(locker.lastSeen).toLocaleString('he-IL') : 'לא מוגדר'}</span></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowLockerForm(true)
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-all"
                    >
                      ✏️ עריכה
                    </button>
                    <button
                      onClick={() => deleteLocker(locker.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-all"
                    >
                      🗑️ מחיקה
                    </button>
                  </div>
                </div>
              </div>

              {/* תאים */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <h4 className="text-lg sm:text-xl font-semibold text-white">תאים ({locker.cells?.length || 0})</h4>
                  {locker.cells.length < 40 && (
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowCellForm(true)
                      }}
                      className="w-full sm:w-auto bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      ➕ הוסף תא
                    </button>
                  )}
                </div>
                
                {locker.cells && locker.cells.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {locker.cells.map((cell, cellIndex) => (
                      <div key={`${locker.id || index}-${cell.cellNumber || cell.id || cellIndex}`} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-white text-sm truncate block">{String(cell.name || `תא ${cell.cellNumber || cell.id}`)}</span>
                            <span className="text-xs text-white/60">#{String(cell.cellNumber || cell.id)}</span>
                          </div>
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cell.status === 'AVAILABLE' ? 'bg-green-400' : cell.status === 'OCCUPIED' ? 'bg-red-400' : 'bg-orange-400'}`}></div>
                        </div>
                        
                        <div className="space-y-1 text-xs text-white/70 mb-3">
                          <div>גודל: {String(cell.size || 'לא מוגדר')}</div>
                          <div>סטטוס: {String(cell.status || 'לא מוגדר')}</div>
                          <div>נעול: {cell.isLocked ? 'כן' : 'לא'}</div>
                          <div>פעיל: {cell.isActive ? 'כן' : 'לא'}</div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              const cellNumber = cell.cellNumber || cell.id
                              const lockerId = locker.id
                              console.log('🔓 כפתור "פתח תא" נלחץ:', { 
                                cellNumber, 
                                lockerId, 
                                lockerName: locker.name,
                                cellName: cell.name,
                                cellStatus: cell.status,
                                lockerStatus: locker.status
                              })
                              
                              if (!cellNumber || !lockerId) {
                                console.error('❌ חסרים פרמטרים:', { cellNumber, lockerId })
                                alert('❌ שגיאה: חסרים פרטי תא או לוקר')
                                return
                              }
                              
                              console.log('✅ פרמטרים תקינים, קורא ל-controlCell')
                              
                              // בדיקה שהדף לא בטעינה
                              if (loading) {
                                console.log('⚠️ הדף בטעינה, לא מבצע פעולה')
                                alert('⚠️ הדף בטעינה, נסה שוב בעוד רגע')
                                return
                              }
                              
                              // בדיקה שהלוקר מחובר
                              if (locker.status !== 'ONLINE') {
                                console.log('⚠️ הלוקר לא מחובר:', locker.status)
                                alert('⚠️ הלוקר לא מחובר כרגע, נסה שוב מאוחר יותר')
                                return
                              }
                              
                              controlCell(cellNumber, lockerId, 'open')
                            }}
                            disabled={controlLoading[`${cell.cellNumber || cell.id}-open`] || locker.status !== 'ONLINE'}
                            className="w-full text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded transition-all"
                            title={`סטטוס: ${controlLoading[`${cell.cellNumber || cell.id}-open`] ? 'טוען...' : 'מוכן'} | לוקר: ${locker.status}`}
                          >
                            {controlLoading[`${cell.cellNumber || cell.id}-open`] ? 'פותח...' : '🔓 פתח'}
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedCell(cell)
                                setSelectedLocker(locker)
                                setShowCellForm(true)
                              }}
                              className="flex-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-1 rounded transition-all"
                              title="עריכת הגדרות תא"
                            >
                              ⚙️
                            </button>
                            <button
                              onClick={() => deleteItem(cell.id, 'cell')}
                              className="flex-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded transition-all"
                              title="מחיקת תא"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* כפתור הוספת תא חדש אם יש פחות מ-40 */}
                    {locker.cells.length < 40 && (
                      <div 
                        onClick={() => {
                          setSelectedLocker(locker)
                          setShowCellForm(true)
                        }}
                        className="bg-white/5 rounded-lg p-3 border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[120px]"
                      >
                        <span className="text-2xl mb-2">➕</span>
                        <span className="text-sm text-white/70">הוסף תא חדש</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-6 text-center">
                    <p className="text-white/50 mb-4">אין תאים בלוקר זה</p>
                    <button
                      onClick={() => {
                        setSelectedLocker(locker)
                        setShowCellForm(true)
                      }}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      ➕ הוסף תא ראשון
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* אין לוקרים */}
        {lockers.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-20">
            <div className="text-6xl sm:text-8xl mb-6">🏢</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">אין לוקרים במערכת</h3>
            <p className="text-white/70 mb-6 text-sm sm:text-base max-w-md mx-auto px-4">
              התחל על ידי הוספת לוקר ראשון למערכת או חיבור לוקרים קיימים
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <h4 className="text-lg font-semibold text-white mb-2">מידע על המצב:</h4>
              <div className="text-sm text-white/70 space-y-1">
                <div>סטטוס טעינה: {loading ? 'טוען...' : 'הושלם'}</div>
                <div>מספר לוקרים: {lockers.length}</div>
                <div>סטטוס WebSocket: {wsStatus}</div>
                <div>לוקרים חיים: {Object.keys(liveLockers).length}</div>
                {error && (
                  <div className="text-red-400 mt-2 p-2 bg-red-500/10 rounded">
                    <strong>שגיאה:</strong> {error}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <button
                onClick={() => setShowLockerForm(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                ➕ הוסף לוקר ראשון
              </button>
              <button
                onClick={loadLockers}
                className="w-full sm:w-auto bg-green-500/20 hover:bg-green-500/30 text-green-300 px-6 py-3 rounded-lg font-medium transition-all"
              >
                🔄 חפש לוקרים מחוברים
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('https://lockerweb-production.up.railway.app/api/admin/lockers-management')
                    const data = await response.json()
                    console.log('🔍 בדיקה ידנית של API:', data)
                    alert(`סטטוס: ${response.status}\nלוקרים: ${data.lockers?.length || 0}\nהצלחה: ${data.success}`)
                  } catch (error) {
                    console.error('❌ שגיאה בבדיקה ידנית:', error)
                    alert('שגיאה בבדיקה: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'))
                  }
                }}
                className="w-full sm:w-auto bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-6 py-3 rounded-lg font-medium transition-all"
              >
                🔍 בדוק API
              </button>
            </div>
          </div>
        )}

        {showLockerForm && (
          <LockerForm
            locker={selectedLocker}
            onSave={saveLocker}
            onCancel={() => {
              setShowLockerForm(false)
              setSelectedLocker(null)
            }}
          />
        )}

        {showCellForm && (
          <CellForm
            cell={selectedCell}
            lockerId={selectedLocker?.id || 0}
            maxCellNumber={selectedLocker ? Math.max(...(selectedLocker.cells.map(c => c.cellNumber)), 0) + 1 : 1}
            onSave={saveCell}
            onCancel={() => {
              setShowCellForm(false)
              setSelectedCell(null)
            }}
          />
        )}

        {showAssignDialog && selectedLiveLocker && (
          <AssignDialog
            liveLocker={selectedLiveLocker}
            predefinedLockers={predefinedLockers}
            onAssignToExisting={assignToExistingLocker}
            onCreateNew={() => {
              assignLiveLocker(selectedLiveLocker)
              setShowAssignDialog(false)
              setSelectedLiveLocker(null)
            }}
            onCancel={() => {
              setShowAssignDialog(false)
              setSelectedLiveLocker(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function LockerForm({ locker, onSave, onCancel }: {
  locker: Locker | null
  onSave: (data: Partial<Locker>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: locker?.name || '',
    location: locker?.location || '',
    description: locker?.description || '',
    ip: locker?.ip || '',
    port: locker?.port || 80,
    deviceId: locker?.deviceId || '',
    isActive: locker?.isActive ?? true
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-xl max-w-md w-full p-6 border border-white/20">
        <h3 className="text-2xl font-bold text-white mb-6">
          {locker ? '✏️ ערוך לוקר' : '➕ הוסף לוקר חדש'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">שם הלוקר</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="לוקר ראשי"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">מיקום</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="כניסה ראשית"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">תיאור</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="תיאור הלוקר..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">כתובת IP</label>
              <input
                type="text"
                value={formData.ip}
                onChange={e => setFormData({...formData, ip: e.target.value})}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
                placeholder="192.168.0.104"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">פורט</label>
              <input
                type="number"
                value={formData.port}
                onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
                placeholder="80"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Device ID</label>
            <input
              type="text"
              value={formData.deviceId}
              onChange={e => setFormData({...formData, deviceId: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              placeholder="ESP32_001"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-5 h-5 text-blue-500 border-white/20 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-white">לוקר פעיל</label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => onSave(locker ? {...formData, id: locker.id} : formData)}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all flex-1"
          >
            💾 שמור
          </button>
          <button 
            onClick={onCancel} 
            className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-6 py-3 rounded-lg font-medium transition-all"
          >
            ❌ ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

function CellForm({ cell, lockerId, maxCellNumber, onSave, onCancel }: {
  cell: Cell | null
  lockerId: number
  maxCellNumber: number
  onSave: (cellData: Partial<Cell>) => Promise<void>
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    cellNumber: cell?.cellNumber || maxCellNumber,
    name: cell?.name || `תא ${maxCellNumber}`,
    size: cell?.size || 'MEDIUM',
    code: cell?.code || `LOC${String(lockerId).padStart(3, '0')}_CELL${String(maxCellNumber).padStart(2, '0')}`,
    isActive: cell?.isActive ?? true
  })

  const sizeOptions = [
    { value: 'SMALL', label: 'קטן', icon: '📦', description: 'מתאים לחבילות קטנות' },
    { value: 'MEDIUM', label: 'בינוני', icon: '📫', description: 'מתאים לרוב החבילות' },
    { value: 'LARGE', label: 'גדול', icon: '🗃️', description: 'מתאים לחבילות גדולות' },
    { value: 'WIDE', label: 'רחב', icon: '📮', description: 'מתאים לחבילות רחבות' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cell) {
      // עדכון תא קיים
      await onSave({
        id: cell.id,
        ...formData
      })
    } else {
      // יצירת תא חדש
      await onSave({
        lockerId,
        ...formData
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6">
          {cell ? 'עריכת תא' : 'הוספת תא חדש'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                מספר תא
              </label>
              <input
                type="number"
                value={formData.cellNumber}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  cellNumber: parseInt(e.target.value) || 1,
                  code: `LOC${String(lockerId).padStart(3, '0')}_CELL${String(parseInt(e.target.value) || 1).padStart(2, '0')}`
                }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                max="40"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                סטטוס
              </label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  isActive: e.target.value === 'active'
                }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="active">פעיל</option>
                <option value="inactive">לא פעיל</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              שם התא
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="תא 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              קוד התא
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="LOC001_CELL01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              גודל התא
            </label>
            <div className="grid grid-cols-2 gap-3">
              {sizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, size: option.value }))}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.size === option.value
                      ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5 text-white/70'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs opacity-70">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              {cell ? 'עדכן תא' : 'הוסף תא'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssignDialog({ liveLocker, predefinedLockers, onAssignToExisting, onCreateNew, onCancel }: {
  liveLocker: any
  predefinedLockers: Locker[]
  onAssignToExisting: (lockerId: number) => void
  onCreateNew: () => void
  onCancel: () => void
}) {
  const [selectedLockerId, setSelectedLockerId] = useState<number | null>(null)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-xl max-w-2xl w-full p-6 border border-white/20 max-h-[80vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          🔗 שיוך לוקר חי למערכת
        </h3>
        
        {/* פרטי הלוקר החי */}
        <div className="bg-blue-500/10 rounded-lg p-4 mb-6 border border-blue-400/30">
          <h4 className="text-lg font-semibold text-blue-400 mb-3">לוקר חי שנבחר:</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-white/60">Device ID:</span> <span className="text-white">{liveLocker.id}</span></div>
            <div><span className="text-white/60">IP:</span> <span className="text-white">{liveLocker.ip}</span></div>
            <div><span className="text-white/60">סטטוס:</span> <span className={liveLocker.isOnline ? 'text-green-400' : 'text-red-400'}>{liveLocker.isOnline ? 'מחובר' : 'לא מחובר'}</span></div>
            <div><span className="text-white/60">תאים:</span> <span className="text-white">{Object.keys(liveLocker.cells || {}).length}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">בחר אפשרות:</h4>
          
          {/* אפשרות 1: שיוך ללוקר קיים */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h5 className="text-md font-medium text-white mb-3">🔗 שייך ללוקר קיים במערכת</h5>
            {predefinedLockers.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {predefinedLockers.map((locker) => (
                  <div
                    key={locker.id}
                    onClick={() => setSelectedLockerId(locker.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedLockerId === locker.id
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-white">{locker.name}</div>
                        <div className="text-sm text-white/60">מיקום: {locker.location}</div>
                        <div className="text-sm text-white/60">תאים: {locker.cells?.length || 0}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedLockerId === locker.id
                          ? 'border-blue-400 bg-blue-400'
                          : 'border-white/40'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-sm">אין לוקרים זמינים לשיוך</p>
            )}
          </div>

          {/* אפשרות 2: יצירת לוקר חדש */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h5 className="text-md font-medium text-white mb-2">➕ צור לוקר חדש במערכת</h5>
            <p className="text-sm text-white/60 mb-3">
              יצירת לוקר חדש עם הפרטים מהלוקר החי
            </p>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={() => selectedLockerId && onAssignToExisting(selectedLockerId)}
            disabled={!selectedLockerId}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all"
          >
            🔗 שייך ללוקר קיים
          </button>
          <button
            onClick={onCreateNew}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
          >
            ➕ צור לוקר חדש
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-6 py-3 rounded-lg font-medium transition-all"
          >
            ❌ ביטול
          </button>
        </div>
      </div>
    </div>
  )
} 