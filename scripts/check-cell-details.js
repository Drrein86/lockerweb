const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 בדיקת פרטי התא הפעיל...\n');

  const activeCell = await prisma.cell.findFirst({
    where: {
      isActive: true,
      status: 'AVAILABLE',
      locker: {
        deviceId: 'LOC632'
      }
    },
    include: {
      locker: {
        select: {
          name: true,
          deviceId: true,
          city: true,
          street: true
        }
      }
    }
  });

  console.log('📦 התא הפעיל:');
  console.table(activeCell);

  // בדיקה כללית של כל התאים
  const allCells = await prisma.cell.findMany({
    where: {
      locker: {
        deviceId: 'LOC632'
      }
    },
    select: {
      id: true,
      cellNumber: true,
      status: true,
      isActive: true,
      size: true
    },
    orderBy: {
      cellNumber: 'asc'
    }
  });

  console.log('\n📊 כל התאים בלוקר LOC632:');
  console.table(allCells);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ שגיאה:', e);
  process.exit(1);
});
