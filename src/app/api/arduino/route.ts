import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Arduino-specific endpoint matching the exact protocol from the Arduino code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📡 Arduino Protocol Message:', body)

    const { type, id, action, cell, cellId, lockerId, packageId, clientToken, status } = body

    // Handle Arduino registration (from setup())
    if (type === 'register') {
      console.log(`📝 Arduino ${id} registered with IP: ${body.ip}`)
      console.log(`🏠 Device cells:`, body.cells)
      
      return NextResponse.json({
        type: 'registerConfirm',
        id: id,
        status: 'registered',
        serverTime: new Date().toISOString()
      })
    }

    // Handle unlock command (from Railway to Arduino)
    if (type === 'unlock') {
      const targetCell = cell || cellId
      console.log(`🔓 Unlock command for ${id}, cell: ${targetCell}`)
      
      // Arduino expects no response for basic unlock
      return NextResponse.json({
        success: true,
        message: `Unlock command processed for cell ${targetCell}`
      })
    }

    // Handle openByClient command (from Railway to Arduino)
    if (type === 'openByClient') {
      console.log(`👤 Client unlock request: Locker ${lockerId}, Cell ${cellId}, Package ${packageId}`)
      
      return NextResponse.json({
        type: 'openByClientConfirm',
        lockerId: lockerId,
        cellId: cellId,
        packageId: packageId,
        clientToken: clientToken
      })
    }

    // Handle ping from Arduino
    if (type === 'ping') {
      console.log(`🏓 Ping from Arduino ${id}`)
      
      return NextResponse.json({
        type: 'pong',
        id: id
      })
    }

    // Handle cell status updates (cellClosed from Arduino)
    if (type === 'cellClosed') {
      const targetCell = cell || cellId
      console.log(`🔒 Cell status: ${id} - Cell ${targetCell} is ${status}`)
      
      // Send confirmClose back to Arduino (especially for A1)
      return NextResponse.json({
        type: 'confirmClose',
        id: id,
        cell: targetCell
      })
    }

    // Handle failure reports
    if (type === 'failedToUnlock') {
      console.log(`❌ Unlock failed: ${id} - Cell ${cell}, Reason: ${body.reason}`)
      
      return NextResponse.json({
        type: 'failureAcknowledged',
        id: id,
        cell: cell
      })
    }

    // Handle success reports (openSuccess/openFailed from Arduino)
    if (type === 'openSuccess' || type === 'openFailed') {
      console.log(`📋 Open result: ${type} for ${lockerId}, Cell ${cellId}`)
      
      return NextResponse.json({
        type: 'resultAcknowledged',
        lockerId: lockerId,
        cellId: cellId,
        result: type
      })
    }

    return NextResponse.json({
      error: 'Unknown Arduino message type',
      receivedType: type,
      supportedTypes: ['register', 'unlock', 'openByClient', 'ping', 'cellClosed', 'failedToUnlock', 'openSuccess', 'openFailed']
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Arduino Protocol Error:', error)
    
    return NextResponse.json({
      error: 'Arduino protocol error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint - Arduino protocol documentation
export async function GET() {
  return NextResponse.json({
    name: 'Arduino Protocol Handler',
    status: 'active',
    timestamp: new Date().toISOString(),
    protocol: {
      incoming: {
        register: { 
          description: 'Arduino device registration',
          fields: ['type', 'id', 'ip', 'cells']
        },
        ping: {
          description: 'Heartbeat from Arduino',
          fields: ['type', 'id'] 
        },
        cellClosed: {
          description: 'Cell status update',
          fields: ['type', 'id', 'cell', 'status']
        },
        failedToUnlock: {
          description: 'Unlock failure report',
          fields: ['type', 'id', 'cell', 'reason']
        },
        openSuccess: {
          description: 'Client unlock success',
          fields: ['type', 'lockerId', 'cellId', 'packageId', 'clientToken', 'status']
        },
        openFailed: {
          description: 'Client unlock failure', 
          fields: ['type', 'lockerId', 'cellId', 'packageId', 'clientToken', 'status']
        }
      },
      outgoing: {
        unlock: {
          description: 'Basic unlock command',
          fields: ['type', 'cell']
        },
        openByClient: {
          description: 'Client-initiated unlock',
          fields: ['type', 'lockerId', 'cellId', 'packageId', 'clientToken']
        },
        pong: {
          description: 'Ping response',
          fields: ['type', 'id']
        },
        confirmClose: {
          description: 'Cell close confirmation', 
          fields: ['type', 'id', 'cell']
        }
      }
    }
  })
}
