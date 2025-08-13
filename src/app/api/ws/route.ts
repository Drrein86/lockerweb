import { NextRequest } from 'next/server'

// WebSocket upgrade לא נתמך ב-Next.js API routes
// במקום זה, נשתמש ב-Server-Sent Events (SSE) או polling

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const client = searchParams.get('client')
  
  // בדיקה אם זו בקשת WebSocket upgrade
  const upgrade = request.headers.get('upgrade')
  if (upgrade === 'websocket') {
    // Next.js API routes לא תומכים ב-WebSocket upgrades
    return new Response('WebSocket upgrade not supported in Next.js API routes', {
      status: 426, // Upgrade Required
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'upgrade'
      }
    })
  }
  
  // במקום WebSocket, נחזיר Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // שליחת הודעת התחברות
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to lockerweb SSE',
        timestamp: new Date().toISOString(),
        client: client || 'unknown'
      })}\n\n`)
      
      // שליחת ping כל 30 שניות
      const interval = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        })}\n\n`)
      }, 30000)
      
      // ניקוי כשהחיבור נסגר
      request.signal?.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('📨 WebSocket API received:', data)
    
    // טיפול בהודעות שונות
    switch (data.type) {
      case 'unlock':
        // שליחת פקודת פתיחה
        console.log(`🔓 מבקש פתיחת תא ${data.cell} בלוקר ${data.id}`)
        
        // כאן נשלח ל-ESP32 או נחזיר הודעה
        return Response.json({
          success: true,
          message: `פקודת פתיחה נשלחה לתא ${data.cell} בלוקר ${data.id}`,
          timestamp: new Date().toISOString()
        })
        
      case 'ping':
        return Response.json({
          type: 'pong',
          id: data.id,
          timestamp: new Date().toISOString()
        })
        
      default:
        return Response.json({
          error: 'Unknown message type',
          type: data.type
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ שגיאה ב-WebSocket API:', error)
    return Response.json({
      error: 'Invalid JSON or server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}
