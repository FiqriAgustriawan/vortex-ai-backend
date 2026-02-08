import { connectToDatabase } from './src/database/connection';
import { DigestSettings } from './src/models';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function checkToken() {
  try {
    await connectToDatabase();
    
    // Find users created recently
    const users = await DigestSettings.find({}).sort({ updatedAt: -1 }).limit(5);
    
    console.log('🔍 Checking recent users for Push Token:');
    users.forEach((u: any) => {
      console.log(`User: ${u.userId}`);
      console.log(`UpdatedAt: ${u.updatedAt}`);
      console.log(`PushToken: ${u.pushToken ? u.pushToken.substring(0, 20) + '...' : '❌ MISSING'}`);
      console.log('---');
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkToken();
