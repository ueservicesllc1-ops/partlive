import { db } from '../config/firebase';

export const seedGrowthConfig = async () => {
  console.log('[Seed] Seeding Growth & Attribution Configuration...');

  await db.collection('systemConfig').doc('growth').set({
    attributionWindowDays: 30,
    defaultReferralBonusXP: 500,
    maxDailyReferralsPerUser: 10,
    requireProfileCompletion: true,
    minWatchDurationMinutes: 15,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ Growth Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedGrowthConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Growth Error]:', err);
      process.exit(1);
    });
}
