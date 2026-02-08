
const fetch = require('node-fetch'); // Needs node-fetch installed, or use global fetch in Node 18+
// To be safe in local environment which might be older node or CJS, let's try without import first if node-fetch is not there?
// We uninstalled node-fetch from backend. But this is a local script. 
// We can use standard https module or assume Node 18+ (which user has).

async function testProd() {
  console.log('🧪 Testing Production API (vortex-ai-backend.vercel.app)...');

  const url = 'https://vortex-ai-backend.vercel.app/api/digest/test';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test-final-verification', // Add userId to trigger DB save
        topics: ['technology', 'gaming'],
        language: 'id',
        customPrompt: 'Singkat saja'
      })
    });

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log(`Status: ${response.status}`);

    if (response.ok) {
      console.log('✅ Success!');
      // Truncate long content for display
      if (data.data && data.data.content) {
        data.data.content = data.data.content.substring(0, 100) + '...';
      }
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error Response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testProd();
