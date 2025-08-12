import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// WebSocket endpoint information - Railway doesn't support native WebSocket in Next.js API routes
// but we can provide information about WebSocket availability
export async function GET() {
  return NextResponse.json({
    message: 'WebSocket endpoint information',
    status: 'available',
    protocols: {
      arduino: {
        register: "Send device registration with ID and IP",
        unlock: "Receive unlock commands for specific cells", 
        ping: "Heartbeat ping/pong",
        cellClosed: "Report cell status updates",
        openByClient: "Handle client unlock requests"
      }
    },
    note: "WebSocket server runs on separate port in Railway WebSocket server",
    timestamp: new Date().toISOString()
  })
}

// POST endpoint to simulate WebSocket messages for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📨 WebSocket simulation message:', body)

    const { type, id, cell, action } = body

    // Simulate Arduino WebSocket protocol responses
    switch (type) {
      case 'register':
        console.log(`📝 Arduino ${id} registered with IP: ${body.ip}`)
        return NextResponse.json({
          type: 'registerConfirm',
          id: id,
          status: 'registered'
        })

      case 'ping':
        console.log(`🏓 Ping from Arduino ${id}`)
        return NextResponse.json({
          type: 'pong', 
          id: id
        })

      case 'cellClosed':
        console.log(`🔒 Cell ${cell} status: ${body.status} for ${id}`)
        return NextResponse.json({
          type: 'confirmClose',
          id: id,
          cell: cell
        })

      case 'unlock':
        console.log(`🔓 Unlock request for cell ${cell}`)
        return NextResponse.json({
          type: 'unlockConfirm',
          cell: cell,
          status: 'unlocked'
        })

      default:
        return NextResponse.json({
          error: 'Unknown WebSocket message type'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ WebSocket simulation error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
