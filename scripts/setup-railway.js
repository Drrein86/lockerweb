#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚂 מתחיל הגדרת Railway Database...\n');

// בדיקה שיש Railway CLI
try {
  execSync('railway version', { stdio: 'pipe' });
  console.log('✅ Railway CLI מותקן');
} catch (error) {
  console.error('❌ Railway CLI לא מותקן. מתקין...');
  try {
    execSync('npm install -g @railway/cli', { stdio: 'inherit' });
    console.log('✅ Railway CLI הותקן בהצלחה');
  } catch (installError) {
    console.error('❌ שגיאה בהתקנת Railway CLI:', installError.message);
    process.exit(1);
  }
}

console.log('\n📋 השלבים הבאים:');
console.log('1. התחבר ל-Railway: railway login');
console.log('2. צור פרויקט חדש: railway init');
console.log('3. הוסף PostgreSQL: railway add postgresql');
console.log('4. קבל את ה-DATABASE_URL: railway variables');
console.log('5. הוסף את ה-URL לקובץ .env.local');
console.log('6. הרץ migrations: npm run db:migrate');
console.log('7. הרץ seed: npm run db:seed');

console.log('\n🔧 פקודות מוכנות להעתקה:');
console.log('----------------------------');
console.log('railway login');
console.log('railway init');
console.log('railway add postgresql');
console.log('railway variables');
console.log('----------------------------');

// יצירת קובץ .env.example עם הנתונים הדרושים
const envExample = `
# Railway Database
DATABASE_URL="postgresql://username:password@host:port/database"

# WebSocket Hardware Server  
NEXT_PUBLIC_HARDWARE_WS_URL="ws://localhost:3003"
ADMIN_SECRET="86428642"

# JWT & Authentication
JWT_SECRET="super-secret-jwt-key-for-lockerweb-2025" 
NEXTAUTH_URL="http://localhost:3000"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# ESP32 Configuration
ESP32_LOCKER1_IP="192.168.0.104"
ESP32_LOCKER2_IP="192.168.0.105"

# Development
NODE_ENV="development"
`.trim();

fs.writeFileSync('.env.example', envExample);
console.log('\n✅ נוצר קובץ .env.example');

// יצירת סקריפטי npm
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// הוספת סקריפטים חדשים
packageJson.scripts = {
  ...packageJson.scripts,
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy", 
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio",
  "db:reset": "prisma migrate reset",
  "railway:login": "railway login",
  "railway:deploy": "railway up",
  "railway:logs": "railway logs",
  "railway:status": "railway status"
};

// הוספת prisma seed config
packageJson.prisma = {
  seed: "node prisma/seed.js"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ הוספו סקריפטי npm חדשים ל-package.json');

console.log('\n📁 ליצור קובץ seed לנתונים ראשוניים...');

// יצירת קובץ seed
const seedContent = `
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
      where: { code: \`LOC632-CELL-\${i.toString().padStart(2, '0')}\` },
      update: {},
      create: {
        cellNumber: i,
        code: \`LOC632-CELL-\${i.toString().padStart(2, '0')}\`,
        name: \`תא \${i}\`,
        size: i <= 4 ? 'SMALL' : i <= 8 ? 'MEDIUM' : 'LARGE',
        status: 'AVAILABLE',
        isLocked: true,
        isActive: true,
        lockerId: locker1.id
      }
    });

    await prisma.cell.upsert({
      where: { code: \`LOC720-CELL-\${i.toString().padStart(2, '0')}\` },
      update: {},
      create: {
        cellNumber: i,
        code: \`LOC720-CELL-\${i.toString().padStart(2, '0')}\`,
        name: \`תא \${i}\`,
        size: i <= 4 ? 'SMALL' : i <= 8 ? 'MEDIUM' : 'LARGE',
        status: 'AVAILABLE',
        isLocked: true,
        isActive: true,
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
  console.log(\`📊 נוצרו: \${1} משתמשים, \${2} לוקרים, \${24} תאים, \${1} לקוחות\`);
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
`.trim();

fs.writeFileSync('prisma/seed.js', seedContent);
console.log('✅ נוצר קובץ prisma/seed.js');

console.log('\n🎯 המערכת מוכנה להגדרת Railway!');
console.log('\n📋 השלבים הבאים:');
console.log('1. הרץ: railway login');
console.log('2. הרץ: railway init');  
console.log('3. הרץ: railway add postgresql');
console.log('4. העתק את DATABASE_URL לקובץ .env.local');
console.log('5. הרץ: npm run db:migrate');
console.log('6. הרץ: npm run db:seed');

console.log('\n💡 טיפ: לאחר הקמת Railway, הקובץ .env.local צריך להכיל:');
console.log('DATABASE_URL="postgresql://username:password@host:port/database"'); 