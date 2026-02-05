import mongoose from 'mongoose';
import { Conversation, IConversation } from '../models/Conversation';
import { Message, IMessage } from '../models/Message';
import { isDatabaseConnected } from '../database/connection';

// In-memory storage fallback when MongoDB is not connected
const inMemoryConversations: Map<string, any> = new Map();
const inMemoryMessages: Map<string, any[]> = new Map();

// Create a new conversation
export const createConversation = async (
  userId: string,
  title: string = 'Percakapan Baru',
  modelId: string = 'vortex-flash',
  modelName: string = 'Vortex Flash'
): Promise<any> => {
  if (!isDatabaseConnected()) {
    // Fallback to in-memory
    const id = new Date().getTime().toString();
    const conversation = {
      _id: id,
      userId,
      title,
      modelId,
      modelName,
      messageCount: 0,
      isArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryConversations.set(id, conversation);
    inMemoryMessages.set(id, []);
    return conversation;
  }

  // Store userId as string for guests
  const conversation = new Conversation({
    userId: userId,  // Store as string, not ObjectId
    title,
    modelId,
    modelName
  });
  
  await conversation.save();
  return conversation;
};

// Get all conversations for a user
export const getConversationsByUser = async (userId: string): Promise<any[]> => {
  if (!isDatabaseConnected()) {
    return Array.from(inMemoryConversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Use string query for guest users, ObjectId for real users
  const query = userId.startsWith('guest_') 
    ? { userId: userId, isArchived: false }
    : { userId: userId, isArchived: false };

  return Conversation.find(query)
    .sort({ isPinned: -1, updatedAt: -1 })
    .limit(50)
    .lean();
};

// Get a single conversation by ID
export const getConversationById = async (conversationId: string): Promise<any | null> => {
  if (!isDatabaseConnected()) {
    return inMemoryConversations.get(conversationId) || null;
  }

  return Conversation.findById(conversationId).lean();
};

// Update conversation title
export const updateConversationTitle = async (conversationId: string, title: string): Promise<any | null> => {
  if (!isDatabaseConnected()) {
    const conv = inMemoryConversations.get(conversationId);
    if (conv) {
      conv.title = title;
      conv.updatedAt = new Date();
    }
    return conv;
  }

  return Conversation.findByIdAndUpdate(
    conversationId,
    { title, updatedAt: new Date() },
    { new: true }
  ).lean();
};

// Delete a conversation and its messages
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  console.log('🗑️ Service: Deleting conversation:', conversationId);
  
  if (!isDatabaseConnected()) {
    inMemoryConversations.delete(conversationId);
    inMemoryMessages.delete(conversationId);
    return true;
  }

  try {
    // Delete messages first
    const msgResult = await Message.deleteMany({ conversationId: conversationId });
    console.log('🗑️ Deleted messages:', msgResult.deletedCount);
    
    // Delete conversation
    const convResult = await Conversation.findByIdAndDelete(conversationId);
    console.log('🗑️ Deleted conversation:', convResult ? 'success' : 'not found');
    
    return true;
  } catch (error: any) {
    console.error('🗑️ Delete error:', error.message);
    throw error;
  }
};

// Add a message to a conversation
export const addMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<any> => {
  if (!isDatabaseConnected()) {
    const messages = inMemoryMessages.get(conversationId) || [];
    const message = {
      _id: new Date().getTime().toString(),
      conversationId,
      role,
      content,
      createdAt: new Date()
    };
    messages.push(message);
    inMemoryMessages.set(conversationId, messages);
    
    // Update conversation
    const conv = inMemoryConversations.get(conversationId);
    if (conv) {
      conv.messageCount = messages.length;
      conv.updatedAt = new Date();
      // Auto-generate title from first user message
      if (role === 'user' && messages.length === 1) {
        conv.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      }
    }
    
    return message;
  }

  const message = new Message({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    role,
    content
  });
  
  await message.save();
  
  // Update conversation
  const messageCount = await Message.countDocuments({ conversationId: new mongoose.Types.ObjectId(conversationId) });
  const updates: any = { messageCount, updatedAt: new Date() };
  
  // Auto-generate title from first user message
  if (role === 'user' && messageCount === 1) {
    updates.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
  }
  
  await Conversation.findByIdAndUpdate(conversationId, updates);
  
  return message;
};

// Get messages for a conversation
export const getMessagesByConversation = async (
  conversationId: string,
  limit: number = 100
): Promise<any[]> => {
  if (!isDatabaseConnected()) {
    const messages = inMemoryMessages.get(conversationId) || [];
    return messages.slice(-limit);
  }

  return Message.find({ conversationId: new mongoose.Types.ObjectId(conversationId) })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
};

// Get recent conversations with last message preview
export const getRecentConversations = async (userId: string, limit: number = 20): Promise<any[]> => {
  if (!isDatabaseConnected()) {
    const conversations = Array.from(inMemoryConversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
    
    return conversations.map(conv => {
      const messages = inMemoryMessages.get(conv._id) || [];
      const lastMessage = messages[messages.length - 1];
      return {
        ...conv,
        lastMessage: lastMessage?.content?.substring(0, 100) || ''
      };
    });
  }

  const conversations = await Conversation.find({
    userId: userId,  // Use string, not ObjectId
    isArchived: false
  })
    .sort({ isPinned: -1, updatedAt: -1 })
    .limit(limit)
    .lean();

  // Get last message for each conversation
  const conversationsWithLastMessage = await Promise.all(
    conversations.map(async (conv) => {
      const lastMessage = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .lean();
      
      return {
        ...conv,
        lastMessage: lastMessage?.content?.substring(0, 100) || ''
      };
    })
  );

  return conversationsWithLastMessage;
};

// Pin/Unpin a conversation
export const togglePinConversation = async (conversationId: string): Promise<any | null> => {
  if (!isDatabaseConnected()) {
    const conv = inMemoryConversations.get(conversationId);
    if (conv) {
      conv.isPinned = !conv.isPinned;
    }
    return conv;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;

  conversation.isPinned = !conversation.isPinned;
  await conversation.save();
  return conversation;
};
