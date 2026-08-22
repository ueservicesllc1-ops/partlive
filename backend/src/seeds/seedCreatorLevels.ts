import { db } from '../config/firebase';

export interface CreatorLevel {
  levelId: string;
  name: string;
  minXp: number;
  badgeUrl: string;
  benefits: string[];
}

export interface CreatorMission {
  missionId: string;
  title: string;
  description: string;
  xpReward: number;
  category: 'ONBOARDING' | 'STREAMING' | 'ENGAGEMENT';
}

const INITIAL_LEVELS: CreatorLevel[] = [
  { levelId: 'level_1', name: 'Rookie', minXp: 0, badgeUrl: 'https://partylive.app/badges/rookie.png', benefits: ['Basic Analytics', 'Creator Studio'] },
  { levelId: 'level_2', name: 'Rising', minXp: 100, badgeUrl: 'https://partylive.app/badges/rising.png', benefits: ['Discovery Boost', 'Scheduled Events'] },
  { levelId: 'level_3', name: 'Pro', minXp: 500, badgeUrl: 'https://partylive.app/badges/pro.png', benefits: ['Creator Subscriptions', 'Priority Support'] },
  { levelId: 'level_4', name: 'Elite', minXp: 2000, badgeUrl: 'https://partylive.app/badges/elite.png', benefits: ['Custom Badges', 'VIP Concierge'] },
  { levelId: 'level_5', name: 'Star', minXp: 10000, badgeUrl: 'https://partylive.app/badges/star.png', benefits: ['Featured Homepage', 'Brand Sponsorships'] },
];

const INITIAL_MISSIONS: CreatorMission[] = [
  { missionId: 'm_first_live', title: 'Tu Primera Transmisión', description: 'Transmite en vivo durante al menos 15 minutos.', xpReward: 50, category: 'ONBOARDING' },
  { missionId: 'm_5_days', title: 'Constancia de Creador', description: 'Transmite en vivo 5 días diferentes este mes.', xpReward: 150, category: 'STREAMING' },
  { missionId: 'm_10_hours', title: 'Maratón de Transmisión', description: 'Acumula 10 horas de transmisión en vivo.', xpReward: 300, category: 'STREAMING' },
];

export const seedCreatorLevels = async () => {
  console.log('[Seed] Seeding Creator Levels & Missions...');
  const timestamp = new Date().toISOString();

  await db.collection('systemConfig').doc('creatorGrowth').set({
    enabled: true,
    levelsCount: INITIAL_LEVELS.length,
    updatedAt: timestamp,
  }, { merge: true });

  const batch = db.batch();
  for (const lvl of INITIAL_LEVELS) {
    const ref = db.collection('creatorLevels').doc(lvl.levelId);
    batch.set(ref, lvl, { merge: true });
  }

  for (const m of INITIAL_MISSIONS) {
    const ref = db.collection('creatorMissions').doc(m.missionId);
    batch.set(ref, m, { merge: true });
  }

  await batch.commit();
  console.log(`[Seed] ✅ Creator Levels (${INITIAL_LEVELS.length}) & Missions (${INITIAL_MISSIONS.length}) Seeded.`);
};

if (require.main === module) {
  seedCreatorLevels()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Creator Levels Error]:', err);
      process.exit(1);
    });
}
