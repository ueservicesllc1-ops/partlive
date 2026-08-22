import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface PromoCode {
  code: string;
  discountPct: number;
  maxUses: number;
  usedCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  expiryDate?: string;
  createdAt: any;
}

export const createPromoCode = async (
  code: string,
  discountPct: number,
  maxUses: number = 100
): Promise<PromoCode> => {
  const codeUpper = code.toUpperCase().trim();
  const ref = db.collection('promoCodes').doc(codeUpper);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const promo: PromoCode = {
    code: codeUpper,
    discountPct,
    maxUses,
    usedCount: 0,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set(promo);
  return promo;
};

export const validateAndApplyCoupon = async (
  code: string,
  userId: string,
  grossAmountUsd: number
): Promise<{ originalAmount: number; discountAmount: number; finalAmount: number; couponCode: string }> => {
  const codeUpper = code.toUpperCase().trim();
  const ref = db.collection('promoCodes').doc(codeUpper);
  const snap = await ref.get();

  if (!snap.exists) throw new Error('COUPON_INVALID: Promo code does not exist.');

  const promo = snap.data() as PromoCode;
  if (promo.status !== 'ACTIVE') throw new Error('COUPON_EXPIRED: Promo code is inactive or expired.');
  if (promo.usedCount >= promo.maxUses) throw new Error('COUPON_EXHAUSTED: Promo code maximum uses reached.');

  const discountAmount = Number(((grossAmountUsd * promo.discountPct) / 100).toFixed(2));
  const finalAmount = Number((grossAmountUsd - discountAmount).toFixed(2));

  // Increment usage count
  await ref.update({
    usedCount: admin.firestore.FieldValue.increment(1),
  });

  return {
    originalAmount: grossAmountUsd,
    discountAmount,
    finalAmount,
    couponCode: codeUpper,
  };
};
