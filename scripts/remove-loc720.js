const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeLOC720() {
  try {
    console.log('🗑️ מתחיל מחיקת LOC720...');

    // מציאת הלוקר LOC720
    const locker720 = await prisma.locker.findUnique({
      where: { deviceId: 'LOC720' },
      include: {
        cells: true,
        packages: true
      }
    });

    if (!locker720) {
      console.log('ℹ️ LOC720 לא נמצא במסד הנתונים - כנראה כבר נמחק');
      return;
    }

    console.log(`📍 נמצא LOC720 (ID: ${locker720.id}) עם ${locker720.cells.length} תאים ו-${locker720.packages.length} חבילות`);

    // מחיקת חבילות קשורות ללוקר
    if (locker720.packages.length > 0) {
      console.log(`📦 מוחק ${locker720.packages.length} חבילות...`);
      await prisma.package.deleteMany({
        where: { lockerId: locker720.id }
      });
    }

    // מחיקת תאים של הלוקר
    if (locker720.cells.length > 0) {
      console.log(`🔒 מוחק ${locker720.cells.length} תאים...`);
      await prisma.cell.deleteMany({
        where: { lockerId: locker720.id }
      });
    }

    // מחיקת מצבי תאים קשורים
    console.log('🔄 מוחק מצבי תאים...');
    await prisma.cellState.deleteMany({
      where: { 
        cell: {
          lockerId: locker720.id
        }
      }
    });

    // מחיקת מצב הלוקר
    console.log('📊 מוחק מצב לוקר...');
    await prisma.lockerState.deleteMany({
      where: { lockerId: locker720.id }
    });

    // מחיקת לוגים קשורים ללוקר
    console.log('📝 מוחק לוגים קשורים...');
    await prisma.auditLog.deleteMany({
      where: { 
        OR: [
          { details: { contains: 'LOC720' } },
          { details: { contains: locker720.id.toString() } }
        ]
      }
    });

    // מחיקת הלוקר עצמו
    console.log('🗑️ מוחק את הלוקר LOC720...');
    await prisma.locker.delete({
      where: { id: locker720.id }
    });

    console.log('✅ LOC720 נמחק בהצלחה מהמסד!');
    console.log('🎯 כעת יוצג רק LOC632 בממשק');

  } catch (error) {
    console.error('❌ שגיאה במחיקת LOC720:', error);
    throw error;
  }
}

async function main() {
  try {
    await removeLOC720();
  } catch (error) {
    console.error('❌ שגיאה כללית:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// הרצה רק אם הקובץ מופעל ישירות
if (require.main === module) {
  main();
}

module.exports = { removeLOC720 };
