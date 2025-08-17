import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    console.log('🧹 מתחיל תהליך שחרור תאים תפוסים...');

    // מציאת כל התאים התפוסים
    const occupiedCells = await prisma.cell.findMany({
      where: {
        status: 'OCCUPIED'
      },
      include: {
        locker: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`📦 נמצאו ${occupiedCells.length} תאים תפוסים`);

    if (occupiedCells.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'אין תאים תפוסים לשחרור',
        clearedCells: 0
      });
    }

    // רשימה של תאים לעדכון
    const cellsToUpdate = occupiedCells.map(cell => {
      console.log(`   - תא ${cell.cellNumber} בלוקר ${cell.locker.name} (ID: ${cell.id})`);
      return cell.id;
    });

    // שחרור כל התאים - עדכון ל-AVAILABLE
    const updateResult = await prisma.cell.updateMany({
      where: {
        id: {
          in: cellsToUpdate
        }
      },
      data: {
        status: 'AVAILABLE',
        isLocked: false,
        updatedAt: new Date()
      }
    });

    console.log(`✅ עודכנו ${updateResult.count} תאים לסטטוס AVAILABLE`);

    // אופציונלי: מחיקת חבילות ללא מעקב
    const packagesResult = await prisma.package.deleteMany({
      where: {
        cell: {
          id: {
            in: cellsToUpdate
          }
        }
      }
    });

    console.log(`🗑️ נמחקו ${packagesResult.count} חבילות`);

    // אופציונלי: מחיקת לקוחות יתומים (ללא חבילות)
    const orphanCustomers = await prisma.customer.findMany({
      where: {
        packages: {
          none: {}
        }
      }
    });

    if (orphanCustomers.length > 0) {
      const customersResult = await prisma.customer.deleteMany({
        where: {
          id: {
            in: orphanCustomers.map(c => c.id)
          }
        }
      });
      console.log(`👥 נמחקו ${customersResult.count} לקוחות יתומים`);
    }

    return NextResponse.json({
      success: true,
      message: `שוחררו ${updateResult.count} תאים בהצלחה`,
      clearedCells: updateResult.count,
      deletedPackages: packagesResult.count,
      deletedCustomers: orphanCustomers.length,
      details: {
        cellsCleared: occupiedCells.map(cell => ({
          cellId: cell.id,
          cellNumber: cell.cellNumber,
          lockerName: cell.locker.name,
          lockerId: cell.lockerId
        }))
      }
    });

  } catch (error) {
    console.error('❌ שגיאה בשחרור תאים תפוסים:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'שגיאה בשרת', 
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}
