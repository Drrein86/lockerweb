const { PrismaClient } = require('@prisma/client')

async function testLockersAPI() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 בודק API של לוקרים...')
    
    // בדיקת חיבור
    await prisma.$connect()
    console.log('✅ חיבור ל-Railway DB הצליח')
    
    // בדיקת לוקרים קיימים
    console.log('\n📋 בודק לוקרים קיימים...')
    const existingLockers = await prisma.locker.findMany({
      include: {
        cells: true
      }
    })
    console.log(`📦 נמצאו ${existingLockers.length} לוקרים קיימים`)
    
    if (existingLockers.length > 0) {
      existingLockers.forEach((locker, index) => {
        console.log(`${index + 1}. ${locker.name} (${locker.location}) - ${locker.cells.length} תאים`)
      })
    }
    
    // יצירת לוקר לבדיקה
    console.log('\n🆕 יוצר לוקר לבדיקה...')
    const testLocker = await prisma.locker.create({
      data: {
        name: 'לוקר בדיקה',
        location: 'מיקום בדיקה',
        description: 'לוקר לבדיקה מהscript',
        status: 'OFFLINE',
        isActive: true
      }
    })
    console.log(`✅ לוקר בדיקה נוצר עם ID: ${testLocker.id}`)
    
    // יצירת תאים
    console.log('\n📦 יוצר תאים...')
    const cells = []
    for (let i = 1; i <= 3; i++) {
      const cell = await prisma.cell.create({
        data: {
          cellNumber: i,
          code: `TEST-${testLocker.id}-${String(i).padStart(2, '0')}`,
          name: `תא בדיקה ${i}`,
          size: 'MEDIUM',
          status: 'AVAILABLE',
          isLocked: true,
          isActive: true,
          lockerId: testLocker.id,
          openCount: 0
        }
      })
      cells.push(cell)
      console.log(`✅ תא ${i} נוצר`)
    }
    
    // קריאה מחדש עם תאים
    console.log('\n📋 קורא לוקר עם תאים...')
    const lockerWithCells = await prisma.locker.findUnique({
      where: { id: testLocker.id },
      include: {
        cells: {
          orderBy: { cellNumber: 'asc' }
        }
      }
    })
    
    console.log(`✅ לוקר עם ${lockerWithCells.cells.length} תאים נטען בהצלחה`)
    
    // מחיקת הלוקר
    console.log('\n🗑️ מוחק לוקר בדיקה...')
    await prisma.cell.deleteMany({
      where: { lockerId: testLocker.id }
    })
    await prisma.locker.delete({
      where: { id: testLocker.id }
    })
    console.log('✅ לוקר בדיקה נמחק')
    
    console.log('\n🎉 כל הבדיקות עברו בהצלחה!')
    
  } catch (error) {
    console.error('❌ שגיאה בבדיקת API:', error)
    console.error('📋 פרטי השגיאה:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    })
  } finally {
    await prisma.$disconnect()
  }
}

testLockersAPI()
