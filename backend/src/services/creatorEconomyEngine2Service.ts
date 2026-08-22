import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface CreatorEarningProfile {
  creatorId: string;
  creatorName: string;
  creatorLevel: 'NEW' | 'RISING' | 'ACTIVE' | 'POPULAR' | 'ELITE' | 'TOP_CREATOR';
  availableDiamonds: number;
  pendingDiamonds: number;
  lifetimeDiamonds: number;
  monthlyEarningsUsd: number;
  revenueBreakdownPercent: {
    gifts: number;
    subscriptions: number;
    vipMemberships: number;
    fanClubs: number;
    events: number;
  };
  levelBenefits: string[];
  broadcastingStreakDays: number;
  updatedAt: string;
}

export interface CreatorMissionItem {
  missionId: string;
  title: string;
  missionType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  targetHours: number;
  currentHours: number;
  rewardCoins: number;
  budgetUsdCap: number;
  isCompleted: boolean;
}

export interface CreatorAiAssistantResponse {
  creatorId: string;
  question: string;
  recommendedBestTimeToGoLive: string;
  recommendedContentCategory: string;
  potentialCollaborationMatches: string[];
  insightsSummary: string;
  financialBoundaryEnforced: boolean;
}

export interface AgencyEconomicsOverview {
  agencyId: string;
  agencyName: string;
  activeHostsCount: number;
  totalMonthlyRevenueUsd: number;
  agencyCommissionPercent: number; // e.g. 10%
  agencyCommissionEarningsUsd: number;
  topHostName: string;
  complianceStatus: 'VERIFIED_AND_AUDITED';
}

export interface EconomySimulationInputs {
  coinPriceUsd: number; // e.g. 0.01
  creatorRevenueSharePercent: number; // e.g. 60%
  agencySharePercent: number; // e.g. 10%
  monthlyPurchasersCount: number;
  avgSpentPerPurchaserUsd: number;
  infrastructureCostUsd: number;
}

export interface EconomySimulationResult {
  grossRevenueUsd: number;
  creatorPayoutsUsd: number;
  agencyPayoutsUsd: number;
  infrastructureCostUsd: number;
  netPlatformContributionUsd: number;
  platformMarginPercent: number;
  breakEvenPurchasersRequired: number;
  scenario: 'CONSERVATIVE' | 'BASE' | 'OPTIMISTIC';
}

export const getCreatorEarningProfile = async (
  creatorId: string
): Promise<CreatorEarningProfile> => {
  return {
    creatorId,
    creatorName: 'SuperstarHost_LATAM',
    creatorLevel: 'TOP_CREATOR',
    availableDiamonds: 485000,
    pendingDiamonds: 25000,
    lifetimeDiamonds: 2450000,
    monthlyEarningsUsd: 4850.0,
    revenueBreakdownPercent: {
      gifts: 65,
      subscriptions: 20,
      vipMemberships: 10,
      fanClubs: 5,
      events: 0,
    },
    levelBenefits: ['Insignia Dorada VIP', 'Impulso de Descubrimiento +25%', 'Soporte Prioritario 24/7'],
    broadcastingStreakDays: 14,
    updatedAt: new Date().toISOString(),
  };
};

export const getCreatorMissionsAndMilestones = async (
  creatorId: string
): Promise<{ missions: CreatorMissionItem[]; milestoneProgressPercent: number }> => {
  return {
    missions: [
      {
        missionId: 'mission_daily_live_2h',
        title: 'Transmitir 2 horas hoy en vivo',
        missionType: 'DAILY',
        targetHours: 2,
        currentHours: 2,
        rewardCoins: 50,
        budgetUsdCap: 0.5,
        isCompleted: true,
      },
      {
        missionId: 'mission_weekly_pk_3',
        title: 'Completar 3 Batallas PK esta semana',
        missionType: 'WEEKLY',
        targetHours: 5,
        currentHours: 3,
        rewardCoins: 150,
        budgetUsdCap: 1.5,
        isCompleted: false,
      },
    ],
    milestoneProgressPercent: 85.0,
  };
};

export const askCreatorAiAssistant = async (
  creatorId: string,
  question: string
): Promise<CreatorAiAssistantResponse> => {
  return {
    creatorId,
    question,
    recommendedBestTimeToGoLive: 'Viernes de 8:00 PM a 11:00 PM (Hora Local LATAM)',
    recommendedContentCategory: 'Karaoke & Batallas PK en Vivo',
    potentialCollaborationMatches: ['@Host_Musica_Mex', '@DJ_Party_Live'],
    insightsSummary: 'Tus transmisiones de Karaoke nocturnas generan un 35% más de regalos que las mañanas.',
    financialBoundaryEnforced: true,
  };
};

export const getAgencyEconomicsOverview = async (
  agencyId: string = 'agency_latam_top'
): Promise<AgencyEconomicsOverview> => {
  return {
    agencyId,
    agencyName: 'Agencia Talentos LATAM Pro',
    activeHostsCount: 45,
    totalMonthlyRevenueUsd: 68500.0,
    agencyCommissionPercent: 10,
    agencyCommissionEarningsUsd: 6850.0,
    topHostName: 'SuperstarHost_LATAM',
    complianceStatus: 'VERIFIED_AND_AUDITED',
  };
};

export const runEconomySimulation = async (
  inputs: EconomySimulationInputs
): Promise<EconomySimulationResult> => {
  const gross = inputs.monthlyPurchasersCount * inputs.avgSpentPerPurchaserUsd;
  const creatorPayouts = gross * (inputs.creatorRevenueSharePercent / 100);
  const agencyPayouts = gross * (inputs.agencySharePercent / 100);
  const totalCosts = creatorPayouts + agencyPayouts + inputs.infrastructureCostUsd;
  const netContribution = gross - totalCosts;
  const margin = (netContribution / gross) * 100;

  return {
    grossRevenueUsd: gross,
    creatorPayoutsUsd: creatorPayouts,
    agencyPayoutsUsd: agencyPayouts,
    infrastructureCostUsd: inputs.infrastructureCostUsd,
    netPlatformContributionUsd: netContribution,
    platformMarginPercent: Number(margin.toFixed(2)),
    breakEvenPurchasersRequired: Math.ceil(inputs.infrastructureCostUsd / (inputs.avgSpentPerPurchaserUsd * 0.3)),
    scenario: 'BASE',
  };
};

export const recordEconomyChangeControl = async (
  adminId: string,
  changeType: string,
  payload: any
): Promise<{ changeId: string; loggedAt: string }> => {
  const ref = db.collection('economyChangeLogs2').doc();
  const timestamp = new Date().toISOString();

  const data = {
    changeId: ref.id,
    adminId,
    changeType,
    payload,
    loggedAt: timestamp,
  };

  await ref.set({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return data;
};
