import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { CountryConfig } from '../seeds/seedRegionalConfigs';

export const getCountryConfig = async (countryCode: string = 'US'): Promise<CountryConfig> => {
  const codeUpper = countryCode.toUpperCase();
  const snap = await db.collection('countryConfigs').doc(codeUpper).get();

  if (!snap.exists) {
    // Default fallback to US
    const usSnap = await db.collection('countryConfigs').doc('US').get();
    return usSnap.data() as CountryConfig;
  }

  return snap.data() as CountryConfig;
};

export const getActiveMarkets = async (): Promise<CountryConfig[]> => {
  const snap = await db.collection('countryConfigs')
    .where('status', 'in', ['ACTIVE', 'BETA'])
    .get();

  return snap.docs.map((d) => d.data() as CountryConfig);
};

export const updateCountryConfig = async (
  countryCode: string,
  data: Partial<CountryConfig>,
  adminId: string
): Promise<CountryConfig> => {
  const codeUpper = countryCode.toUpperCase();
  const ref = db.collection('countryConfigs').doc(codeUpper);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`COUNTRY_NOT_FOUND: ${codeUpper}`);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(ref, {
      ...data,
      updatedAt: timestamp,
    });

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: adminId,
      action: 'COUNTRY_CONFIG_UPDATED',
      countryCode: codeUpper,
      timestamp,
    });
  });

  const updatedSnap = await ref.get();
  return updatedSnap.data() as CountryConfig;
};

export const isFeatureAllowedInCountry = async (
  featureKey: string,
  countryCode: string = 'US'
): Promise<boolean> => {
  const config = await getCountryConfig(countryCode);
  if (config.status === 'RESTRICTED' || config.status === 'DISABLED') {
    return false;
  }
  return true;
};
