import mongoose, { Schema, Document } from 'mongoose';

export interface IDigestSettings extends Document {
  
  userId: string;
  enabled: boolean;
  scheduleTime: string;           // "08:00" format (HH:mm)
  timezone: string;               // "Asia/Jakarta", "America/New_York", etc.
  topics: string[];               // ["technology", "business", "sports"]
  customPrompt?: string;          // Optional custom instruction
  language: string;               // "id", "en", "es", etc.
  pushToken?: string;             // Expo push token
  utcHour?: number;
  utcMinute?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Available topics for digest
export const DIGEST_TOPICS = [
  { id: 'technology', label: 'Teknologi', labelEn: 'Technology', icon: '🔧' },
  { id: 'business', label: 'Bisnis', labelEn: 'Business', icon: '💼' },
  { id: 'sports', label: 'Olahraga', labelEn: 'Sports', icon: '⚽' },
  { id: 'entertainment', label: 'Entertainment', labelEn: 'Entertainment', icon: '🎬' },
  { id: 'science', label: 'Sains', labelEn: 'Science', icon: '🔬' },
  { id: 'gaming', label: 'Gaming', labelEn: 'Gaming', icon: '🎮' },
  { id: 'world', label: 'Berita Dunia', labelEn: 'World News', icon: '🌍' },
  { id: 'indonesia', label: 'Berita Indonesia', labelEn: 'Indonesia News', icon: '🇮🇩' },
] as const;

// Supported languages
export const DIGEST_LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
] as const;

const DigestSettingsSchema = new Schema<IDigestSettings>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    scheduleTime: {
      type: String,
      default: '08:00',
      validate: {
        validator: (v: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Schedule time must be in HH:mm format',
      },
    },
    timezone: {
      type: String,
      default: 'Asia/Jakarta',
    },
    topics: {
      type: [String],
      default: ['technology'],
      validate: {
        validator: (v: string[]) => v.length > 0 && v.length <= 5,
        message: 'Must select 1-5 topics',
      },
    },
    customPrompt: {
      type: String,
      maxlength: 500,
    },
    language: {
      type: String,
      default: 'id',
      enum: ['id', 'en', 'es', 'zh', 'ja'],
    },
    pushToken: {
      type: String,
    },
    // Normalized UTC time for efficient querying
    utcHour: {
      type: Number,
      required: true,
      default: 0,
    },
    utcMinute: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const DigestSettings = mongoose.model<IDigestSettings>('DigestSettings', DigestSettingsSchema);
