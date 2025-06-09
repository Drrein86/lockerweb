import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 מתחיל להכניס נתוני דמה...')

  // יצירת לוקרים
  const locker1 = await prisma.locker.create({
    data: {
      location: 'רחוב הרצל 123, תל אביב',
      description: 'ליד הכניסה הראשית של הבניין'
    }
  })

  const locker2 = await prisma.locker.create({
    data: {
      location: 'שדרות רוטשילד 45, תל אביב',
      description: 'בקומת הקרקע, ליד המעלית'
    }
  })

  const locker3 = await prisma.locker.create({
    data: {
      location: 'רחוב דיזנגוף 200, תל אביב',
      description: 'במרכז המסחרי, קומה 1'
    }
  })

  console.log('✅ נוצרו 3 לוקרים')

  // יצירת תאים עבור לוקר 1
  const cellsLocker1 = [
    { code: 'A1', size: 'SMALL' },
    { code: 'A2', size: 'SMALL' },
    { code: 'A3', size: 'MEDIUM' },
    { code: 'A4', size: 'MEDIUM' },
    { code: 'A5', size: 'LARGE' },
    { code: 'B1', size: 'SMALL' },
    { code: 'B2', size: 'SMALL' },
    { code: 'B3', size: 'MEDIUM' },
    { code: 'B4', size: 'MEDIUM' },
    { code: 'B5', size: 'LARGE' },
    { code: 'C1', size: 'WIDE' },
    { code: 'C2', size: 'WIDE' },
    { code: 'C3', size: 'LARGE' },
    { code: 'C4', size: 'LARGE' },
    { code: 'C5', size: 'MEDIUM' }
  ]

  for (const cell of cellsLocker1) {
    await prisma.cell.create({
      data: {
        lockerId: locker1.id,
        code: cell.code,
        size: cell.size as any,
        isOccupied: false
      }
    })
  }

  // יצירת תאים עבור לוקר 2
  const cellsLocker2 = [
    { code: 'A1', size: 'SMALL' },
    { code: 'A2', size: 'SMALL' },
    { code: 'A3', size: 'SMALL' },
    { code: 'A4', size: 'MEDIUM' },
    { code: 'A5', size: 'MEDIUM' },
    { code: 'B1', size: 'MEDIUM' },
    { code: 'B2', size: 'LARGE' },
    { code: 'B3', size: 'LARGE' },
    { code: 'B4', size: 'WIDE' },
    { code: 'B5', size: 'WIDE' },
    { code: 'C1', size: 'SMALL' },
    { code: 'C2', size: 'SMALL' },
    { code: 'C3', size: 'MEDIUM' },
    { code: 'C4', size: 'LARGE' },
    { code: 'C5', size: 'WIDE' }
  ]

  for (const cell of cellsLocker2) {
    await prisma.cell.create({
      data: {
        lockerId: locker2.id,
        code: cell.code,
        size: cell.size as any,
        isOccupied: false
      }
    })
  }

  // יצירת תאים עבור לוקר 3
  const cellsLocker3 = [
    { code: 'A1', size: 'SMALL' },
    { code: 'A2', size: 'SMALL' },
    { code: 'A3', size: 'MEDIUM' },
    { code: 'A4', size: 'MEDIUM' },
    { code: 'A5', size: 'LARGE' },
    { code: 'B1', size: 'SMALL' },
    { code: 'B2', size: 'MEDIUM' },
    { code: 'B3', size: 'LARGE' },
    { code: 'B4', size: 'WIDE' },
    { code: 'B5', size: 'WIDE' },
    { code: 'C1', size: 'SMALL' },
    { code: 'C2', size: 'MEDIUM' },
    { code: 'C3', size: 'LARGE' },
    { code: 'C4', size: 'WIDE' },
    { code: 'C5', size: 'LARGE' }
  ]

  for (const cell of cellsLocker3) {
    await prisma.cell.create({
      data: {
        lockerId: locker3.id,
        code: cell.code,
        size: cell.size as any,
        isOccupied: false
      }
    })
  }

  console.log('✅ נוצרו 45 תאים (15 בכל לוקר)')

  // יצירת חבילות דמה
  const demoPackages = [
    {
      trackingCode: 'XYZ123ABC',
      userName: 'משה כהן',
      userEmail: 'moshe@example.com',
      userPhone: '+972501234567',
      size: 'SMALL',
      status: 'WAITING'
    },
    {
      trackingCode: 'ABC456DEF',
      userName: 'שרה לוי',
      userEmail: 'sara@example.com',
      userPhone: '+972507654321',
      size: 'MEDIUM',
      status: 'WAITING'
    },
    {
      trackingCode: 'DEF789GHI',
      userName: 'דוד ישראלי',
      userEmail: 'david@example.com',
      userPhone: '+972509876543',
      size: 'LARGE',
      status: 'COLLECTED'
    }
  ]

  // קבלת תאים זמינים
  const availableCells = await prisma.cell.findMany({
    where: { isOccupied: false },
    take: 3
  })

  for (let i = 0; i < demoPackages.length; i++) {
    const pkg = demoPackages[i]
    const cell = availableCells[i]
    
    if (cell) {
      await prisma.package.create({
        data: {
          trackingCode: pkg.trackingCode,
          userName: pkg.userName,
          userEmail: pkg.userEmail,
          userPhone: pkg.userPhone,
          size: pkg.size as any,
          status: pkg.status as any,
          lockerId: cell.lockerId,
          cellId: cell.id
        }
      })

      // עדכון התא לתפוס אם החבילה ממתינה
      if (pkg.status === 'WAITING') {
        await prisma.cell.update({
          where: { id: cell.id },
          data: { isOccupied: true }
        })
      }
    }
  }

  console.log('✅ נוצרו 3 חבילות דמה')

  console.log('🎉 נתוני הדמה הוכנסו בהצלחה!')
  console.log('\n📊 סיכום:')
  console.log('- 3 לוקרים')
  console.log('- 45 תאים')
  console.log('- 3 חבילות דמה')
  console.log('\n🚀 כעת תוכל להפעיל את המערכת עם: npm run dev')
}

main()
  .catch((e) => {
    console.error('❌ שגיאה בהכנסת נתוני דמה:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 