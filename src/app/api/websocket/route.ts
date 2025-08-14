import { NextRequest, NextResponse } from 'next/server';
// מערכת WebSocket ישנה מושבתת לטובת HTTP API החדש
// import wsManager, { initializeWebSocketIfNeeded } from '@/lib/websocket-server';

export async function GET() {
  try {
    // המערכת הישנה מושבתת - מחזיר מידע על המערכת החדשה
    const status = {
      message: 'HTTP API מערכת חדשה פעילה',
      timestamp: new Date().toISOString(),
      status: 'migrated_to_http_api',
      newApiEndpoint: '/api/ws',
      note: 'WebSocket הישן הוחלף ב-HTTP API חדש'
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
    console.log('📨 בקשה למערכת החדשה:', body);

    // הפניה למערכת החדשה
    return NextResponse.json({
      message: 'המערכת הישנה הוחלפה',
      status: 'migrated',
      redirectTo: '/api/ws',
      newSystem: 'השתמש ב-HTTP API החדש במקום WebSocket ישן',
      note: 'כל הפונקציונליות עברה ל-/api/ws'
    });

  } catch (error) {
    console.error('❌ שגיאה ב-API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      status: 'error',
      details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 });
  }
} 