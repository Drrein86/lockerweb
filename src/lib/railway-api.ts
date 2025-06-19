// הגדרות API של Railway
const RAILWAY_API_URL = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://your-railway-app.up.railway.app'

// טיפוסים לנתוני לוקר
export interface LockerData {
  id: string
  name: string
  location: string
  ip: string
  port?: number
  deviceId: string
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
  lastSeen: string
  isActive: boolean
  cells: CellData[]
}

export interface CellData {
  id: string
  cellNumber: number
  code: string
  name?: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE'
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'LOCKED' | 'UNLOCKED'
  isLocked: boolean
  isActive: boolean
  hasPackage?: boolean
  packageId?: string
  lastOpenedAt?: string
  lastClosedAt?: string
  openCount: number
}

export interface LockerUpdateData {
  type: 'lockerUpdate'
  data: {
    lockers: Record<string, {
      isOnline: boolean
      lastSeen: string
      cells: Record<string, {
        id: string
        locked: boolean
        hasPackage: boolean
        packageId?: string
      }>
      ip: string
    }>
  }
  timestamp: number
}

/**
 * פונקציה לשליחת נתוני לוקר לשרת Railway
 */
export async function sendLockerDataToRailway(lockerData: LockerData): Promise<{
  success: boolean
  message: string
  data?: any
  error?: string
}> {
  try {
    console.log('🚀 שולח נתוני לוקר לשרת Railway:', lockerData.id)
    
    const response = await fetch(`${RAILWAY_API_URL}/api/lockers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAILWAY_API_KEY || ''}`
      },
      body: JSON.stringify(lockerData)
    })

    console.log('📡 תגובה מהשרת:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ שגיאה מהשרת:', errorText)
      return {
        success: false,
        message: 'שגיאה בשליחת נתונים לשרת',
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()
    console.log('✅ נתונים נשלחו בהצלחה:', data)
    
    return {
      success: true,
      message: 'נתוני לוקר נשלחו בהצלחה לשרת Railway',
      data
    }

  } catch (error) {
    console.error('❌ שגיאה בשליחת נתונים:', error)
    return {
      success: false,
      message: 'שגיאה בחיבור לשרת Railway',
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }
  }
}

/**
 * פונקציה לעדכון נתוני לוקר קיים ב-Railway
 */
export async function updateLockerDataInRailway(lockerId: string, updateData: Partial<LockerData>): Promise<{
  success: boolean
  message: string
  data?: any
  error?: string
}> {
  try {
    console.log('🔄 מעדכן נתוני לוקר ב-Railway:', lockerId)
    
    const response = await fetch(`${RAILWAY_API_URL}/api/lockers/${lockerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAILWAY_API_KEY || ''}`
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        message: 'שגיאה בעדכון נתונים',
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()
    console.log('✅ נתונים עודכנו בהצלחה:', data)
    
    return {
      success: true,
      message: 'נתוני לוקר עודכנו בהצלחה',
      data
    }

  } catch (error) {
    console.error('❌ שגיאה בעדכון נתונים:', error)
    return {
      success: false,
      message: 'שגיאה בחיבור לשרת Railway',
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }
  }
}

/**
 * פונקציה לשליחת עדכון סטטוס לוקר מ-WebSocket
 */
export async function sendLockerUpdateToRailway(updateData: LockerUpdateData): Promise<{
  success: boolean
  message: string
  data?: any
  error?: string
}> {
  try {
    console.log('📨 שולח עדכון סטטוס לוקר ל-Railway:', updateData)
    
    const response = await fetch(`${RAILWAY_API_URL}/api/lockers/status-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAILWAY_API_KEY || ''}`
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        message: 'שגיאה בשליחת עדכון סטטוס',
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()
    console.log('✅ עדכון סטטוס נשלח בהצלחה:', data)
    
    return {
      success: true,
      message: 'עדכון סטטוס נשלח בהצלחה',
      data
    }

  } catch (error) {
    console.error('❌ שגיאה בשליחת עדכון סטטוס:', error)
    return {
      success: false,
      message: 'שגיאה בחיבור לשרת Railway',
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }
  }
}

/**
 * פונקציה לקבלת רשימת לוקרים מ-Railway
 */
export async function getLockersFromRailway(): Promise<{
  success: boolean
  data?: LockerData[]
  error?: string
}> {
  try {
    console.log('📥 מביא רשימת לוקרים מ-Railway')
    
    const response = await fetch(`${RAILWAY_API_URL}/api/lockers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAILWAY_API_KEY || ''}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()
    console.log('✅ רשימת לוקרים התקבלה:', data)
    
    return {
      success: true,
      data: data.lockers || []
    }

  } catch (error) {
    console.error('❌ שגיאה בקבלת רשימת לוקרים:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }
  }
}

/**
 * פונקציה לבדיקת חיבור לשרת Railway
 */
export async function checkRailwayConnection(): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    console.log('🔍 בודק חיבור לשרת Railway')
    
    const response = await fetch(`${RAILWAY_API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAILWAY_API_KEY || ''}`
      }
    })

    if (!response.ok) {
      return {
        success: false,
        message: 'שרת Railway לא זמין',
        error: `HTTP ${response.status}`
      }
    }

    const data = await response.json()
    console.log('✅ חיבור לשרת Railway תקין:', data)
    
    return {
      success: true,
      message: 'חיבור לשרת Railway תקין'
    }

  } catch (error) {
    console.error('❌ שגיאה בבדיקת חיבור:', error)
    return {
      success: false,
      message: 'לא ניתן להתחבר לשרת Railway',
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }
  }
} 