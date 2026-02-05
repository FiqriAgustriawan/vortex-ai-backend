import { Router, Request, Response } from 'express';
import { generateImage, getAspectRatioDimensions } from '../services/imagen';

const router = Router();

// POST /api/image/generate - Generate image using Pollinations AI
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get dimensions from aspect ratio
    const { width, height } = getAspectRatioDimensions(aspectRatio);

    // Build prompt with style if provided
    let enhancedPrompt = prompt.trim();
    if (style && style !== 'none' && style !== 'realistic') {
      enhancedPrompt = `${prompt}, ${style} style`;
    }

    console.log(`📨 Image generation request: "${enhancedPrompt}"`);

    const result = await generateImage({
      prompt: enhancedPrompt,
      width,
      height,
    });

    if (!result.success || !result.base64) {
      return res.status(500).json({ error: result.error || 'Failed to generate image' });
    }

    res.json({
      success: true,
      base64: result.base64,
      mimeType: result.mimeType,
      prompt: enhancedPrompt,
      width,
      height,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message,
    });
  }
});

// GET /api/image/styles - Get available styles
router.get('/styles', (req: Request, res: Response) => {
  const styles = [
    { id: 'none', name: 'Default', description: 'No specific style' },
    { id: 'realistic', name: 'Realistic', description: 'Photo-realistic images' },
    { id: 'anime', name: 'Anime', description: 'Japanese animation style' },
    { id: 'digital-art', name: 'Digital Art', description: 'Modern digital artwork' },
    { id: 'oil-painting', name: 'Oil Painting', description: 'Classic oil painting' },
    { id: 'watercolor', name: 'Watercolor', description: 'Soft watercolor style' },
    { id: 'sketch', name: 'Sketch', description: 'Pencil sketch style' },
    { id: '3d-render', name: '3D Render', description: 'CGI and 3D rendering' },
    { id: 'pixel-art', name: 'Pixel Art', description: 'Retro pixel graphics' },
  ];

  res.json({ styles });
});

export default router;
