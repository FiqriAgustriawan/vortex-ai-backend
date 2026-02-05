import mongoose, { Schema, Document } from 'mongoose';

// User Interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  settings: {
    theme: 'light' | 'dark';
    defaultModel: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  avatar: { 
    type: String,
    default: null
  },
  settings: {
    theme: { 
      type: String, 
      enum: ['light', 'dark'], 
      default: 'light' 
    },
    defaultModel: { 
      type: String, 
      default: 'vortex-flash' 
    },
    language: { 
      type: String, 
      default: 'id' 
    }
  }
}, { 
  timestamps: true 
});

// Create and export model
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
