import { NextRequest, NextResponse } from 'next/server'

// Cache זמני לפקודות ממתינות (במציאות נרצה DB או Redis)
let pendingCommands: { [deviceId: string]: any[] } = {}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const deviceId = searchParams.get('deviceId')
  
  if (!deviceId) {
    return NextResponse.json(
      { error: 'Missing deviceId parameter' },
      { status: 400 }
    )
  }
  
  // החזרת פקודות ממתינות עבור המכשיר
  const commands = pendingCommands[deviceId] || []
  
  // ניקוי הפקודות אחרי שליחה
  if (commands.length > 0) {
    pendingCommands[deviceId] = []
    console.log(`📤 שולח ${commands.length} פקודות ל-${deviceId}:`, commands)
  }
  
  return NextResponse.json({
    deviceId,
    commands,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { targetDeviceId, command } = data
    
    if (!targetDeviceId || !command) {
      return NextResponse.json(
        { error: 'Missing targetDeviceId or command' },
        { status: 400 }
      )
    }
    
    // הוספת פקודה לqueue
    if (!pendingCommands[targetDeviceId]) {
      pendingCommands[targetDeviceId] = []
    }
    
    // שמירת מזהה הבקשה אם קיים (לתמיכה במנגנון timeout)
    const commandWithId = {
      ...command,
      timestamp: new Date().toISOString(),
      id: command.requestId || Math.random().toString(36).substr(2, 9)
    }
    
    pendingCommands[targetDeviceId].push(commandWithId)
    
    console.log(`📥 נוספה פקודה ל-${targetDeviceId}:`, command)
    
    return NextResponse.json({
      success: true,
      message: 'פקודה נוספה לqueue',
      targetDeviceId,
      queueLength: pendingCommands[targetDeviceId].length
    })
    
  } catch (error) {
    console.error('❌ שגיאה בהוספת פקודה:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
