import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// מאלץ את הנתיב להיות דינמי
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, lockerId, ip, status = 'ONLINE' } = body

    console.log(`🔔 PING מתקבל מלוקר: ${deviceId} (${ip})`)

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'חסר מזהה התקן (deviceId)'
      }, { status: 400 })
    }

    // חיפוש הלוקר לפי deviceId או lockerId
    const whereClause = lockerId ? 
      { id: parseInt(lockerId) } : 
      { deviceId: deviceId }

    const locker = await prisma.locker.findFirst({
      where: whereClause
    })

    if (!locker) {
      console.log(`❌ לוקר לא נמצא: ${deviceId}`)
      return NextResponse.json({
        success: false,
        error: 'לוקר לא נמצא במערכת'
      }, { status: 404 })
    }

    // עדכון lastSeen וסטטוס הלוקר
    const updatedLocker = await prisma.locker.update({
      where: { id: locker.id },
      data: {
        lastSeen: new Date(),
        status: status,
        ...(ip && { ip: ip }) // עדכון IP אם סופק
      }
    })

    console.log(`✅ PING מעודכן ללוקר ${locker.name} - ${new Date().toLocaleTimeString('he-IL')}`)

    return NextResponse.json({
      success: true,
      message: 'PING התקבל בהצלחה',
      locker: {
        id: updatedLocker.id,
        name: updatedLocker.name,
        deviceId: updatedLocker.deviceId,
        status: updatedLocker.status,
        lastSeen: updatedLocker.lastSeen,
        ip: updatedLocker.ip
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ שגיאה בעיבוד PING:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בשרת',
      details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// GET - בדיקת זמינות לוקר
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const deviceId = url.searchParams.get('deviceId')
    const lockerId = url.searchParams.get('lockerId')

    if (!deviceId && !lockerId) {
      return NextResponse.json({
        success: false,
        error: 'חסר מזהה התקן או מזהה לוקר'
      }, { status: 400 })
    }

    const whereClause = lockerId ? 
      { id: parseInt(lockerId) } : 
      { deviceId: deviceId }

    const locker = await prisma.locker.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        deviceId: true,
        status: true,
        lastSeen: true,
        ip: true,
        port: true,
        isActive: true
      }
    })

    if (!locker) {
      return NextResponse.json({
        success: false,
        error: 'לוקר לא נמצא'
      }, { status: 404 })
    }

    // חישוב זמן מאז PING אחרון
    const lastSeenDate = locker.lastSeen ? new Date(locker.lastSeen) : null
    const minutesSinceLastSeen = lastSeenDate ? 
      Math.floor((Date.now() - lastSeenDate.getTime()) / (1000 * 60)) : null

    return NextResponse.json({
      success: true,
      locker: {
        ...locker,
        minutesSinceLastSeen,
        isOnline: minutesSinceLastSeen !== null && minutesSinceLastSeen < 5 // אונליין אם PING בחמש דקות האחרונות
      }
    })

  } catch (error) {
    console.error('שגיאה בבדיקת זמינות לוקר:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה בשרת'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 