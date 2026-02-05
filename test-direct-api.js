// Direct Gemini REST API Test - Bypasses SDK
const API_KEY = 'AIzaSyDrdcH2Ab2tsZGEUmHF0zTJIuqJ6Ykg4K4';

async function testGeminiDirect() {
  console.log('🧪 Testing Gemini REST API Directly...\n');

  // Test different models
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash', 'gemini-2.5-flash'];

  for (const model of models) {
    console.log(`\n📤 Testing model: ${model}`);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Halo' }]
            }]
          })
        }
      );

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        console.log(`   🎉 MODEL ${model} WORKS!`);
      } else {
        const error = await response.text();
        // Parse error to see if it's 404 (Not Found) or 429 (Quota)
        let errMsg = error;
        try {
          const json = JSON.parse(error);
          errMsg = json.error.message;
        } catch (e) { }
        console.log(`   ❌ Error: ${errMsg.substring(0, 100)}...`);
      }
    } catch (e) {
      console.log(`   ❌ Fetch Error: ${e.message}`);
    }
  }
}

testGeminiDirect();
