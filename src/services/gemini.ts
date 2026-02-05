import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not set. AI features will not work.');
} else {
  console.log('✅ Gemini API Key loaded successfully');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  systemPrompt?: string;
  model?: string;
}

export interface ChatResponse {
  response: string;
  model: string;
}

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `Kamu adalah Vortex AI, asisten AI premium yang ahli dalam programming, analisis, dan penalaran logis.

PRINSIP UTAMA:
1. Setiap jawaban harus terstruktur dengan baik dan mudah dipahami
2. Berikan analisis mendalam, bukan hanya jawaban permukaan
3. Jangan gunakan simbol markdown ** atau __
4. Gunakan paragraf yang jelas dengan baris kosong antar bagian

BAHASA: Gunakan Bahasa Indonesia untuk penjelasan, kode dalam bahasa pemrograman standar.`;

export async function generateChatResponse(request: ChatRequest): Promise<ChatResponse> {
  // Use requested model or default to 2.5-flash
  const modelName = request.model || 'gemini-2.5-flash';
  
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  
  try {
    const systemInstruction = request.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const contents: ChatMessage[] = request.history || [];
    
    contents.push({
      role: 'user',
      parts: [{ text: request.message }]
    });

    console.log(`📤 Sending RAW API request to ${modelName}...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.9,
          topK: 40,
        }
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API Error Body:', errText);
        throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak ada respons.';
    
    console.log(`✅ RAW Response received from ${modelName}`);

    return { response: text, model: modelName };
  } catch (error: any) {
    console.error('Gemini API Error:', error.message);
    throw new Error(`Gagal generate response: ${error.message}`);
  }
}

// Streaming response generator
export async function* generateStreamingResponse(request: ChatRequest): AsyncGenerator<string> {
  // Use requested model or default to 2.5-flash
  const modelName = request.model || 'gemini-2.5-flash';
  
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  
  try {
    const systemInstruction = request.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    
    // Filter history to only valid messages with non-empty text
    const validHistory = (request.history || []).filter(msg => 
      msg && msg.parts && msg.parts.length > 0 && msg.parts[0].text && msg.parts[0].text.trim()
    );
    
    const contents: ChatMessage[] = [...validHistory];
    const userMessage = request.message?.trim();
    if (!userMessage) throw new Error('Message cannot be empty');
    
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    console.log(`📤 Streaming (Simulated) RAW API request to ${modelName}...`);

    // Use standard generateContent (not stream) for reliability
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.9,
          topK: 40,
        }
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API Error Body:', errText);
        throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log(`✅ Response received (Length: ${fullText.length})`);

    // Yield in chunks to simulate streaming
    const chunkSize = 10; // Characters per chunk
    for (let i = 0; i < fullText.length; i += chunkSize) {
        const chunk = fullText.slice(i, i + chunkSize);
        yield chunk;
        // Small delay to simulate typing if needed, but awaiting next yield is enough
        await new Promise(resolve => setTimeout(resolve, 10)); 
    }

  } catch (error: any) {
    console.error('Gemini Streaming Error:', error.message);
    throw new Error(`Gagal streaming response: ${error.message}`);
  }
}

// Vision response for image understanding
export async function generateVisionResponse(request: {
  message: string;
  imageBase64: string;
  mimeType: string;
  systemPrompt?: string;
}): Promise<ChatResponse> {
  const modelName = 'gemini-2.0-flash'; // Vision-capable model
  
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  
  try {
    console.log(`📤 Sending vision request to ${modelName}...`);

    // Clean base64 if it has data URL prefix
    let cleanBase64 = request.imageBase64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    const response = await genAI.models.generateContent({
      model: modelName,
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: request.mimeType,
              data: cleanBase64,
            }
          },
          { text: request.message }
        ]
      }],
      config: {
        systemInstruction: request.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    });

    const text = response.text || 'Maaf, saya tidak bisa menganalisis gambar ini.';
    console.log(`✅ Vision response received from ${modelName}`);

    return { response: text, model: modelName };
  } catch (error: any) {
    console.error('Gemini Vision Error:', error.message);
    throw new Error(`Gagal menganalisis gambar: ${error.message}`);
  }
}
