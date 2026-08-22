import { db } from '../config/firebase';

export const seedCreatorConfig = async () => {
  console.log('[Seed] Seeding Creator Studio System Configuration...');

  await db.collection('systemConfig').doc('creator').set({
    calendarHorizonDays: 30,
    maxModeratorsPerHost: 20,
    milestoneRewardsEnabled: true,
    autoContentPlannerEnabled: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ Creator Studio Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedCreatorConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Creator Error]:', err);
      process.exit(1);
    });
}
