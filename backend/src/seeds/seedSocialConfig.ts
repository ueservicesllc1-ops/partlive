import { db } from '../config/firebase';

export const seedSocialConfig = async () => {
  console.log('[Seed] Seeding Social Network Configuration...');

  await db.collection('systemConfig').doc('social').set({
    storyDurationHours: 24,
    maxPostLength: 1000,
    maxGroupChatMembers: 100,
    messageRequestEnabled: true,
    allowSubscriberOnlyPosts: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ Social Network Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedSocialConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Social Error]:', err);
      process.exit(1);
    });
}
