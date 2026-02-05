import mongoose, { Schema, Document } from 'mongoose';

// Guest Profile Interface
export interface IGuestProfile extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  purpose: 'coding' | 'copywriter' | 'research' | 'analysis';
  deviceId?: string;
  sessionCount: number;
  messageCount: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Guest Profile Schema
const GuestProfileSchema = new Schema<IGuestProfile>({
  username: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  purpose: { 
    type: String, 
    enum: ['coding', 'copywriter', 'research', 'analysis'], 
    required: true 
  },
  deviceId: {
    type: String,
    default: null
  },
  sessionCount: {
    type: Number,
    default: 1
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Index for faster queries
GuestProfileSchema.index({ username: 1 });
GuestProfileSchema.index({ createdAt: -1 });

// Create and export model
export const GuestProfile = mongoose.models.GuestProfile || mongoose.model<IGuestProfile>('GuestProfile', GuestProfileSchema);
