import { NextRequest, NextResponse } from 'next/server'
import { getLockerStates } from '@/lib/locker-connections'

export const dynamic = 'force-dynamic'

// API endpoint ראשי זהה לשרת הישן - GET /
export async function GET() {
  try {
    // תגובה זהה לשרת הישן
    return NextResponse.json({
      message: 'מערכת לוקר חכם - שרת חומרה עם ESP32',
      status: 'פעיל',
      lockers: getLockerStates(),
      timestamp: new Date().toISOString(),
      endpoints: {
        '/': 'מידע כללי על השרת',
        '/api/unlock': 'POST - פתיחת תא (type, id, cell)'
      }
    }, { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    console.error('❌ שגיאה בAPI הראשי:', error)
    
    return NextResponse.json({
      message: 'שגיאה בשרת',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
  }
}

// טיפול ב-OPTIONS request (CORS preflight)
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
