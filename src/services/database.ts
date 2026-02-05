import mongoose from 'mongoose';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('MongoDB URI not provided, skipping connection');
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}
