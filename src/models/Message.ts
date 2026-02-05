import mongoose, { Schema, Document } from 'mongoose';

// Message Interface
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  createdAt: Date;
}

// Message Schema
const MessageSchema = new Schema<IMessage>({
  conversationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Conversation',
    required: true,
    index: true
  },
  role: { 
    type: String, 
    enum: ['user', 'assistant'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  tokens: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for faster message retrieval
MessageSchema.index({ conversationId: 1, createdAt: 1 });

// Create and export model
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
