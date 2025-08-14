const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 בדיקת נתוני לוקרים במערכת...\n');

  // בדיקה כללית של לוקרים
  const allLockers = await prisma.locker.findMany({
    select: {
      id: true,
      name: true,
      location: true,
      city: true,
      street: true,
      status: true,
      isActive: true,
      deviceId: true,
      _count: {
        select: {
          cells: true
        }
      }
    }
  });

  console.log('📊 כל הלוקרים במערכת:');
  console.table(allLockers);

  // בדיקה ספציפית לתל אביב
  console.log('\n🔍 חיפוש לוקרים בתל אביב...');
  
  const telAvivLockers = await prisma.locker.findMany({
    where: {
      OR: [
        { city: { contains: 'תל אביב', mode: 'insensitive' } },
        { location: { contains: 'תל אביב', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      location: true,
      city: true,
      street: true,
      status: true,
      isActive: true,
      cells: {
        where: {
          isActive: true,
          status: 'AVAILABLE'
        },
        select: {
          id: true,
          cellNumber: true,
          status: true,
          isActive: true
        }
      }
    }
  });

  console.log('🏙️ לוקרים בתל אביב:');
  console.table(telAvivLockers);

  // בדיקה מפורטת של תאים
  for (const locker of telAvivLockers) {
    console.log(`\n📦 תאים בלוקר ${locker.name}:`);
    console.table(locker.cells);
  }

  // סימולציה של החיפוש מהAPI
  console.log('\n🧪 סימולציה של חיפוש API...');
  
  const searchConditions = [
    { city: { contains: 'תל אביב', mode: 'insensitive' } },
    { location: { contains: 'תל אביב', mode: 'insensitive' } }
  ];

  const apiResult = await prisma.locker.findMany({
    where: {
      AND: [
        { isActive: true },
        { status: 'ONLINE' },
        { OR: searchConditions }
      ]
    },
    select: {
      id: true,
      name: true,
      location: true,
      city: true,
      street: true,
      status: true,
      isActive: true,
      cells: {
        where: {
          isActive: true,
          status: 'AVAILABLE'
        }
      }
    }
  });

  console.log('🎯 תוצאות API (עם תנאי ONLINE + isActive):');
  console.table(apiResult);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ שגיאה:', e);
  process.exit(1);
});
