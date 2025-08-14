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
    update: {
      city: 'תל אביב',
      street: 'הרצל 123',
      location: 'רחוב הרצל 123, תל אביב'
    },
    create: {
      name: 'לוקר מרכז העיר',
      location: 'רחוב הרצל 123, תל אביב',
      city: 'תל אביב',
      street: 'הרצל 123',
      description: 'לוקר ראשי במרכז העיר',
      ip: '192.168.0.104',
      port: 80,
      deviceId: 'LOC632',
      status: 'OFFLINE',
      isActive: true
    }
  });

  // LOC720 הוסר - משתמשים רק ב-LOC632

  // התאים כבר קיימים, לא צריך ליצור חדשים
  const existingCells = await prisma.cell.findMany({
    where: { lockerId: locker1.id }
  });
  console.log(`📦 נמצאו ${existingCells.length} תאים קיימים עבור הלוקר`);

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
  console.log(`📊 נוצרו: ${1} משתמשים, ${1} לוקרים, ${12} תאים, ${1} לקוחות`);
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