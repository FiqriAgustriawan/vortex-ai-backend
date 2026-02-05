import { Router, Request, Response } from 'express';
import { generateChatResponse, generateStreamingResponse, generateVisionResponse, ChatMessage } from '../services/gemini';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { isDatabaseConnected } from '../database/connection';

const router = Router();

// POST /api/chat - Send message and get AI response
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationId, history, systemPrompt, model, image } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Format history for Gemini
    const formattedHistory: ChatMessage[] = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || msg.text }]
    }));

    let result;

    // If image is provided, use vision model
    if (image && image.base64) {
      result = await generateVisionResponse({
        message,
        imageBase64: image.base64,
        mimeType: image.mimeType || 'image/jpeg',
        systemPrompt,
      });
    } else {
      // Generate AI response
      result = await generateChatResponse({
        message,
        history: formattedHistory,
        systemPrompt,
        model
      });
    }

    // Save messages to database if connected
    if (isDatabaseConnected() && conversationId) {
      await Message.create({
        conversationId,
        role: 'user',
        content: message
      });

      await Message.create({
        conversationId,
        role: 'assistant',
        content: result.response
      });

      // Update conversation
      const conv = await Conversation.findById(conversationId);
      if (conv && conv.title === 'Percakapan Baru') {
        const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
        await Conversation.findByIdAndUpdate(conversationId, { 
          title,
          messageCount: (conv.messageCount || 0) + 2
        });
      }
    }

    res.json({
      response: result.response,
      model: result.model,
      conversationId
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      message: error.message
    });
  }
});

// POST /api/chat/stream - Streaming response
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { message, history, systemPrompt, model, image } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Initial ping to flush headers immediately (Fix for Vercel buffering)
    res.write(': ping\n\n');

    // Filter and format history properly - skip empty messages
    const formattedHistory: ChatMessage[] = (history || [])
      .filter((msg: any) => {
        const content = msg.content || msg.text;
        return content && content.trim().length > 0;
      })
      .map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content || msg.text || '').trim() }]
      }));

    // Use vision if image provided, otherwise use streaming
    if (image && image.base64) {
      const result = await generateVisionResponse({
        message,
        imageBase64: image.base64,
        mimeType: image.mimeType || 'image/jpeg',
        systemPrompt,
      });
      
      // Simulate streaming for vision response
      const words = result.response.split(' ');
      for (let i = 0; i < words.length; i++) {
        const text = words[i] + ' ';
        res.write(`data: ${JSON.stringify({ text, done: false })}\n\n`);
        await new Promise(r => setTimeout(r, 30));
      }
      res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
    } else {
      const stream = generateStreamingResponse({
        message,
        history: formattedHistory,
        systemPrompt,
        model
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ text: chunk, done: false })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
    }

    res.end();
  } catch (error: any) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
    res.end();
  }
});

export default router;
