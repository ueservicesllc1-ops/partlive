import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.partylive.app';
const clientEmail = process.env.GOOGLE_PLAY_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PLAY_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Initialize the Google JWT client
const jwtClient = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

const androidpublisher = google.androidpublisher({
  version: 'v3',
  auth: jwtClient,
});

export interface GooglePlayProductPurchase {
  kind?: string | null;
  purchaseTimeMillis?: string | null;
  purchaseState?: number | null; // 0: Purchased, 1: Canceled, 2: Pending
  consumptionState?: number | null; // 0: Yet to be consumed, 1: Consumed
  developerPayload?: string | null;
  orderId?: string | null;
  purchaseType?: number | null; // 0: Test, 1: Promo, etc.
  acknowledgementState?: number | null; // 0: Yet to be acknowledged, 1: Acknowledged
  productId?: string | null;
  quantity?: number | null;
  regionCode?: string | null;
}

/**
 * Verifies a purchase token with Google Play Developer API
 */
export const verifyAndroidProductPurchase = async (
  productId: string,
  purchaseToken: string
): Promise<GooglePlayProductPurchase> => {
  if (!clientEmail || !privateKey) {
    console.warn('⚠️ Google Play service account credentials not configured. Returning mock verification data.');
    // Under development/testing mode without real credentials, return simulated response for testing
    return {
      purchaseState: 0,
      consumptionState: 0,
      acknowledgementState: 0,
      orderId: `GPA.mock-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      purchaseTimeMillis: Date.now().toString(),
      purchaseType: 0, // Test purchase
    };
  }

  try {
    const response = await androidpublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching product purchase status from Google Play:', error);
    throw new Error(`Google Play verification failed: ${error.message || error}`);
  }
};

/**
 * Acknowledges a purchase to prevent automatic refund after 3 days
 */
export const acknowledgeAndroidPurchase = async (
  productId: string,
  purchaseToken: string
): Promise<void> => {
  if (!clientEmail || !privateKey) {
    console.warn('⚠️ Google Play service account credentials not configured. Skipping acknowledge.');
    return;
  }

  try {
    await androidpublisher.purchases.products.acknowledge({
      packageName,
      productId,
      token: purchaseToken,
    });
  } catch (error: any) {
    console.error('Error acknowledging purchase with Google Play:', error);
    throw new Error(`Google Play acknowledgement failed: ${error.message || error}`);
  }
};
