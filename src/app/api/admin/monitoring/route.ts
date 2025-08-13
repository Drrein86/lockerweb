import { NextRequest, NextResponse } from 'next/server'
import { 
  getMonitoringStats, 
  getMonitoringReport, 
  checkESP32Devices,
  performLockerDiagnostics,
  checkLockerHealth 
} from '@/lib/esp32-monitoring'

export const dynamic = 'force-dynamic'

// API למעקב אחר ESP32 devices (כמו בשרת הישן)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const lockerId = searchParams.get('lockerId')
  
  try {
    switch (action) {
      case 'stats':
        // סטטיסטיקות מעקב בסיסיות
        return NextResponse.json({
          success: true,
          data: getMonitoringStats(),
          timestamp: new Date().toISOString()
        })
        
      case 'report':
        // דוח מעקב מפורט
        return NextResponse.json({
          success: true,
          data: getMonitoringReport(),
          timestamp: new Date().toISOString()
        })
        
      case 'check':
        // בדיקה מיידית של כל הלוקרים
        const checkResults = checkESP32Devices()
        return NextResponse.json({
          success: true,
          data: checkResults,
          message: 'בדיקת ESP32 devices הושלמה',
          timestamp: new Date().toISOString()
        })
        
      case 'diagnostics':
        // אבחון מפורט של לוקר ספציפי
        if (!lockerId) {
          return NextResponse.json({
            success: false,
            error: 'חסר מזהה לוקר לאבחון'
          }, { status: 400 })
        }
        
        const diagnostics = await performLockerDiagnostics(lockerId)
        return NextResponse.json({
          success: true,
          data: diagnostics,
          timestamp: new Date().toISOString()
        })
        
      case 'health':
        // בדיקת בריאות לוקר ספציפי
        if (!lockerId) {
          return NextResponse.json({
            success: false,
            error: 'חסר מזהה לוקר לבדיקת בריאות'
          }, { status: 400 })
        }
        
        const healthResult = await checkLockerHealth(lockerId)
        return NextResponse.json({
          success: true,
          lockerId,
          health: healthResult,
          timestamp: new Date().toISOString()
        })
        
      default:
        // דוח כללי (ברירת מחדל)
        return NextResponse.json({
          success: true,
          data: getMonitoringReport(),
          message: 'מערכת מעקב ESP32 פעילה',
          endpoints: {
            'GET ?action=stats': 'סטטיסטיקות מעקב',
            'GET ?action=report': 'דוח מעקב מפורט',
            'GET ?action=check': 'בדיקה מיידית',
            'GET ?action=diagnostics&lockerId=LOC123': 'אבחון לוקר ספציפי',
            'GET ?action=health&lockerId=LOC123': 'בדיקת בריאות לוקר'
          },
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('❌ שגיאה במעקב ESP32:', error)
    
    return NextResponse.json({
      success: false,
      error: 'שגיאה במערכת המעקב',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// טיפול ב-OPTIONS לCORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
