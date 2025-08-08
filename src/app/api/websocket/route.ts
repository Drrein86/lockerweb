import { NextRequest, NextResponse } from 'next/server';
import wsManager from '@/lib/websocket-server';

export async function GET() {
  try {
    // הפעלת שרת WebSocket אם לא פועל
    if (!wsManager) {
      return NextResponse.json({
        error: 'WebSocket server not available',
        status: 'error'
      }, { status: 503 });
    }

    // בדיקת מצב השרת
    const status = {
      message: 'WebSocket Server Status',
      timestamp: new Date().toISOString(),
      status: 'active',
      port: process.env.PORT || 3003,
      ssl: process.env.USE_SSL === 'true'
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('❌ שגיאה בבדיקת סטטוס WebSocket:', error);
    return NextResponse.json({
      error: 'Internal server error',
      status: 'error',
      details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, lockerId, message } = body;

    if (action === 'start') {
      // הפעלת שרת WebSocket
      wsManager.start();
      return NextResponse.json({
        message: 'WebSocket server started',
        status: 'success'
      });
    }

    if (action === 'status') {
      // בדיקת סטטוס
      return NextResponse.json({
        message: 'WebSocket server status',
        status: 'success',
        active: true
      });
    }

    return NextResponse.json({
      error: 'Unknown action',
      status: 'error'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ שגיאה ב-WebSocket API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      status: 'error',
      message: '❌ שגיאה ב-WebSocket API',
      details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 });
  }
} 