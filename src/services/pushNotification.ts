import fetch from 'node-fetch';

export interface ExpoPushMessage {
  to: string;               // Expo push token
  title: string;
  body: string;
  data?: Record<string, any>;  // Custom data payload
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;             // Time to live in seconds
}

export interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: any;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification via Expo Push API
 * @param message The push message to send
 * @returns Push ticket with status
 */
export async function sendPushNotification(message: ExpoPushMessage): Promise<ExpoPushTicket> {
  try {
    console.log(`📤 Sending push notification to: ${message.to.substring(0, 20)}...`);
    
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json() as any;
    
    if (result.data && result.data.length > 0) {
      const ticket = result.data[0];
      
      if (ticket.status === 'ok') {
        console.log(`✅ Push notification sent successfully. Ticket ID: ${ticket.id}`);
      } else {
        console.error(`❌ Push notification failed:`, ticket.message);
      }
      
      return ticket;
    }
    
    return { status: 'error', message: 'No ticket returned' };
  } catch (error: any) {
    console.error('Push notification error:', error.message);
    return { status: 'error', message: error.message };
  }
}

/**
 * Send multiple push notifications in batch
 * @param messages Array of push messages
 * @returns Array of push tickets
 */
export async function sendBatchPushNotifications(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  try {
    console.log(`📤 Sending ${messages.length} push notifications...`);
    
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json() as any;
    
    if (result.data) {
      const successCount = result.data.filter((t: ExpoPushTicket) => t.status === 'ok').length;
      console.log(`✅ ${successCount}/${messages.length} notifications sent successfully`);
      return result.data;
    }
    
    return [{ status: 'error', message: 'No tickets returned' }];
  } catch (error: any) {
    console.error('Batch push notification error:', error.message);
    return [{ status: 'error', message: error.message }];
  }
}

/**
 * Validate an Expo push token format
 * @param token The push token to validate
 * @returns True if valid
 */
export function isValidPushToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

/**
 * Send a digest notification to a user
 * @param pushToken User's Expo push token
 * @param digestId The digest ID for navigation
 * @param title Digest title
 * @param preview Short preview of the digest
 */
export async function sendDigestNotification(
  pushToken: string,
  digestId: string,
  title: string,
  preview: string
): Promise<ExpoPushTicket> {
  if (!isValidPushToken(pushToken)) {
    return { status: 'error', message: 'Invalid push token format' };
  }

  return sendPushNotification({
    to: pushToken,
    title: `📰 ${title}`,
    body: preview.length > 100 ? preview.substring(0, 97) + '...' : preview,
    data: {
      type: 'digest',
      digestId,
      screen: 'DigestDetail',
    },
    sound: 'default',
    priority: 'high',
    channelId: 'digest',
  });
}
