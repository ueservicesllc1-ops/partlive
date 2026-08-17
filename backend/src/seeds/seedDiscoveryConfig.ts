import { db } from '../config/firebase';

export const seedDiscoveryConfig = async () => {
  console.log('[Seed] Seeding Discovery System Configuration...');

  await db.collection('systemConfig').doc('discovery').set({
    watchTimeWeight: 3.0,
    viewerWeight: 2.0,
    giftWeight: 4.0,
    shareWeight: 2.0,
    followWeight: 2.0,
    engagementWeight: 1.5,
    recencyWeight: 2.0,
    coldStartRatio: 0.2, // 20% exposure for fresh hosts
    maxConsecutiveHostContent: 2,
    maxClipDurationSeconds: 60,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ Discovery Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedDiscoveryConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Discovery Error]:', err);
      process.exit(1);
    });
}
