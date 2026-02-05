import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GuestProfile } from '../models/GuestProfile';
import { isDatabaseConnected } from '../database/connection';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vortex-ai-secret';

// In-memory fallback
const inMemoryGuests: Map<string, any> = new Map();

// Register guest with username and purpose
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, purpose, deviceId } = req.body;

    if (!username || username.length < 2) {
      return res.status(400).json({ error: 'Username minimal 2 karakter' });
    }

    if (!purpose || !['coding', 'copywriter', 'research', 'analysis'].includes(purpose)) {
      return res.status(400).json({ error: 'Pilih tujuan penggunaan' });
    }

    let guest: any;
    
    if (!isDatabaseConnected()) {
      // In-memory fallback
      const id = Date.now().toString();
      guest = {
        _id: id,
        username: username.trim(),
        purpose,
        deviceId,
        sessionCount: 1,
        messageCount: 0,
        lastActiveAt: new Date(),
        createdAt: new Date()
      };
      inMemoryGuests.set(id, guest);
    } else {
      // Save to MongoDB
      guest = new GuestProfile({
        username: username.trim(),
        purpose,
        deviceId
      });
      await guest.save();
    }

    // Generate token
    const token = jwt.sign(
      { 
        guestId: guest._id.toString(), 
        username: guest.username,
        purpose: guest.purpose,
        isGuest: true 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`👤 New guest registered: ${username} (${purpose})`);

    res.status(201).json({
      success: true,
      guest: {
        id: guest._id,
        username: guest.username,
        purpose: guest.purpose,
        createdAt: guest.createdAt
      },
      token
    });
  } catch (error: any) {
    console.error('Guest register error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get guest profile by token
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      let guest: any;
      if (!isDatabaseConnected()) {
        guest = inMemoryGuests.get(decoded.guestId);
      } else {
        guest = await GuestProfile.findById(decoded.guestId).lean();
      }

      if (!guest) {
        return res.status(404).json({ error: 'Guest tidak ditemukan' });
      }

      res.json({
        guest: {
          id: guest._id,
          username: guest.username,
          purpose: guest.purpose,
          sessionCount: guest.sessionCount,
          messageCount: guest.messageCount,
          createdAt: guest.createdAt
        }
      });
    } catch {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
  } catch (error: any) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update session/message count
router.post('/activity', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!isDatabaseConnected()) {
      const guest = inMemoryGuests.get(decoded.guestId);
      if (guest) {
        guest.messageCount += 1;
        guest.lastActiveAt = new Date();
      }
    } else {
      await GuestProfile.findByIdAndUpdate(decoded.guestId, {
        $inc: { messageCount: 1 },
        lastActiveAt: new Date()
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all guests (admin)
router.get('/all', async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      const guests = Array.from(inMemoryGuests.values());
      return res.json({ guests, total: guests.length });
    }

    const guests = await GuestProfile.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const total = await GuestProfile.countDocuments();

    res.json({ guests, total });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
