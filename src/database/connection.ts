import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

let isConnected = false;

export const connectToDatabase = async (): Promise<boolean> => {
  if (isConnected) {
    console.log('📦 Using existing MongoDB connection');
    return true;
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
    };

    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
    return true;
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    isConnected = false;
    return false;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('📦 Disconnected from MongoDB');
  } catch (error: any) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
};

export const isDatabaseConnected = (): boolean => isConnected;

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
