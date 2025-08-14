const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLockerDeviceId() {
  try {
    console.log('🔧 מעדכן deviceId לוקר...');

    // מציאת הלוקר עם ID=4
    const locker = await prisma.locker.findUnique({
      where: { id: 4 }
    });

    if (!locker) {
      console.log('❌ לא נמצא לוקר עם ID=4');
      return;
    }

    console.log(`📍 נמצא לוקר: ID=${locker.id}, שם="${locker.name}", deviceId="${locker.deviceId}"`);

    // עדכון deviceId ל-LOC632
    const updatedLocker = await prisma.locker.update({
      where: { id: 4 },
      data: { deviceId: 'LOC632' }
    });

    console.log(`✅ עודכן לוקר ID=${updatedLocker.id}: deviceId="${updatedLocker.deviceId}"`);
    console.log('🎯 עכשיו פתיחת תאים תעבוד עם LOC632!');

  } catch (error) {
    console.error('❌ שגיאה בעדכון deviceId:', error);
    throw error;
  }
}

async function main() {
  try {
    await updateLockerDeviceId();
  } catch (error) {
    console.error('❌ שגיאה כללית:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateLockerDeviceId };
