import mongoose, { Schema, Document } from 'mongoose';

export interface IDigestHistory extends Document {
  userId: string;
  title: string;
  content: string;                // Markdown formatted content
  topics: string[];               // Topics this digest covers
  language: string;               // Language of the digest
  sources: {                      // Grounding sources from Google
    title: string;
    url: string;
  }[];
  sentAt: Date;
  readAt?: Date;
  notificationId?: string;        // Expo notification ID
}

const DigestHistorySchema = new Schema<IDigestHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    topics: {
      type: [String],
      required: true,
    },
    language: {
      type: String,
      required: true,
      default: 'id',
    },
    sources: [{
      title: String,
      url: String,
    }],
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readAt: {
      type: Date,
    },
    notificationId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
DigestHistorySchema.index({ userId: 1, sentAt: -1 });

export const DigestHistory = mongoose.model<IDigestHistory>('DigestHistory', DigestHistorySchema);
