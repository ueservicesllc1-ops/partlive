import { db } from '../config/firebase';
import { initializeEconomyConfig } from '../config/economyConfig';

export const INITIAL_GIFTS = [
  {
    id: 'gift_rose',
    name: 'Rosa',
    description: 'Una elegante rosa para demostrar tu apoyo.',
    iconEmoji: '🌹',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
    coinCost: 1,
    diamondReward: 1,
    priceDiamonds: 1, // Legacy compatibility
    beansValue: 1, // Legacy compatibility
    category: 'POPULAR',
    isActive: true,
    sortOrder: 1,
    animationType: 'small',
    roomEffectType: 'rose_petal',
  },
  {
    id: 'gift_heart',
    name: 'Corazón',
    description: 'Envía amor directo a la transmisión.',
    iconEmoji: '❤️',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
    coinCost: 5,
    diamondReward: 5,
    priceDiamonds: 5,
    beansValue: 5,
    category: 'LOVE',
    isActive: true,
    sortOrder: 2,
    animationType: 'small',
    roomEffectType: 'heart_pulse',
  },
  {
    id: 'gift_fire',
    name: 'Fuego',
    description: '¡Enciende el ambiente del Live!',
    iconEmoji: '🔥',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/785/785116.png',
    coinCost: 20,
    diamondReward: 20,
    priceDiamonds: 20,
    beansValue: 20,
    category: 'FUN',
    isActive: true,
    sortOrder: 3,
    animationType: 'medium',
    roomEffectType: 'flames',
  },
  {
    id: 'gift_crown',
    name: 'Corona',
    description: 'Corona al anfitrión estrella de la noche.',
    iconEmoji: '👑',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1041/1041888.png',
    coinCost: 100,
    diamondReward: 100,
    priceDiamonds: 100,
    beansValue: 100,
    category: 'PREMIUM',
    isActive: true,
    sortOrder: 4,
    animationType: 'big',
    roomEffectType: 'confetti_gold',
  },
  {
    id: 'gift_king',
    name: 'Rey',
    description: 'El regalo definitivo para los verdaderos reyes.',
    iconEmoji: '🦁',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
    coinCost: 500,
    diamondReward: 500,
    priceDiamonds: 500,
    beansValue: 500,
    category: 'PREMIUM',
    isActive: true,
    sortOrder: 5,
    animationType: 'global',
    roomEffectType: 'lion_roar',
  },
  {
    id: 'gift_galaxy',
    name: 'Galaxia',
    description: '¡Una explosión galáctica en toda la pantalla!',
    iconEmoji: '🌌',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3212/3212567.png',
    coinCost: 2000,
    diamondReward: 2000,
    priceDiamonds: 2000,
    beansValue: 2000,
    category: 'SPECIAL',
    isActive: true,
    sortOrder: 6,
    animationType: 'global',
    roomEffectType: 'galaxy_starlight',
  },
];

export const seedGiftsAndEconomyConfig = async () => {
  console.log('[Seed] Initializing central economy config...');
  await initializeEconomyConfig();

  console.log('[Seed] Seeding initial gifts into Firestore...');
  const batch = db.batch();

  for (const gift of INITIAL_GIFTS) {
    const giftRef = db.collection('gifts').doc(gift.id);
    batch.set(giftRef, {
      ...gift,
      imageUrl: gift.iconUrl || '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }, { merge: true });
  }

  await batch.commit();
  console.log('[Seed] ✅ Economy Config and Initial Gifts seeded successfully!');
};

if (require.main === module) {
  seedGiftsAndEconomyConfig()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
