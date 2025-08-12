import { NextRequest, NextResponse } from 'next/server'
import wsManager, { initializeWebSocketIfNeeded } from '@/lib/websocket-server'

export const dynamic = 'force-dynamic'

/**
 * קבלת סטטוס מלא של כל הלוקרים מהזיכרון
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 בקשה לקבלת סטטוס מ-Railway DB');
    
    // וידוא שהWebSocket פועל (בטוח)
    initializeWebSocketIfNeeded();

    const memoryStatus = await wsManager.getFullMemoryStatus();

    return NextResponse.json({
      success: true,
      data: memoryStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ שגיאה בקבלת סטטוס מ-Railway:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בקבלת סטטוס מ-Railway',
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      },
      { status: 500 }
    );
  }
}

/**
 * עדכון פרטי חבילה בזיכרון
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 עדכון פרטי חבילה בזיכרון:', body);

    const { packageId, customerName, customerPhone, customerEmail, notes } = body;

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: 'חסר מזהה חבילה' },
        { status: 400 }
      );
    }

    // עדכון במטמון
    if (!(globalThis as any).packageMemoryCache) {
      (globalThis as any).packageMemoryCache = new Map();
    }

    const existingPackage = (globalThis as any).packageMemoryCache.get(packageId) || {};
    const updatedPackage = {
      ...existingPackage,
      id: packageId,
      customerName: customerName || existingPackage.customerName,
      customerPhone: customerPhone || existingPackage.customerPhone,
      customerEmail: customerEmail || existingPackage.customerEmail,
      notes: notes || existingPackage.notes,
      lastUpdate: new Date()
    };

    (globalThis as any).packageMemoryCache.set(packageId, updatedPackage);

    console.log('✅ פרטי חבילה עודכנו בזיכרון:', updatedPackage);

    return NextResponse.json({
      success: true,
      message: 'פרטי החבילה עודכנו בהצלחה',
      package: updatedPackage
    });

  } catch (error) {
    console.error('❌ שגיאה בעדכון פרטי חבילה:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בעדכון פרטי חבילה',
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      },
      { status: 500 }
    );
  }
}
