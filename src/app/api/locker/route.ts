import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// API endpoint שהאדואינו מצפה לו ב-/locker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📨 Arduino request received:', body)

    const { action, cell } = body

    if (action === "unlock") {
      if (!cell) {
        return NextResponse.json(
          { error: "Missing cellId" },
          { status: 400 }
        )
      }

      console.log(`🔓 Arduino unlock request for cell: ${cell}`)

      // TODO: כאן נשלח פקודה לשרת WebSocket או ישירות לארדואינו
      // לעת עתה, נחזיר הצלחה

      return NextResponse.json({
        success: true,
        message: "תא נפתח בהצלחה",
        deviceId: "SYSTEM",
        cell: cell
      })
    }

    else if (action === "ping") {
      console.log('🏓 Arduino ping received')
      
      return NextResponse.json({
        pong: true,
        deviceId: "SYSTEM", 
        status: "online"
      })
    }

    else {
      return NextResponse.json(
        { error: "Unknown action" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Error in Arduino API:', error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint for Arduino status checks
export async function GET() {
  return NextResponse.json({
    status: "Arduino API active",
    timestamp: new Date().toISOString(),
    endpoints: {
      "POST /api/locker": "Arduino commands (unlock, ping)",
      "GET /api/locker": "Status check"
    }
  })
}
