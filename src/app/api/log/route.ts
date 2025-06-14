import { NextResponse } from 'next/server';

interface LogEntry {
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  data?: any;
  timestamp?: string;
}

// מערך זמני לשמירת לוגים (יוחלף במסד נתונים בהמשך)
const logs: LogEntry[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { level, message, source, data } = body;

    // בדיקת תקינות
    if (!level || !message || !source) {
      return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 });
    }

    // הוספת הלוג
    const logEntry: LogEntry = {
      level,
      message,
      source,
      data,
      timestamp: new Date().toISOString()
    };

    logs.push(logEntry);

    // שמירת מקסימום 1000 לוגים
    if (logs.length > 1000) {
      logs.shift();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('שגיאה בשמירת לוג:', error);
    return NextResponse.json({ error: 'שגיאה בשמירת הלוג' }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('שגיאה בקריאת לוגים:', error);
    return NextResponse.json({ error: 'שגיאה בקריאת הלוגים' }, { status: 500 });
  }
} 