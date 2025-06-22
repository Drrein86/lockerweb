import { NextRequest, NextResponse } from 'next/server'
import { AuditService } from '@/lib/services/audit.service'

interface LogEntry {
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  data?: any;
  timestamp?: string;
}

// מערך זמני לשמירת לוגים (יוחלף במסד נתונים בהמשך)
const logs: LogEntry[] = [];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const filters = {
      action: url.searchParams.get('action') || undefined,
      entityType: url.searchParams.get('entityType') || undefined,
      entityId: url.searchParams.get('entityId') || undefined,
      userId: url.searchParams.get('userId') ? parseInt(url.searchParams.get('userId')!) : undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 1000,
      from: url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined,
      to: url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined
    }

    const logs = await AuditService.getLogs(filters)

    return NextResponse.json({
      success: true,
      data: logs.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        timestamp: log.timestamp,
        success: log.success,
        errorMessage: log.errorMessage,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        user: log.user ? {
          id: log.user.id,
          name: `${log.user.firstName} ${log.user.lastName}`,
          email: log.user.email
        } : null,
        details: log.details
      })),
      total: logs.length
    })

  } catch (error) {
    console.error('❌ שגיאה בקבלת לוגים:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בקבלת לוגי המערכת',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // בדיקת שדות חובה
    if (!body.action || !body.entityType || !body.entityId) {
      return NextResponse.json({
        success: false,
        error: 'שדות חובה חסרים: action, entityType, entityId'
      }, { status: 400 })
    }

    await AuditService.log({
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      userId: body.userId,
      details: body.details,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: body.success ?? true,
      errorMessage: body.errorMessage
    })

    return NextResponse.json({
      success: true,
      message: 'לוג נשמר בהצלחה'
    })

  } catch (error) {
    console.error('❌ שגיאה בשמירת לוג:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בשמירת הלוג',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 