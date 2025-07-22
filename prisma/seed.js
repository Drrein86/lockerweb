const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 מתחיל seed...');

  // יצירת משתמש מנהל
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lockerweb.com' },
    update: {},
    create: {
      email: 'admin@lockerweb.com',
      password: '$2b$10$example.hash.for.admin', // צריך להחליף בהאש אמיתי
      firstName: 'מנהל',
      lastName: 'המערכת',
      phone: '0501234567',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // יצירת לוקרים לדוגמה
  const locker1 = await prisma.locker.upsert({
    where: { deviceId: 'LOC632' },
    update: {},
    create: {
      name: 'לוקר מרכז העיר',
      location: 'רחוב הרצל 123, תל אביב',
      description: 'לוקר ראשי במרכז העיר',
      ip: '192.168.0.104',
      port: 80,
      deviceId: 'LOC632',
      status: 'OFFLINE',
      isActive: true
    }
  });

  const locker2 = await prisma.locker.upsert({
    where: { deviceId: 'LOC720' },
    update: {},
    create: {
      name: 'לוקר אוניברסיטה',
      location: 'קמפוס האוניברsity',
      description: 'לוקר באזור האוניברסיטה',
      ip: '192.168.0.105',
      port: 80,
      deviceId: 'LOC720',
      status: 'OFFLINE',
      isActive: true
    }
  });

  // יצירת תאים לכל לוקר
  for (let i = 1; i <= 12; i++) {
    await prisma.cell.upsert({
      where: { code: `LOC632-CELL-${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        cellNumber: i,
        code: `LOC632-CELL-${i.toString().padStart(2, '0')}`,
        name: `תא ${i}`,
        size: i <= 4 ? 'SMALL' : i <= 8 ? 'MEDIUM' : 'LARGE',
        status: 'AVAILABLE',
        isLocked: true,
        isActive: false,  // תאים מתחילים כלא פעילים עד חיבור WebSocket ראשון
        lockerId: locker1.id
      }
    });

    await prisma.cell.upsert({
      where: { code: `LOC720-CELL-${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        cellNumber: i,
        code: `LOC720-CELL-${i.toString().padStart(2, '0')}`,
        name: `תא ${i}`,
        size: i <= 4 ? 'SMALL' : i <= 8 ? 'MEDIUM' : 'LARGE',
        status: 'AVAILABLE',
        isLocked: true,
        isActive: false,  // תאים מתחילים כלא פעילים עד חיבור WebSocket ראשון
        lockerId: locker2.id
      }
    });
  }

  // יצירת לקוח לדוגמה
  const customer = await prisma.customer.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      firstName: 'לקוח',
      lastName: 'לדוגמה',
      phone: '0507654321',
      address: 'רחוב התקווה 45, רמת גן'
    }
  });

  console.log('✅ Seed הושלם בהצלחה!');
  console.log(`📊 נוצרו: ${1} משתמשים, ${2} לוקרים, ${24} תאים, ${1} לקוחות`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ שגיאה ב-seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });