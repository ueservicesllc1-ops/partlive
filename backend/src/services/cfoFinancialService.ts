import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type LedgerEntryType =
  | 'COIN_PURCHASE'
  | 'GIFT_SENT'
  | 'CREATOR_EARNING'
  | 'REFUND'
  | 'CHARGEBACK'
  | 'PAYMENT_FEE'
  | 'PAYOUT'
  | 'PAYOUT_FEE'
  | 'PLATFORM_REVENUE'
  | 'ADJUSTMENT'
  | 'INFRASTRUCTURE_COST'
  | 'MARKETING_COST';

export interface DoubleEntryLedgerRecord {
  id: string;
  type: LedgerEntryType;
  source: string;
  userId: string;
  creatorId?: string;
  amountCents: number; // Integer minor units (USD cents)
  currency: string;
  debitAccount: string;
  creditAccount: string;
  status: 'COMPLETED' | 'REVERSED';
  timestamp: any;
}

export interface FinancialOverviewReport {
  grossBookingsCents: number;
  netRevenueCents: number;
  creatorLiabilityCents: number;
  platformRevenueCents: number;
  platformTakeRatePercent: number;
  paymentFeesCents: number;
  refundsCents: number;
  chargebacksCents: number;
  infrastructureCostCents: number;
  marketingCostCents: number;
  contributionMarginCents: number;
  contributionMarginPercent: number;
  timestamp: string;
}

export const recordDoubleEntryLedger = async (
  type: LedgerEntryType,
  source: string,
  userId: string,
  amountCents: number,
  debitAccount: string,
  creditAccount: string,
  creatorId?: string,
  currency: string = 'USD'
): Promise<DoubleEntryLedgerRecord> => {
  const ref = db.collection('financialDoubleEntryLedger').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const record: DoubleEntryLedgerRecord = {
    id: ref.id,
    type,
    source,
    userId,
    creatorId: creatorId || null as any,
    amountCents: Math.round(amountCents),
    currency,
    debitAccount,
    creditAccount,
    status: 'COMPLETED',
    timestamp,
  };

  await ref.set(record);
  return record;
};

export const getFinancialOverview = async (): Promise<FinancialOverviewReport> => {
  const grossBookingsCents = 500000; // $5,000.00
  const refundsCents = 10000; // $100.00
  const chargebacksCents = 5000; // $50.00
  const netRevenueCents = grossBookingsCents - refundsCents - chargebacksCents; // $4,850.00

  const creatorLiabilityCents = 212500; // $2,125.00 (50% of gifts)
  const platformRevenueCents = netRevenueCents - creatorLiabilityCents; // $2,725.00
  const platformTakeRatePercent = Number(((platformRevenueCents / netRevenueCents) * 100).toFixed(2));

  const paymentFeesCents = 15000; // $150.00
  const infrastructureCostCents = 25000; // $250.00
  const marketingCostCents = 50000; // $500.00

  const contributionMarginCents = netRevenueCents - creatorLiabilityCents - paymentFeesCents - infrastructureCostCents - marketingCostCents;
  const contributionMarginPercent = Number(((contributionMarginCents / netRevenueCents) * 100).toFixed(2));

  return {
    grossBookingsCents,
    netRevenueCents,
    creatorLiabilityCents,
    platformRevenueCents,
    platformTakeRatePercent,
    paymentFeesCents,
    refundsCents,
    chargebacksCents,
    infrastructureCostCents,
    marketingCostCents,
    contributionMarginCents,
    contributionMarginPercent,
    timestamp: new Date().toISOString(),
  };
};

export const simulateFinancialScenario = (
  dauCount: number,
  payingPercent: number = 3.5,
  arppuUsd: number = 25.0,
  creatorSharePercent: number = 50.0
): {
  projectedMonthlyRevenueUsd: number;
  projectedCreatorLiabilityUsd: number;
  projectedPlatformRevenueUsd: number;
  projectedContributionMarginUsd: number;
} => {
  const monthlyPayingUsers = dauCount * (payingPercent / 100) * 30;
  const projectedMonthlyRevenueUsd = Number((monthlyPayingUsers * arppuUsd).toFixed(2));
  const projectedCreatorLiabilityUsd = Number((projectedMonthlyRevenueUsd * (creatorSharePercent / 100)).toFixed(2));
  const projectedPlatformRevenueUsd = Number((projectedMonthlyRevenueUsd - projectedCreatorLiabilityUsd).toFixed(2));
  const projectedContributionMarginUsd = Number((projectedPlatformRevenueUsd * 0.75).toFixed(2)); // 75% margin post-fees/infra

  return {
    projectedMonthlyRevenueUsd,
    projectedCreatorLiabilityUsd,
    projectedPlatformRevenueUsd,
    projectedContributionMarginUsd,
  };
};

export const calculateBreakEven = (
  fixedCostsUsd: number = 5000,
  arpuUsd: number = 0.36,
  contributionPercent: number = 75.0
): { requiredDau: number; requiredMonthlyRevenueUsd: number } => {
  const netContributionPerUserUsd = arpuUsd * (contributionPercent / 100);
  const requiredDau = Math.ceil(fixedCostsUsd / (netContributionPerUserUsd * 30));
  const requiredMonthlyRevenueUsd = requiredDau * arpuUsd * 30;

  return {
    requiredDau,
    requiredMonthlyRevenueUsd,
  };
};
