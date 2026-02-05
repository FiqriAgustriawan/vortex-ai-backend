/**
 * Image Generator using Pollinations AI (Authenticated API)
 * Endpoint: https://gen.pollinations.ai/image/
 * Requires API Key
 */

import dotenv from 'dotenv';
dotenv.config();

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
}

export interface ImageGenerationResponse {
  base64: string | null;
  mimeType: string;
  success: boolean;
  error?: string;
}

/**
 * Generate image using Pollinations AI with API key
 */
export const generateImage = async ({
  prompt,
  width = 1024,
  height = 1024,
}: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
  try {
    console.log('=== Image Generation Started ===');
    console.log('Prompt:', prompt);

    if (!POLLINATIONS_API_KEY) {
      console.error('POLLINATIONS_API_KEY not set');
      return {
        base64: null,
        mimeType: 'image/png',
        success: false,
        error: 'Pollinations API key not configured',
      };
    }

    // Clean and encode prompt
    const cleanPrompt = prompt.trim();
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    
    // New authenticated API endpoint
    const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux&width=${width}&height=${height}&nologo=true`;

    console.log('Fetching image from:', imageUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${POLLINATIONS_API_KEY}`,
        'Accept': 'image/*',
      },
    });

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image fetch failed:', response.status, errorText);
      return {
        base64: null,
        mimeType: 'image/png',
        success: false,
        error: `Failed to generate image: ${response.status} - ${errorText}`,
      };
    }

    // Get content type
    const contentType = response.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);

    // Get image as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer received, size:', buffer.length);

    // Check if it's actually an image
    if (!contentType.startsWith('image/') && buffer.length < 1000) {
      console.error('Response is not a valid image');
      return {
        base64: null,
        mimeType: 'image/png',
        success: false,
        error: 'Response is not a valid image',
      };
    }

    // Convert to base64
    const base64 = buffer.toString('base64');
    const mimeType = contentType.startsWith('image/') ? contentType : 'image/png';

    console.log('✅ SUCCESS! Image converted to base64');

    return {
      base64,
      mimeType,
      success: true,
    };

  } catch (error: any) {
    console.error('=== Image Generation Error ===');
    console.error('Error:', error.message);
    
    if (error.name === 'AbortError') {
      return {
        base64: null,
        mimeType: 'image/png',
        success: false,
        error: 'Request timeout - image generation took too long',
      };
    }

    return {
      base64: null,
      mimeType: 'image/png',
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get aspect ratio dimensions
 */
export const getAspectRatioDimensions = (aspectRatio: string): { width: number; height: number } => {
  switch (aspectRatio) {
    case '1:1':
      return { width: 1024, height: 1024 };
    case '16:9':
      return { width: 1344, height: 756 };
    case '9:16':
      return { width: 756, height: 1344 };
    case '4:3':
      return { width: 1200, height: 900 };
    case '3:4':
      return { width: 900, height: 1200 };
    default:
      return { width: 1024, height: 1024 };
  }
};
