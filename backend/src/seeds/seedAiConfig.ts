import { db } from '../config/firebase';

export const seedAiConfig = async () => {
  console.log('[Seed] Seeding AI Assistant System Configuration...');

  await db.collection('systemConfig').doc('ai').set({
    enabled: true,
    provider: 'template', // Default fast low-latency template provider
    dailyQuotaPerHost: 50,
    moderationThreshold: 'MEDIUM',
    clipDetectionEnabled: true,
    autoPromptsEnabled: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ AI Assistant Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedAiConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed AI Error]:', err);
      process.exit(1);
    });
}
