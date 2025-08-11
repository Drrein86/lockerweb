console.log('🔍 בודק משתני סביבה ב-Railway...\n');

// בדיקת DATABASE_URL
console.log('📊 DATABASE_URL Status:');
console.log('- exists:', !!process.env.DATABASE_URL);
console.log('- length:', process.env.DATABASE_URL?.length || 0);
console.log('- preview:', process.env.DATABASE_URL ? 
  `${process.env.DATABASE_URL.substring(0, 15)}...` : 'MISSING');

// בדיקת משתנים אחרים
console.log('\n📊 Other Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- WS_PORT:', process.env.WS_PORT);

// הצגת הוראות
if (!process.env.DATABASE_URL) {
  console.log('\n❌ DATABASE_URL חסר!');
  console.log('\n🔧 כדי לתקן:');
  console.log('1. לך ל-Railway Dashboard');
  console.log('2. בחר את הפרויקט שלך');
  console.log('3. לחץ על Variables');
  console.log('4. הוסף: DATABASE_URL = postgresql://postgres:rPmoCrLwGpdnUrxpQHDCGGNboIHTJZJA@maglev.proxy.rlwy.net:49217/railway');
  console.log('5. לחץ Deploy');
} else {
  console.log('\n✅ DATABASE_URL מוגדר נכון!');
}

console.log('\n📌 Railway Environment Status Check Complete');
