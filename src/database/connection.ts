import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// No longer relying on manual flag for serverless
// let isConnected = false; 

export const connectToDatabase = async (): Promise<boolean> => {
  // Check strict connection state (1 = connected)
  if (mongoose.connection.readyState === 1) {
    console.log('📦 Using existing MongoDB connection');
    return true;
  }

  // If connecting (2), wait for it
  if (mongoose.connection.readyState === 2) {
    console.log('⏳ Waiting for existing connection request...');
    return true; // Mongoose buffers requests, so this is okay
  }

  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not set. Running in memory mode.');
    return false;
  }

  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: true, // Allow buffering during connection
    };

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ Connected to MongoDB Atlas');
    return true;
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;
  
  try {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  } catch (error: any) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
};

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
