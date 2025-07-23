import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ip, deviceId, cells, status } = body

    console.log('📡 רישום לוקר חדש:', { id, ip, deviceId, status })

    if (!id || !id.startsWith('LOC')) {
      return NextResponse.json({
        success: false,
        error: 'מזהה לוקר לא תקין'
      }, { status: 400 })
    }

    try {
      // בדיקה אם הלוקר כבר קיים
      const existingLocker = await prisma.locker.findFirst({
        where: {
          OR: [
            { deviceId: id },
            { ip: ip }
          ]
        }
      })

      if (existingLocker) {
        // עדכון לוקר קיים
        const updatedLocker = await prisma.locker.update({
          where: { id: existingLocker.id },
          data: {
            status: status || 'ONLINE',
            lastSeen: new Date(),
            ip: ip,
            deviceId: id,
            isActive: true
          }
        })

        console.log('✅ לוקר קיים עודכן:', updatedLocker.id)

        return NextResponse.json({
          success: true,
          message: 'לוקר עודכן בהצלחה',
          locker: updatedLocker
        })
      } else {
        // יצירת לוקר חדש
        const newLocker = await prisma.locker.create({
          data: {
            name: `לוקר ${id}`,
            location: `מיקום לא מוגדר`,
            description: `לוקר נרשם אוטומטית מ-${ip}`,
            ip: ip,
            port: 80,
            deviceId: id,
            status: status || 'ONLINE',
            lastSeen: new Date(),
            isActive: true
          }
        })

        // יצירת תאים אם צוינו
        if (cells && typeof cells === 'object') {
          const cellPromises = Object.keys(cells).map(async (cellNumber) => {
            const cellData = cells[cellNumber]
            return await prisma.cell.create({
              data: {
                lockerId: newLocker.id,
                cellNumber: parseInt(cellNumber),
                code: `${id}_CELL${cellNumber.padStart(2, '0')}`,
                name: `תא ${cellNumber}`,
                size: cellData.size || 'MEDIUM',
                status: 'AVAILABLE',
                isLocked: cellData.locked !== false,
                isActive: true
              }
            })
          })

          await Promise.all(cellPromises)
          console.log(`✅ נוצרו ${Object.keys(cells).length} תאים ללוקר ${id}`)
        }

        console.log('✅ לוקר חדש נוצר:', newLocker.id)

        return NextResponse.json({
          success: true,
          message: 'לוקר נרשם בהצלחה',
          locker: newLocker
        })
      }
    } catch (dbError) {
      console.error('❌ שגיאת מסד נתונים:', dbError)
      
      // Fallback response גם כשיש שגיאת DB
      return NextResponse.json({
        success: true,
        message: 'לוקר נרשם במצב סימולציה (בעיה זמנית במסד הנתונים)',
        fallback: true
      })
    }

  } catch (error) {
    console.error('❌ שגיאה ברישום לוקר:', error)
    return NextResponse.json({
      success: false,
      error: 'שגיאה ברישום לוקר',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 