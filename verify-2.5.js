const API_KEY = 'AIzaSyDrdcH2Ab2tsZGEUmHF0zTJIuqJ6Ykg4K4';
const MODEL = 'gemini-2.5-flash';

async function verifyModel() {
  console.log(`Checking validity of ${MODEL}...`);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
      }
    );

    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Body: ${text.substring(0, 200)}`);

    if (response.status === 404) {
      console.log('❌ MODEL NOT FOUND');
    } else {
      console.log('✅ MODEL EXISTS (Success or Quota/Auth error)');
    }
  } catch (e) {
    console.error(e);
  }
}

verifyModel();
