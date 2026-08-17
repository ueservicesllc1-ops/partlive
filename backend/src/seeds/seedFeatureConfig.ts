import { db } from '../config/firebase';

export const seedFeatureConfig = async () => {
  console.log('[Seed] Seeding System Feature Flags Configuration...');

  await db.collection('systemConfig').doc('features').set({
    pkEnabled: true,
    vipEnabled: true,
    clubsEnabled: true,
    karaokeEnabled: true,
    gamesEnabled: true,
    eventsEnabled: true,
    clipsEnabled: true,
    aiEnabled: true,
    subscriptionsEnabled: true,
    agenciesEnabled: true,
    promotionsEnabled: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ Feature Flags Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedFeatureConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Features Error]:', err);
      process.exit(1);
    });
}
