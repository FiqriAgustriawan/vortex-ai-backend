import { Router, Request, Response } from 'express';
import { registerUser, loginUser, getUserById, updateUserSettings, updateUserProfile, createGuestUser, verifyToken } from '../services/auth';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, dan password wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const result = await registerUser(email, name, password);

    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Register route error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const result = await loginUser(email, password);

    if ('error' in result) {
      return res.status(401).json({ error: result.error });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Login route error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Guest login
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const result = createGuestUser();
    res.json(result);
  } catch (error: any) {
    console.error('Guest login error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user (requires auth)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Get me error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user settings
router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    const { theme, defaultModel, language } = req.body;
    const settings: any = {};
    if (theme) settings.theme = theme;
    if (defaultModel) settings.defaultModel = defaultModel;
    if (language) settings.language = language;

    const user = await updateUserSettings(decoded.userId, settings);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Update settings error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    const { name, avatar } = req.body;
    const updates: any = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await updateUserProfile(decoded.userId, updates);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
