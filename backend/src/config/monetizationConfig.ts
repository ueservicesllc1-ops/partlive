import { db } from './firebase';
import { HOST_LEVELS } from '../constants/hostLevels';

export const DEFAULT_PLATFORM_COMMISSION_PERCENT = 60;
export const DEFAULT_RECEIVER_SHARE_PERCENT = 40;
export const MIN_PLATFORM_COMMISSION_PERCENT = 50;
export const MAX_PLATFORM_COMMISSION_PERCENT = 70;
export const BEANS_TO_USD_RATE = 0.003;
export const DIAMOND_TO_BEAN_BASE_RATE = 1;

interface MonetizationCalculationParams {
  totalDiamonds: number;
  receiverId: string;
  targetType: string;
  targetId: string;
}

interface MonetizationCalculationResult {
  platformCommissionPercent: number;
  receiverSharePercent: number;
  platformDiamondsValue: number;
  beansGenerated: number;
  estimatedUsdForReceiver: number;
}

export const calculateGiftMonetization = async ({
  totalDiamonds,
  receiverId,
  targetType,
  targetId,
}: MonetizationCalculationParams): Promise<MonetizationCalculationResult> => {
  // Check if host has a level in hostStats
  const hostStatsSnap = await db.collection('hostStats').doc(receiverId).get();
  
  let receiverSharePercent = DEFAULT_RECEIVER_SHARE_PERCENT;
  
  if (hostStatsSnap.exists) {
    const statsData = hostStatsSnap.data();
    const currentLevel = statsData?.currentLevel || 'initial';
    const levelDef = HOST_LEVELS.find((l) => l.id === currentLevel);
    if (levelDef) {
      receiverSharePercent = levelDef.hostSharePercent; // e.g. 35%, 45%, 55%
    }
  }

  // platform commission is 100 - receiver share
  let platformCommissionPercent = 100 - receiverSharePercent;

  // Enforce range limits
  if (platformCommissionPercent < MIN_PLATFORM_COMMISSION_PERCENT) {
    platformCommissionPercent = MIN_PLATFORM_COMMISSION_PERCENT;
  }
  if (platformCommissionPercent > MAX_PLATFORM_COMMISSION_PERCENT) {
    platformCommissionPercent = MAX_PLATFORM_COMMISSION_PERCENT;
  }

  // Adjust receiver share to match platform commission constraints
  receiverSharePercent = 100 - platformCommissionPercent;

  const platformDiamondsValue = Math.round(totalDiamonds * (platformCommissionPercent / 100));
  // 1 Diamond spent = 1 Bean value base * share percent
  const beansGenerated = Math.floor(totalDiamonds * (receiverSharePercent / 100));
  const estimatedUsdForReceiver = beansGenerated * BEANS_TO_USD_RATE;

  return {
    platformCommissionPercent,
    receiverSharePercent,
    platformDiamondsValue,
    beansGenerated,
    estimatedUsdForReceiver,
  };
};
