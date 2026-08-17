import { db } from '../config/firebase';

export interface AgencyLevelConfig {
  level: string;
  minActiveHosts: number;
  minMonthlyDiamonds: number;
  bonusCommissionPercent: number;
}

export const seedAgencyConfig = async () => {
  console.log('[Seed] Seeding Agency System Configuration...');

  const agencyLevels: AgencyLevelConfig[] = [
    { level: 'Bronze Agency', minActiveHosts: 1, minMonthlyDiamonds: 0, bonusCommissionPercent: 0 },
    { level: 'Silver Agency', minActiveHosts: 5, minMonthlyDiamonds: 50000, bonusCommissionPercent: 2 },
    { level: 'Gold Agency', minActiveHosts: 15, minMonthlyDiamonds: 250000, bonusCommissionPercent: 5 },
    { level: 'Platinum Agency', minActiveHosts: 30, minMonthlyDiamonds: 1000000, bonusCommissionPercent: 8 },
    { level: 'Diamond Agency', minActiveHosts: 50, minMonthlyDiamonds: 2500000, bonusCommissionPercent: 10 },
  ];

  await db.collection('systemConfig').doc('agencies').set({
    agencyEnabled: true,
    defaultCommissionRate: 10, // 10% cut paid from platform share
    commissionBasis: 'HOST_DIAMOND_EARNINGS',
    recruitmentEnabled: true,
    agencyLevels,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ Agency Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedAgencyConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Agency Error]:', err);
      process.exit(1);
    });
}
