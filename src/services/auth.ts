import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { isDatabaseConnected } from '../database/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'vortex-ai-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// In-memory user storage fallback
const inMemoryUsers: Map<string, any> = new Map();

// Register a new user
export const registerUser = async (
  email: string,
  name: string,
  password: string
): Promise<{ user: any; token: string } | { error: string }> => {
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (!isDatabaseConnected()) {
      // Check if email exists in memory
      const existing = Array.from(inMemoryUsers.values()).find(u => u.email === email);
      if (existing) {
        return { error: 'Email sudah terdaftar' };
      }

      const id = new Date().getTime().toString();
      const user = {
        _id: id,
        email: email.toLowerCase(),
        name,
        passwordHash,
        settings: {
          theme: 'light',
          defaultModel: 'vortex-flash',
          language: 'id'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      inMemoryUsers.set(id, user);
      
      const token = jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    }

    // Check if email exists in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { error: 'Email sudah terdaftar' };
    }

    const user = new User({
      email: email.toLowerCase(),
      name,
      passwordHash,
      settings: {
        theme: 'light',
        defaultModel: 'vortex-flash',
        language: 'id'
      }
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { passwordHash: _, ...userWithoutPassword } = user.toObject();
    return { user: userWithoutPassword, token };
  } catch (error: any) {
    console.error('Register error:', error.message);
    return { error: 'Gagal mendaftarkan user' };
  }
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: any; token: string } | { error: string }> => {
  try {
    let user: any;

    if (!isDatabaseConnected()) {
      user = Array.from(inMemoryUsers.values()).find(u => u.email === email.toLowerCase());
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return { error: 'Email atau password salah' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: 'Email atau password salah' };
    }

    const userId = isDatabaseConnected() ? user._id.toString() : user._id;
    const token = jwt.sign(
      { userId, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const userObj = isDatabaseConnected() ? user.toObject() : user;
    const { passwordHash: _, ...userWithoutPassword } = userObj;
    return { user: userWithoutPassword, token };
  } catch (error: any) {
    console.error('Login error:', error.message);
    return { error: 'Gagal login' };
  }
};

// Verify JWT token
export const verifyToken = (token: string): { userId: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<any | null> => {
  try {
    if (!isDatabaseConnected()) {
      const user = inMemoryUsers.get(userId);
      if (!user) return null;
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }

    const user = await User.findById(userId).select('-passwordHash').lean();
    return user;
  } catch {
    return null;
  }
};

// Update user settings
export const updateUserSettings = async (
  userId: string,
  settings: Partial<{ theme: string; defaultModel: string; language: string }>
): Promise<any | null> => {
  try {
    if (!isDatabaseConnected()) {
      const user = inMemoryUsers.get(userId);
      if (!user) return null;
      user.settings = { ...user.settings, ...settings };
      user.updatedAt = new Date();
      return user;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { settings } },
      { new: true }
    ).select('-passwordHash').lean();
    
    return user;
  } catch {
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: { name?: string; avatar?: string }
): Promise<any | null> => {
  try {
    if (!isDatabaseConnected()) {
      const user = inMemoryUsers.get(userId);
      if (!user) return null;
      if (updates.name) user.name = updates.name;
      if (updates.avatar) user.avatar = updates.avatar;
      user.updatedAt = new Date();
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select('-passwordHash').lean();
    
    return user;
  } catch {
    return null;
  }
};

// Guest user for unauthenticated users
export const createGuestUser = (): { user: any; token: string } => {
  const guestId = `guest_${Date.now()}`;
  const guestUser = {
    _id: guestId,
    email: `${guestId}@guest.vortex.ai`,
    name: 'Guest User',
    isGuest: true,
    settings: {
      theme: 'light',
      defaultModel: 'vortex-flash',
      language: 'id'
    },
    createdAt: new Date()
  };

  const token = jwt.sign(
    { userId: guestId, email: guestUser.email, isGuest: true },
    JWT_SECRET,
    { expiresIn: '24h' } // Shorter expiry for guests
  );

  return { user: guestUser, token };
};
