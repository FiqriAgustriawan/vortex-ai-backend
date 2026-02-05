import mongoose, { Schema, Document } from 'mongoose';

// Conversation Interface
export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;  // Changed to string for guest support
  title: string;
  modelId: string;
  modelName: string;
  messageCount: number;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation Schema
const ConversationSchema = new Schema<IConversation>({
  userId: { 
    type: String,  // Changed to String for guest support
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: true,
    default: 'Percakapan Baru',
    trim: true
  },
  modelId: { 
    type: String, 
    required: true,
    default: 'vortex-flash'
  },
  modelName: {
    type: String,
    required: true,
    default: 'Vortex Flash'
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for faster queries
ConversationSchema.index({ userId: 1, createdAt: -1 });
ConversationSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

// Create and export model
export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
