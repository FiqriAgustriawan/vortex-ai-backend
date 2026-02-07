
import dotenv from 'dotenv';
// Removed node-fetch import to use native fetch in Node 18+
// import fetch from 'node-fetch'; 

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not set. Grounding features will not work.');
}

// Model Configuration
const MODEL = 'gemini-2.5-flash';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Topic prompts for different categories
const TOPIC_PROMPTS: Record<string, string> = {
  technology: 'teknologi terbaru, AI, gadget, software, dan inovasi tech',
  business: 'bisnis, ekonomi, startup, investasi, dan pasar saham',
  sports: 'olahraga, sepakbola, basket, MotoGP, Formula 1, dan atletik',
  entertainment: 'film, musik, selebriti, Netflix, dan hiburan',
  science: 'sains, penelitian, discovery, antariksa, dan penemuan ilmiah',
  gaming: 'game, esports, PlayStation, Xbox, Nintendo, dan game mobile',
  world: 'berita internasional, politik global, dan kejadian dunia',
  indonesia: 'berita Indonesia, politik lokal, dan kejadian nasional',
};

// Language instructions
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  id: 'Tulis semua dalam Bahasa Indonesia yang baik dan benar.',
  en: 'Write everything in clear and professional English.',
  es: 'Escribe todo en español claro y profesional.',
  zh: '用清晰专业的中文写作。',
  ja: '明確でプロフェッショナルな日本語で書いてください。',
};

export interface GroundingSource {
  title: string;
  url: string;
}

export interface DigestResult {
  title: string;
  content: string;
  sources: GroundingSource[];
}

/**
 * Generate a news digest using Gemini with Google Grounding via REST API
 * @param topics Array of topic IDs to include
 * @param language Language code for the digest
 * @param customPrompt Optional custom instructions
 */
export async function generateDigest(
  topics: string[],
  language: string = 'id',
  customPrompt?: string
): Promise<DigestResult> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Build topic descriptions
  const topicDescriptions = topics
    .map(t => TOPIC_PROMPTS[t] || t)
    .join(', ');

  const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['id'];

  // Build the prompt
  const promptText = `
Kamu adalah asisten berita profesional. Tugas kamu adalah membuat ringkasan berita harian (Daily Digest).

TOPIK: ${topicDescriptions}

INSTRUKSI:
1. Cari dan rangkum 5-7 berita terpenting hari ini dari topik di atas
2. Untuk setiap berita, berikan:
   - Judul singkat (1 baris)
   - Ringkasan (2-3 kalimat)
   - Mengapa ini penting
3. Urutkan dari yang paling penting/relevan
4. ${langInstruction}
5. Format output dalam Markdown yang rapi
${customPrompt ? `6. Instruksi tambahan: ${customPrompt}` : ''}

FORMAT OUTPUT:
# 📰 Daily Digest - [Tanggal Hari Ini]

## 1. [Judul Berita 1]
[Ringkasan]
**Mengapa penting:** [Penjelasan singkat]

## 2. [Judul Berita 2]
...

---
*Digest ini dibuat otomatis oleh Vortex AI*
`;

  console.log(`📰 Generating digest for topics: ${topics.join(', ')} in ${language} using ${MODEL}`);

  try {
    const url = `${API_BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`;
    
    // Use global fetch
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        tools: [{
          google_search: {} // Enable Google Grounding (snake_case)
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error Detail:', JSON.stringify(errorData));
      throw new Error(`Gemini API Error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    
    // Extract text content
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada konten yang dihasilkan.';
    
    // Extract grounding sources
    const sources: GroundingSource[] = [];
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            url: chunk.web.uri,
          });
        }
      }
    }

    // Generate title based on topics
    const topicLabels = topics.slice(0, 3).join(', ');
    const title = `Daily Digest: ${topicLabels}`;

    console.log(`✅ Digest generated with ${sources.length} sources`);

    return {
      title,
      content: text,
      sources,
    };
  } catch (error: any) {
    console.error('Grounding API Error:', error.message);
    // Include the original error message in the thrown error so it propagates to API response
    throw new Error(`Gagal generate digest: ${error.message}`);
  }
}

/**
 * Test the grounding service with a simple request
 */
export async function testGrounding(): Promise<string> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const url = `${API_BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Apa berita teknologi terpenting hari ini? Berikan 3 headline singkat.' }]
        }],
        tools: [{
          google_search: {}
        }],
        generationConfig: {
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  } catch (error: any) {
    console.error('Grounding Test Error:', error.message);
    throw error;
  }
}
