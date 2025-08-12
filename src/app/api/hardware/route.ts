import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Hardware server endpoint - handles Arduino communication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔧 Hardware server request:', body)

    const { type, action, deviceId, cell, lockerId } = body

    // Handle Arduino registration
    if (type === 'register') {
      console.log(`📝 Arduino ${deviceId} registering...`)
      
      return NextResponse.json({
        success: true,
        message: 'Arduino registered successfully',
        deviceId: deviceId,
        serverTime: new Date().toISOString()
      })
    }

    // Handle unlock commands
    if (action === 'unlock' || type === 'unlock') {
      const targetCell = cell || body.cellId
      const targetDevice = deviceId || lockerId
      
      console.log(`🔓 Unlock command: Device ${targetDevice}, Cell ${targetCell}`)
      
      return NextResponse.json({
        success: true,
        message: `Cell ${targetCell} unlock command sent`,
        deviceId: targetDevice,
        cell: targetCell,
        timestamp: new Date().toISOString()
      })
    }

    // Handle ping
    if (type === 'ping') {
      console.log(`🏓 Ping from ${deviceId}`)
      
      return NextResponse.json({
        type: 'pong',
        deviceId: deviceId,
        timestamp: new Date().toISOString()
      })
    }

    // Handle cell status updates
    if (type === 'cellClosed') {
      console.log(`🔒 Cell status update: ${deviceId} - Cell ${cell} is ${body.status}`)
      
      return NextResponse.json({
        type: 'confirmClose',
        deviceId: deviceId,
        cell: cell,
        received: true
      })
    }

    return NextResponse.json({
      error: 'Unknown command type',
      received: body
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Hardware server error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for hardware server status
export async function GET() {
  return NextResponse.json({
    status: 'Hardware server active',
    timestamp: new Date().toISOString(),
    supportedCommands: [
      'register - Arduino device registration',
      'unlock - Cell unlock commands', 
      'ping - Heartbeat check',
      'cellClosed - Cell status updates'
    ],
    version: '1.0.0'
  })
}
