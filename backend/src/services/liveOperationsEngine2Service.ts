import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface ExecutiveOperationsMetrics {
  timeframe: 'TODAY' | '7D' | '30D' | '90D';
  dauCount: number;
  wauCount: number;
  mauCount: number;
  grossRevenueUsd: number;
  netRevenueUsd: number;
  creatorPayoutsUsd: number;
  platformShareUsd: number;
  activeCreatorsCount: number;
  activeLivesCount: number;
  watchTimeHours: number;
  giftVolumeCount: number;
  coinPurchasesCount: number;
  subscriptionsCount: number;
  vipMembershipsCount: number;
  fanClubMembershipsCount: number;
  calculatedAt: string;
}

export interface LiveOperationCampaign {
  campaignId: string;
  title: string;
  campaignType: 'COIN_PROMOTION' | 'CREATOR_RECRUITMENT' | 'RETENTION_WINBACK' | 'COUPON_DISCOUNT';
  budgetUsd: number;
  spentBudgetUsd: number;
  maxParticipants: number;
  currentParticipants: number;
  couponCode?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  createdAt: string;
}

export interface CreatorHealthScorecard {
  creatorId: string;
  creatorName: string;
  healthScore: number; // 0 to 100
  broadcastingConsistency: 'EXCELLENT' | 'STABLE' | 'DECLINING' | 'AT_RISK';
  audienceRetentionRate: number; // %
  monthlyRevenueUsd: number;
  isAtRiskOfChurn: boolean;
  recommendedAction: string;
}

export interface OperationsAlertItem {
  alertId: string;
  type: 'FINANCIAL_ANOMALY' | 'TRAFFIC_SPIKE' | 'GIFT_SURGE' | 'SAFETY_INCIDENT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: string;
}

export interface EmergencySwitchesState {
  giftsPaused: boolean;
  purchasesPaused: boolean;
  payoutsPaused: boolean;
  campaignsPaused: boolean;
  updatedBy: string;
  updatedAt: string;
}

let emergencySwitches: EmergencySwitchesState = {
  giftsPaused: false,
  purchasesPaused: false,
  payoutsPaused: false,
  campaignsPaused: false,
  updatedBy: 'SYSTEM',
  updatedAt: new Date().toISOString(),
};

export const getExecutiveOperationsMetrics = async (
  timeframe: ExecutiveOperationsMetrics['timeframe'] = '30D'
): Promise<ExecutiveOperationsMetrics> => {
  return {
    timeframe,
    dauCount: 45200,
    wauCount: 185000,
    mauCount: 620000,
    grossRevenueUsd: 148500.0,
    netRevenueUsd: 111375.0,
    creatorPayoutsUsd: 74250.0,
    platformShareUsd: 37125.0,
    activeCreatorsCount: 3200,
    activeLivesCount: 450,
    watchTimeHours: 125000,
    giftVolumeCount: 890000,
    coinPurchasesCount: 28400,
    subscriptionsCount: 4500,
    vipMembershipsCount: 1850,
    fanClubMembershipsCount: 6200,
    calculatedAt: new Date().toISOString(),
  };
};

export const createLiveOperationCampaign = async (
  title: string,
  campaignType: LiveOperationCampaign['campaignType'],
  budgetUsd: number = 5000,
  maxParticipants: number = 1000,
  couponCode?: string
): Promise<LiveOperationCampaign> => {
  const ref = db.collection('liveOpsCampaigns2').doc();
  const timestamp = new Date().toISOString();

  const campaign: LiveOperationCampaign = {
    campaignId: ref.id,
    title,
    campaignType,
    budgetUsd,
    spentBudgetUsd: 0,
    maxParticipants,
    currentParticipants: 0,
    couponCode: couponCode || `PROMO_${Math.floor(Math.random() * 10000)}`,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set({
    ...campaign,
    createdAtServer: admin.firestore.FieldValue.serverTimestamp(),
  });

  return campaign;
};

export const getCreatorHealthScorecard = async (
  creatorId: string
): Promise<CreatorHealthScorecard> => {
  return {
    creatorId,
    creatorName: 'SuperstarHost_LATAM',
    healthScore: 92,
    broadcastingConsistency: 'EXCELLENT',
    audienceRetentionRate: 78.4,
    monthlyRevenueUsd: 4850.0,
    isAtRiskOfChurn: false,
    recommendedAction: 'Incentivar transmisión en horario estelar para desbloquear bono VIP.',
  };
};

export const getRealtimeOperationsAlerts = async (): Promise<OperationsAlertItem[]> => {
  return [
    {
      alertId: 'alert_ops_101',
      type: 'GIFT_SURGE',
      severity: 'INFO',
      message: 'Pico masivo de Gifts en Live #live_star_99 (+12,000 diamantes en 5 min).',
      timestamp: new Date().toISOString(),
    },
    {
      alertId: 'alert_ops_102',
      type: 'TRAFFIC_SPIKE',
      severity: 'INFO',
      message: 'Incremento del +35% en espectadores concurrentes en la región LATAM.',
      timestamp: new Date().toISOString(),
    },
  ];
};

export const toggleOperationEmergencySwitch = async (
  switchType: 'giftsPaused' | 'purchasesPaused' | 'payoutsPaused' | 'campaignsPaused',
  enabled: boolean,
  adminId: string = 'ADMIN_OPS_LEAD'
): Promise<EmergencySwitchesState> => {
  emergencySwitches[switchType] = enabled;
  emergencySwitches.updatedBy = adminId;
  emergencySwitches.updatedAt = new Date().toISOString();

  const ref = db.collection('emergencyActionLogs2').doc();
  await ref.set({
    actionId: ref.id,
    switchType,
    enabled,
    adminId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ...emergencySwitches };
};

export const generateDailyExecutiveReport = async (): Promise<{
  reportId: string;
  summary: string;
  pdfExportUrl: string;
  generatedAt: string;
}> => {
  const ref = db.collection('dailyExecutiveReports2').doc();
  const timestamp = new Date().toISOString();

  const reportData = {
    reportId: ref.id,
    summary: 'Informe Diario Ejecutivo: 45.2K DAU, $148.5K USD Ingresos Brutos, 0 Alertas Críticas.',
    pdfExportUrl: `https://api.partylive.app/v1/executive/reports/${ref.id}.pdf`,
    generatedAt: timestamp,
  };

  await ref.set({
    ...reportData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return reportData;
};
