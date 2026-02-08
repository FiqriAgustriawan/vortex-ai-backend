
const fetch = require('node-fetch');

async function testPersistence() {
  const userId = `user-${Date.now()}`;
  const url = 'https://vortex-ai-backend.vercel.app/api/digest/settings';

  console.log(`🆔 Testing with userId: ${userId}`);

  // 1. Save Settings
  console.log('💾 Saving settings...');
  const saveRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      enabled: true,
      scheduleTime: '09:00',
      timezone: 'Asia/Jakarta',
      topics: ['technology', 'gaming', 'science'],
      language: 'id',
      customPrompt: 'Test persistence'
    })
  });

  const saveData = await saveRes.json();
  console.log('Save Result:', saveData.success ? '✅ Success' : '❌ Failed');
  if (!saveData.success) {
    console.error(saveData);
    return;
  }

  // 2. Retrieve Settings immediately
  console.log('🔍 Retrieving settings...');
  const getRes = await fetch(`${url}/${userId}`);
  const getData = await getRes.json();

  console.log('Retrieve Result:', getData.success ? '✅ Success' : '❌ Failed');

  // 3. Compare
  const savedTopics = getData.data.topics;
  const expectedTopics = ['technology', 'gaming', 'science'];

  if (JSON.stringify(savedTopics) === JSON.stringify(expectedTopics)) {
    console.log('🎉 Persistence Verified! Data matches.');
  } else {
    console.error('⚠️ Data Mismatch!');
    console.log('Expected:', expectedTopics);
    console.log('Got:', savedTopics);
  }
}

testPersistence();
