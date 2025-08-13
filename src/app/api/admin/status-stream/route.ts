import { NextRequest } from 'next/server'
import { addSSEConnection, removeSSEConnection, broadcastStatus } from '@/lib/broadcast-status'

export const dynamic = 'force-dynamic'

// Server-Sent Events endpoint לעדכונים בזמן אמת (במקום WebSocket)
export async function GET(request: NextRequest) {
  // בדיקת authentication למנהלים דרך query parameter
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const adminSecret = process.env.ADMIN_SECRET || '86428642'
  
  if (!secret || secret !== adminSecret) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  console.log('🔄 Admin מתחבר ל-status stream')
  
  // יצירת SSE stream
  let streamController: ReadableStreamDefaultController<any> | null = null
  
  const stream = new ReadableStream({
    start(controller) {
      // שמירת הcontroller למשתנה חיצוני
      streamController = controller
      
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
      if (streamController) {
        removeSSEConnection(streamController)
        streamController = null
      }
    }
  })
  
  // החזרת SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
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
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
  })
}
