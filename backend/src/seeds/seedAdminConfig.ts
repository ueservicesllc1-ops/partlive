import { db } from '../config/firebase';

export const seedAdminConfig = async () => {
  console.log('[Seed] Seeding Admin Control Center System Configuration...');

  await db.collection('systemConfig').doc('admin').set({
    twoPersonApprovalThresholdUsd: 100.0,
    roles: [
      'SUPER_ADMIN',
      'FINANCE_ADMIN',
      'MODERATION_ADMIN',
      'SUPPORT_ADMIN',
      'AGENCY_ADMIN',
      'GROWTH_ADMIN',
      'ANALYTICS_ADMIN',
      'TECH_ADMIN',
    ],
    auditLogRetentionDays: 365,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ Admin Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedAdminConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Admin Error]:', err);
      process.exit(1);
    });
}
