import { NextRequest, NextResponse } from 'next/server'
import { sendToLockerWithResponse } from '@/lib/pending-requests'
import { isLockerOnline } from '@/lib/locker-connections'

export const dynamic = 'force-dynamic'

// API endpoint זהה לשרת הישן - POST /api/unlock
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('📡 בקשת פתיחת תא מ-Vercel:', data)
    
    const { type, id, cell } = data
    
    // בדיקת פרמטרים נדרשים (כמו בשרת הישן)
    if (type === 'unlock' && id && cell) {
              // שליחת פקודת פתיחה ללוקר דרך WebSocket עם המתנה לתגובה (כמו בשרת הישן)
        const result = await sendToLockerWithResponse(id, {
          type: 'unlock',
          cell: cell
        }, 5000) // 5 שניות timeout כמו בשרת הישן
        
        // שידור הודעת פעולה לכל הלקוחות
        const { broadcastCellOperation } = await import('@/lib/broadcast-status')
        broadcastCellOperation(id, cell, 'unlock', result.success, result.message)
      
      if (result.success) {
        console.log(`✅ תא ${cell} נפתח בלוקר ${id}`)
        
        // תגובה זהה לשרת הישן - הצלחה
        return NextResponse.json({
          success: true,
          message: `תא ${cell} נפתח בהצלחה בלוקר ${id}`,
          lockerId: id,
          cellId: cell,
          simulated: false
        }, { 
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        })
      } else {
        console.log(`❌ כשל בפתיחת תא ${cell} בלוקר ${id}: ${result.message}`)
        
        // תגובה זהה לשרת הישן - כישלון
        return NextResponse.json({
          success: false,
          message: result.message || `לוקר ${id} לא מחובר למערכת`,
          lockerId: id,
          cellId: cell,
          simulated: true
        }, { 
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        })
      }
    } else {
      // תגובה זהה לשרת הישן - חסרים פרמטרים
      return NextResponse.json({
        success: false,
        message: 'חסרים פרמטרים נדרשים (type, id, cell)',
        required: ['type', 'id', 'cell'],
        received: data
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      })
    }
  } catch (error) {
    console.error('❌ שגיאה בעיבוד בקשת פתיחה:', error)
    
    // תגובה זהה לשרת הישן - שגיאת שרת
    return NextResponse.json({
      success: false,
      message: 'שגיאה בשרת',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
  }
}

// טיפול ב-OPTIONS request (CORS preflight) - כמו בשרת הישן
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}