import { Router, Request, Response } from 'express';
import { verifyToken } from '../services/auth';
import {
  createConversation,
  getConversationsByUser,
  getConversationById,
  updateConversationTitle,
  deleteConversation,
  addMessage,
  getMessagesByConversation,
  getRecentConversations,
  togglePinConversation
} from '../services/conversation';

const router = Router();

// Middleware to extract user ID from token
const getUserId = (req: Request): string => {
  const authHeader = req.headers.authorization;
  
  // No auth header - use guest
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return 'guest_default';
  }
  
  const token = authHeader.split(' ')[1];
  
  // Check if it's a guest token (starts with 'guest_')
  if (token.startsWith('guest_')) {
    return token; // Use the guest token as userId
  }
  
  // Try to verify as JWT
  const decoded = verifyToken(token);
  if (decoded?.userId) {
    return decoded.userId;
  }
  
  // Fallback to guest_default if verification fails
  return 'guest_default';
};

// Create a new conversation
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    console.log('📝 Creating conversation for userId:', userId);

    // Check conversation limit for guests (increased for demo)
    if (userId.startsWith('guest_')) {
      const existingConversations = await getConversationsByUser(userId);
      // Increased limit from 3 to 100 to avoid locking out during demo/testing
      if (existingConversations.length >= 100) {
        console.log('❌ Guest conversation limit reached:', existingConversations.length);
        return res.status(403).json({ 
          error: 'Limit tercapai',
          message: 'Akun tamu dibatasi 100 percakapan. Silakan hapus percakapan lama.'
        });
      }
    }

    const { title, modelId, modelName } = req.body;
    console.log('📝 Conversation details:', { title, modelId, modelName });
    
    const conversation = await createConversation(userId, title, modelId, modelName);
    console.log('✅ Conversation created:', conversation._id);
    
    res.status(201).json({ conversation });
  } catch (error: any) {
    console.error('Create conversation error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all conversations for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    console.log('📋 Getting conversations for userId:', userId);

    const conversations = await getConversationsByUser(userId);
    console.log('📋 Found conversations:', conversations.length);
    
    res.json({ conversations });
  } catch (error: any) {
    console.error('Get conversations error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent conversations with preview
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const limit = parseInt(req.query.limit as string) || 20;
    const conversations = await getRecentConversations(userId, limit);
    res.json({ conversations });
  } catch (error: any) {
    console.error('Get recent conversations error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single conversation with messages
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversation = await getConversationById(id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await getMessagesByConversation(id);
    
    res.json({ conversation, messages });
  } catch (error: any) {
    console.error('Get conversation error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update conversation title
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const conversation = await updateConversationTitle(id, title);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error: any) {
    console.error('Update conversation error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a conversation
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting conversation:', id);
    await deleteConversation(id);
    console.log('✅ Conversation deleted:', id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete conversation error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pin/Unpin a conversation
router.post('/:id/pin', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversation = await togglePinConversation(id);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error: any) {
    console.error('Pin conversation error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a message to conversation
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }

    const message = await addMessage(id, role, content);
    res.status(201).json({ message });
  } catch (error: any) {
    console.error('Add message error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a conversation
router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const messages = await getMessagesByConversation(id, limit);
    res.json({ messages });
  } catch (error: any) {
    console.error('Get messages error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
