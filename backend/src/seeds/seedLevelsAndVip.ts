import { db } from '../config/firebase';

export interface LevelConfig {
  level: number;
  requiredXP: number;
  badge: string;
  name: string;
}

export interface VipLevelConfig {
  level: number;
  name: string;
  requiredSpendCoins: number;
  badge: string;
  nameColor: string;
  entryEffect: string;
  chatEffect: string;
}

export const seedLevelsAndVipConfig = async () => {
  console.log('[Seed] Seeding Levels and VIP Configuration...');

  // 1. Levels 1-100 configuration
  const levels: LevelConfig[] = [];
  let currentXP = 0;

  for (let lvl = 1; lvl <= 100; lvl++) {
    const xpForLevel = lvl === 1 ? 0 : Math.round(100 * Math.pow(lvl, 1.5));
    currentXP += xpForLevel;

    let badge = '🌱';
    let name = 'Novato';
    if (lvl >= 10) { badge = '⚡'; name = 'Bronce'; }
    if (lvl >= 25) { badge = '🔥'; name = 'Plata'; }
    if (lvl >= 50) { badge = '💎'; name = 'Oro'; }
    if (lvl >= 75) { badge = '👑'; name = 'Platino'; }
    if (lvl >= 90) { badge = '🌌'; name = 'Leyenda'; }

    levels.push({
      level: lvl,
      requiredXP: currentXP,
      badge,
      name,
    });
  }

  await db.collection('systemConfig').doc('levels').set({
    maxLevel: 100,
    xpPerCoinSpent: 10,
    levels,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // 2. VIP 0 - 10 configuration
  const vipLevels: VipLevelConfig[] = [
    { level: 0, name: 'Estándar', requiredSpendCoins: 0, badge: '👤', nameColor: '#FFFFFF', entryEffect: 'none', chatEffect: 'none' },
    { level: 1, name: 'VIP Bronce', requiredSpendCoins: 100, badge: '🥉 VIP 1', nameColor: '#CD7F32', entryEffect: 'sparkle', chatEffect: 'bronzeglow' },
    { level: 2, name: 'VIP Plata', requiredSpendCoins: 500, badge: '🥈 VIP 2', nameColor: '#C0C0C0', entryEffect: 'silver_aura', chatEffect: 'silverglow' },
    { level: 3, name: 'VIP Oro', requiredSpendCoins: 2000, badge: '🥇 VIP 3', nameColor: '#FFD700', entryEffect: 'golden_flash', chatEffect: 'goldglow' },
    { level: 4, name: 'VIP Platino', requiredSpendCoins: 5000, badge: '💎 VIP 4', nameColor: '#E5E4E2', entryEffect: 'diamond_shine', chatEffect: 'platinumglow' },
    { level: 5, name: 'VIP Esmeralda', requiredSpendCoins: 10000, badge: '👑 VIP 5', nameColor: '#50C878', entryEffect: 'emerald_burst', chatEffect: 'emeraldglow' },
    { level: 6, name: 'VIP Rubí', requiredSpendCoins: 25000, badge: '🔥 VIP 6', nameColor: '#E0115F', entryEffect: 'ruby_fire', chatEffect: 'rubyglow' },
    { level: 7, name: 'VIP Zafiro', requiredSpendCoins: 50000, badge: '🌌 VIP 7', nameColor: '#0F52BA', entryEffect: 'sapphire_wave', chatEffect: 'sapphireglow' },
    { level: 8, name: 'VIP Diamante Imperial', requiredSpendCoins: 100000, badge: '⚡ VIP 8', nameColor: '#B9F2FF', entryEffect: 'imperial_beam', chatEffect: 'imperialglow' },
    { level: 9, name: 'VIP Leyenda Solar', requiredSpendCoins: 250000, badge: '☀️ VIP 9', nameColor: '#FF4500', entryEffect: 'solar_flare', chatEffect: 'solarglow' },
    { level: 10, name: 'VIP Mítico Supremo', requiredSpendCoins: 500000, badge: '🪐 VIP 10', nameColor: '#9932CC', entryEffect: 'mythic_cosmic', chatEffect: 'mythicglow' },
  ];

  await db.collection('systemConfig').doc('vip').set({
    enabled: true,
    vipLevels,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('[Seed] ✅ Levels & VIP Configuration Seeded Successfully!');
};

if (require.main === module) {
  seedLevelsAndVipConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Levels/VIP Error]:', err);
      process.exit(1);
    });
}
