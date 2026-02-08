const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const USER_ID = 'test-user-' + Date.now();

// Mock console.log for clear output
const log = (msg) => console.log(msg);

async function runTest() {
  log('🧪 Starting Scheduler & Digest Flow Test');
  log(`👤 Test User ID: ${USER_ID}`);

  try {
    // 1. Create Digest Settings
    log('\n1️⃣ Creating Digest Settings...');
    const settingsRes = await fetch(`${BASE_URL}/api/digest/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        enabled: true,
        scheduleTime: '08:00',
        timezone: 'Asia/Jakarta',
        topics: ['technology'],
        language: 'id'
      })
    });
    const settingsData = await settingsRes.json();

    if (settingsData.data.utcHour === 1) {
      log('✅ Timezone calculation correct (08:00 WIB -> 01:00 UTC)');
    } else {
      log(`❌ Timezone calculation wrong! Expected utcHour 1, got ${settingsData.data.utcHour}`);
    }

    // 2. Test Digest Generation
    log('\n2️⃣ Testing Manual Digest Generation...');
    const testRes = await fetch(`${BASE_URL}/api/digest/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        topics: ['technology'],
        language: 'id',
        customPrompt: 'Berikan 1 fakta menarik.'
      })
    });
    const testData = await testRes.json();
    log(`Result: ${testData.data.content.substring(0, 50)}...`);

  } catch (error) {
    log('❌ Test failed: ' + error.message);
  }
}

runTest();
