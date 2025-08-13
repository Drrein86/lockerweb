import { NextRequest } from 'next/server'
import { addSSEConnection, removeSSEConnection, broadcastStatus } from '@/lib/broadcast-status'

export const dynamic = 'force-dynamic'

// Server-Sent Events endpoint לעדכונים בזמן אמת (במקום WebSocket)
export async function GET(request: NextRequest) {
  // בדיקת authentication למנהלים
  const authHeader = request.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET || '86428642'
  
  if (!authHeader || !authHeader.includes(adminSecret)) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  console.log('🔄 Admin מתחבר ל-status stream')
  
  // יצירת SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // הוספת החיבור לרשימה
      addSSEConnection(controller)
      
      // שליחת הודעת חיבור
      const welcomeMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'התחברת בהצלחה לעדכוני סטטוס',
        timestamp: Date.now()
      })}\n\n`
      
      controller.enqueue(new TextEncoder().encode(welcomeMessage))
      
      // שליחת סטטוס ראשוני
      setTimeout(() => broadcastStatus(), 100)
    },
    
    cancel() {
      // ניקוי בעת ניתוק
      console.log('🔄 Admin מתנתק מ-status stream')
      removeSSEConnection(controller)
    }
  })
  
  // החזרת SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
  })
}

// טיפול ב-OPTIONS לCORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
  })
}
