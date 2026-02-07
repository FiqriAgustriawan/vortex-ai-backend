import express, { Request, Response } from 'express';
import { DigestSettings, DigestHistory, DIGEST_TOPICS, DIGEST_LANGUAGES } from '../models';
import { generateDigest, testGrounding } from '../services/grounding';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get available topics and languages
router.get('/options', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        topics: DIGEST_TOPICS,
        languages: DIGEST_LANGUAGES,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's digest settings
router.get('/settings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    let settings = await DigestSettings.findOne({ userId });
    
    // Return default settings if none exist
    if (!settings) {
      settings = new DigestSettings({
        userId,
        enabled: false,
        scheduleTime: '08:00',
        timezone: 'Asia/Jakarta',
        topics: ['technology'],
        language: 'id',
      });
    }
    
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save/update digest settings
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { userId, enabled, scheduleTime, timezone, topics, customPrompt, language, pushToken } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    
    const settings = await DigestSettings.findOneAndUpdate(
      { userId },
      {
        userId,
        enabled,
        scheduleTime,
        timezone,
        topics,
        customPrompt,
        language,
        pushToken,
      },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`📋 Digest settings updated for user: ${userId}`);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register push token
router.post('/push-token', async (req: Request, res: Response) => {
  try {
    const { userId, pushToken } = req.body;
    
    if (!userId || !pushToken) {
      return res.status(400).json({ success: false, error: 'userId and pushToken are required' });
    }
    
    await DigestSettings.findOneAndUpdate(
      { userId },
      { pushToken },
      { upsert: true }
    );
    
    console.log(`📱 Push token registered for user: ${userId}`);
    res.json({ success: true, message: 'Push token registered' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get digest history
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const history = await DigestHistory.find({ userId })
      .sort({ sentAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));
    
    const total = await DigestHistory.countDocuments({ userId });
    
    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single digest detail
router.get('/history/:userId/:digestId', async (req: Request, res: Response) => {
  try {
    const { userId, digestId } = req.params;
    
    const digest = await DigestHistory.findOne({ _id: digestId, userId });
    
    if (!digest) {
      return res.status(404).json({ success: false, error: 'Digest not found' });
    }
    
    // Mark as read
    if (!digest.readAt) {
      digest.readAt = new Date();
      await digest.save();
    }
    
    res.json({ success: true, data: digest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test grounding (manual trigger)
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { userId, topics = ['technology'], language = 'id', customPrompt } = req.body;
    
    console.log(`🧪 Testing digest generation...`);
    
    // Generate digest using grounding
    const result = await generateDigest(topics, language, customPrompt);
    
    // Optionally save to history if userId provided
    if (userId) {
      const historyEntry = new DigestHistory({
        userId,
        title: result.title,
        content: result.content,
        topics,
        language,
        sources: result.sources,
        sentAt: new Date(),
      });
      await historyEntry.save();
      console.log(`💾 Test digest saved to history`);
    }
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Test digest error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quick grounding test
router.get('/test-grounding', async (_req: Request, res: Response) => {
  try {
    console.log(`🧪 Testing Google Grounding connection...`);
    const result = await testGrounding();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vercel Cron endpoint - runs every hour
router.get('/cron', async (req: Request, res: Response) => {
  try {
    // Verify this is a Vercel Cron request (optional security)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('⚠️ Cron request without proper authorization');
      // Continue anyway for now (can be strict in production)
    }

    const currentHour = new Date().getUTCHours();
    console.log(`⏰ Cron triggered at UTC hour: ${currentHour}`);

    // Import scheduler dynamically to avoid circular deps
    const { runDigestScheduler } = await import('../services/digestScheduler');
    const result = await runDigestScheduler(currentHour);

    res.json({
      success: true,
      message: `Scheduler completed for UTC hour ${currentHour}`,
      data: result,
    });
  } catch (error: any) {
    console.error('Cron error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

