import { DigestSettings, DigestHistory } from '../models';
import { generateDigest } from './grounding';
import { sendDigestNotification } from './pushNotification';

/**
 * Get all users who should receive a digest at the current hour
 * @param currentHour The current hour in UTC (0-23)
 */
export async function getUsersForDigest(currentHour: number): Promise<any[]> {
  const hourString = currentHour.toString().padStart(2, '0');
  
  // Find users where:
  // 1. Digest is enabled
  // 2. They have a push token
  // 3. Their UTC hour matches the current scheduler hour
  const users = await DigestSettings.find({
    enabled: true,
    pushToken: { $exists: true, $ne: null },
    utcHour: currentHour,
  });

  console.log(`📋 Found ${users.length} users for UTC hour ${hourString}:00`);
  return users;
}

/**
 * Process a single user's digest
 */
async function processUserDigest(userSettings: any): Promise<boolean> {
  try {
    console.log(`🔄 Processing digest for user: ${userSettings.userId}`);

    // Generate digest using grounding
    const digestResult = await generateDigest(
      userSettings.topics,
      userSettings.language,
      userSettings.customPrompt
    );

    // Save to history
    const historyEntry = new DigestHistory({
      userId: userSettings.userId,
      title: digestResult.title,
      content: digestResult.content,
      topics: userSettings.topics,
      language: userSettings.language,
      sources: digestResult.sources,
      sentAt: new Date(),
    });
    const savedHistory = await historyEntry.save();

    // Send push notification
    if (userSettings.pushToken) {
      const preview = digestResult.content
        .split('\n')
        .find(line => line.trim() && !line.startsWith('#')) || 'Rangkuman berita terbaru';

      await sendDigestNotification(
        userSettings.pushToken,
        savedHistory._id.toString(),
        digestResult.title,
        preview
      );
    }

    console.log(`✅ Digest sent to user: ${userSettings.userId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to process digest for ${userSettings.userId}:`, error.message);
    return false;
  }
}

/**
 * Run the digest scheduler for a specific hour
 */
export async function runDigestScheduler(utcHour: number): Promise<{ success: number; failed: number }> {
  console.log(`⏰ Running digest scheduler for UTC hour: ${utcHour}`);

  const users = await getUsersForDigest(utcHour);
  
  if (users.length === 0) {
    console.log('📭 No users to process at this hour');
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  // Process users sequentially to avoid rate limits
  for (const user of users) {
    const result = await processUserDigest(user);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Small delay between users to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`📊 Scheduler complete: ${success} success, ${failed} failed`);
  return { success, failed };
}

/**
 * Manual trigger for testing (processes for a specific user)
 */
export async function triggerDigestForUser(userId: string): Promise<boolean> {
  const userSettings = await DigestSettings.findOne({ userId });
  
  if (!userSettings) {
    throw new Error('User digest settings not found');
  }

  return processUserDigest(userSettings);
}
