
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    return;
  }

  const genAI = new GoogleGenAI({ apiKey });

  console.log('🧪 Testing model: gemini-1.5-flash...');

  try {
    // Try without grounding first to verify authentication and model
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Hello, are you working?',
      config: {
        // tools: [{ googleSearch: {} }], // disable grounding for now
      }
    });

    console.log('✅ Basic generation success!');
    console.log('Response:', response.text());

  } catch (error) {
    console.error('❌ Error:', error.message);
    // Print full error object for debugging
    console.dir(error, { depth: null });
  }
}

test();
