import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { MonetizationStream } from '../seeds/seedMonetizationStreams';

export const getMonetizationStreams = async (countryCode: string = 'US'): Promise<MonetizationStream[]> => {
  const snap = await db.collection('monetizationStreams')
    .where('enabled', '==', true)
    .get();

  const streams = snap.docs.map((doc) => doc.data() as MonetizationStream);
  const upperCountry = countryCode.toUpperCase();

  return streams.filter(
    (s) => s.supportedCountries.includes('ALL') || s.supportedCountries.includes(upperCountry)
  );
};

export const calculateRevenueCommission = async (
  streamType: MonetizationStream['type'],
  grossAmountUsd: number
): Promise<{
  grossAmountUsd: number;
  hostAmountUsd: number;
  platformAmountUsd: number;
  agencyAmountUsd: number;
  hostSharePct: number;
  platformSharePct: number;
}> => {
  const snap = await db.collection('monetizationStreams')
    .where('type', '==', streamType)
    .limit(1)
    .get();

  let hostSharePct = 0.70;
  let platformSharePct = 0.30;

  if (!snap.empty) {
    const stream = snap.docs[0].data() as MonetizationStream;
    hostSharePct = stream.hostSharePct;
    platformSharePct = stream.platformSharePct;
  }

  const hostAmountUsd = Number((grossAmountUsd * hostSharePct).toFixed(2));
  const platformAmountUsd = Number((grossAmountUsd * platformSharePct).toFixed(2));
  const agencyAmountUsd = 0;

  return {
    grossAmountUsd,
    hostAmountUsd,
    platformAmountUsd,
    agencyAmountUsd,
    hostSharePct,
    platformSharePct,
  };
};

export const updateStreamCommission = async (
  streamId: string,
  hostSharePct: number,
  platformSharePct: number,
  adminId: string
): Promise<MonetizationStream> => {
  const ref = db.collection('monetizationStreams').doc(streamId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`STREAM_NOT_FOUND: ${streamId}`);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const effectiveAt = new Date().toISOString();

  await db.runTransaction(async (transaction) => {
    transaction.update(ref, {
      hostSharePct,
      platformSharePct,
      effectiveAt,
      updatedAt: timestamp,
    });

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: adminId,
      action: 'MONETIZATION_COMMISSION_UPDATED',
      streamId,
      hostSharePct,
      platformSharePct,
      effectiveAt,
      timestamp,
    });
  });

  const updatedSnap = await ref.get();
  return updatedSnap.data() as MonetizationStream;
};
