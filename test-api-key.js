
const API_KEY = 'AIzaSyDrdcH2Ab2tsZGEUmHF0zTJIuqJ6Ykg4K4'; // From verify-2.5.js
const MODEL = 'gemini-2.5-flash';

async function test() {
  console.log(`Testing API Key with model ${MODEL}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hi' }]
        }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', response.status);
      console.log('Error Details:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

test();
