
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testModel(modelName) {
  console.log(`\n🧪 Testing REST API with ${modelName} & Grounding...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Apa berita terbaru hari ini di Indonesia? Berikan 1 headline.' }]
        }],
        tools: [{
          google_search: {} // snake_case for REST
        }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      // console.log(JSON.stringify(data, null, 2));
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Text:', text ? text.substring(0, 100) + '...' : 'No text');

      const citation = data.candidates?.[0]?.groundingMetadata;
      if (citation) console.log('✅ Grounding metadata present');
      else console.log('⚠️ No grounding metadata');

      return true;
    } else {
      console.log('❌ Error:', response.status);
      console.log(data.error?.message || JSON.stringify(data));
      return false;
    }

  } catch (error) {
    console.error('Fetch error:', error);
    return false;
  }
}

async function runTests() {
  // Test user request first
  await testModel('gemini-2.5-flash');

  // Test standard model as backup
  await testModel('gemini-1.5-flash');

  // Test older 1.5 pro
  await testModel('gemini-1.5-pro');
}

runTests();
