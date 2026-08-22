import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

export type SubscriptionEvent =
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'REFUND'
  | 'REVOCATION'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_STARTED';

export const processAppleServerNotification = async (
  rawPayload: any,
  rawBody: string,
  signatureHeader: string
): Promise<void> => {
  // 1. Validate Apple JWS signature (simplified — full JWS requires jwt decode)
  // Production: use apple-jws-decoder or jwt library to validate the JWS token
  if (!rawPayload || !rawPayload.notificationType) {
    console.warn('[Apple Webhook] Invalid or empty payload');
    return;
  }

  const { notificationType, data } = rawPayload;
  const transactionInfo = data?.signedTransactionInfo ? rawPayload : null;

  let event: SubscriptionEvent = 'RENEWAL';
  switch (notificationType) {
    case 'DID_RENEW':
    case 'SUBSCRIBED':       event = 'RENEWAL'; break;
    case 'DID_CHANGE_RENEWAL_STATUS': event = 'CANCELLATION'; break;
    case 'REFUND':           event = 'REFUND'; break;
    case 'REVOKE':           event = 'REVOCATION'; break;
    case 'EXPIRED':          event = 'SUBSCRIPTION_EXPIRED'; break;
    default:                 event = 'RENEWAL';
  }

  // Record webhook event for audit
  const webhookRef = db.collection('subscriptionWebhooks').doc();
  await webhookRef.set({
    id: webhookRef.id,
    platform: 'ios',
    notificationType,
    event,
    rawPayload: JSON.stringify(rawPayload).slice(0, 2000),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[Apple Webhook] Processed: ${notificationType} → ${event}`);
};

export const processGoogleServerNotification = async (
  messageData: string,
  pubSubToken: string
): Promise<void> => {
  // 1. Validate Pub/Sub token
  const expectedToken = process.env.GOOGLE_PUBSUB_WEBHOOK_TOKEN || '';
  if (expectedToken && pubSubToken !== expectedToken) {
    throw new Error('GOOGLE_WEBHOOK_UNAUTHORIZED: Invalid Pub/Sub token');
  }

  let decoded: any;
  try {
    const json = Buffer.from(messageData, 'base64').toString('utf8');
    decoded = JSON.parse(json);
  } catch {
    throw new Error('GOOGLE_WEBHOOK_INVALID_PAYLOAD');
  }

  const { subscriptionNotification, oneTimeProductNotification } = decoded;

  let event: SubscriptionEvent = 'RENEWAL';
  let notificationType = 'UNKNOWN';

  if (subscriptionNotification) {
    notificationType = `subscription:${subscriptionNotification.notificationType}`;
    switch (subscriptionNotification.notificationType) {
      case 1:  event = 'SUBSCRIPTION_STARTED'; break;
      case 3:  event = 'CANCELLATION'; break;
      case 4:  event = 'RENEWAL'; break;
      case 12: event = 'REVOCATION'; break;
      case 13: event = 'SUBSCRIPTION_EXPIRED'; break;
      default: event = 'RENEWAL';
    }
  }

  // Record webhook event for audit
  const webhookRef = db.collection('subscriptionWebhooks').doc();
  await webhookRef.set({
    id: webhookRef.id,
    platform: 'android',
    notificationType,
    event,
    purchaseToken: subscriptionNotification?.purchaseToken || '',
    rawPayload: JSON.stringify(decoded).slice(0, 2000),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[Google Webhook] Processed: ${notificationType} → ${event}`);
};
