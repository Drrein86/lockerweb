const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 בדיקת API ישירה...\n');

  const baseUrl = 'https://lockerweb-alpha.vercel.app';

  const tests = [
    { description: 'חיפוש לפי עיר', params: 'city=תל אביב' },
    { description: 'חיפוש לפי רחוב', params: 'street=הרצל' },
    { description: 'חיפוש לפי כתובת מלאה', params: 'location=תל אביב' },
    { description: 'חיפוש לפי עיר ורחוב', params: 'city=תל אביב&street=הרצל' }
  ];

  for (const test of tests) {
    console.log(`🔍 ${test.description}:`);
    console.log(`📡 URL: ${baseUrl}/api/lockers/by-location?${test.params}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/lockers/by-location?${test.params}`);
      const data = await response.json();
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`✅ Found: ${data.found}`);
      console.log(`📦 Lockers: ${data.lockers?.length || 0}`);
      
      if (data.lockers && data.lockers.length > 0) {
        console.log(`🏙️ First locker: ${data.lockers[0].name} - ${data.lockers[0].totalAvailableCells} תאים`);
      }
      
      if (data.error) {
        console.log(`❌ Error: ${data.error}`);
      }
      
      if (data.message) {
        console.log(`💬 Message: ${data.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

testAPI().catch(console.error);
