import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

interface GiftSeed {
  id: string;
  name: string;
  priceDiamonds: number;
  beansValue: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'popular' | 'music' | 'battle' | 'juegos' | 'vip';
  isActive: boolean;
  roomEffectType?: string;
  animationType?: 'small' | 'big' | 'global';
  senderTitle?: string;
  senderTitleDurationDays?: number;
  hostBadge?: string;
  hostBadgeDurationDays?: number;
  iconEmoji: string;
}

const gifts: GiftSeed[] = [
  // ==================== POPULAR (15 items) ====================
  {
    id: 'pop_beer',
    name: 'Cerveza Helada',
    priceDiamonds: 5,
    beansValue: 2.5,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🍺'
  },
  {
    id: 'pop_shot',
    name: 'Shot de Tequila',
    priceDiamonds: 10,
    beansValue: 5,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🥃'
  },
  {
    id: 'pop_pizza',
    name: 'Rebanada de Pizza',
    priceDiamonds: 15,
    beansValue: 7.5,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🍕'
  },
  {
    id: 'pop_party_horn',
    name: 'Espantasuegras',
    priceDiamonds: 20,
    beansValue: 10,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🎉'
  },
  {
    id: 'pop_neon_glasses',
    name: 'Lentes de Neón',
    priceDiamonds: 30,
    beansValue: 15,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🕶️'
  },
  {
    id: 'pop_soda',
    name: 'Bebida Energética',
    priceDiamonds: 8,
    beansValue: 4,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🥤'
  },
  {
    id: 'pop_icecream',
    name: 'Helado Fiesta',
    priceDiamonds: 12,
    beansValue: 6,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🍦'
  },
  {
    id: 'pop_balloon',
    name: 'Globo Metálico',
    priceDiamonds: 25,
    beansValue: 12.5,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🎈'
  },
  {
    id: 'pop_popcorn',
    name: 'Palomitas Locas',
    priceDiamonds: 18,
    beansValue: 9,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🍿'
  },
  {
    id: 'pop_taco',
    name: 'Taco de la Calle',
    priceDiamonds: 35,
    beansValue: 17.5,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🌮'
  },
  {
    id: 'pop_rose',
    name: 'Rosa de Fuego',
    priceDiamonds: 2,
    beansValue: 1,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🌹'
  },
  {
    id: 'pop_kiss',
    name: 'Beso Volado',
    priceDiamonds: 50,
    beansValue: 25,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '😘'
  },
  {
    id: 'pop_clap',
    name: 'Aplauso Trueno',
    priceDiamonds: 40,
    beansValue: 20,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '👏'
  },
  {
    id: 'pop_burger',
    name: 'Hamburguesa Triple',
    priceDiamonds: 60,
    beansValue: 30,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🍔'
  },
  {
    id: 'pop_fire',
    name: 'Fuego Encendido',
    priceDiamonds: 80,
    beansValue: 40,
    rarity: 'common',
    category: 'popular',
    isActive: true,
    iconEmoji: '🔥'
  },

  // ==================== MUSIC / KARAOKE (12 items) ====================
  {
    id: 'mus_mic_bronze',
    name: 'Micrófono de Bronce',
    priceDiamonds: 100,
    beansValue: 50,
    rarity: 'common',
    category: 'music',
    isActive: true,
    iconEmoji: '🎤'
  },
  {
    id: 'mus_notes',
    name: 'Lluvia de Notas',
    priceDiamonds: 150,
    beansValue: 75,
    rarity: 'rare',
    category: 'music',
    isActive: true,
    roomEffectType: 'music_notes',
    animationType: 'small',
    iconEmoji: '🎶'
  },
  {
    id: 'mus_cassette',
    name: 'Cassette Retro',
    priceDiamonds: 200,
    beansValue: 100,
    rarity: 'rare',
    category: 'music',
    isActive: true,
    iconEmoji: '📼'
  },
  {
    id: 'mus_guitar',
    name: 'Guitarra Eléctrica',
    priceDiamonds: 300,
    beansValue: 150,
    rarity: 'rare',
    category: 'music',
    isActive: true,
    iconEmoji: '🎸'
  },
  {
    id: 'mus_headphones',
    name: 'Audífonos DJ',
    priceDiamonds: 400,
    beansValue: 200,
    rarity: 'rare',
    category: 'music',
    isActive: true,
    iconEmoji: '🎧'
  },
  {
    id: 'mus_mic_silver',
    name: 'Micrófono de Plata',
    priceDiamonds: 500,
    beansValue: 250,
    rarity: 'epic',
    category: 'music',
    isActive: true,
    senderTitle: 'Cantante Promesa',
    senderTitleDurationDays: 1,
    iconEmoji: '🎙️'
  },
  {
    id: 'mus_keyboard',
    name: 'Sintetizador Cósmico',
    priceDiamonds: 600,
    beansValue: 300,
    rarity: 'epic',
    category: 'music',
    isActive: true,
    iconEmoji: '🎹'
  },
  {
    id: 'mus_trumpet',
    name: 'Trompeta de Oro',
    priceDiamonds: 700,
    beansValue: 350,
    rarity: 'epic',
    category: 'music',
    isActive: true,
    iconEmoji: '🎺'
  },
  {
    id: 'mus_vinyl',
    name: 'Disco de Vinilo',
    priceDiamonds: 800,
    beansValue: 400,
    rarity: 'epic',
    category: 'music',
    isActive: true,
    iconEmoji: '🎚️'
  },
  {
    id: 'mus_boombox',
    name: 'Boombox Callejero',
    priceDiamonds: 1000,
    beansValue: 500,
    rarity: 'epic',
    category: 'music',
    isActive: true,
    roomEffectType: 'boombox_bass',
    animationType: 'big',
    iconEmoji: '📻'
  },
  {
    id: 'mus_mic_gold',
    name: 'Micrófono de Oro',
    priceDiamonds: 2500,
    beansValue: 1250,
    rarity: 'legendary',
    category: 'music',
    isActive: true,
    roomEffectType: 'spotlight_show',
    animationType: 'big',
    senderTitle: 'Vocalista de Oro',
    senderTitleDurationDays: 3,
    hostBadge: 'Escenario Dorado',
    hostBadgeDurationDays: 3,
    iconEmoji: '🌟'
  },
  {
    id: 'mus_grammy',
    name: 'Megáfono del Gramófono',
    priceDiamonds: 5000,
    beansValue: 2500,
    rarity: 'legendary',
    category: 'music',
    isActive: true,
    roomEffectType: 'concert_hall',
    animationType: 'global',
    senderTitle: 'Leyenda de la Música',
    senderTitleDurationDays: 7,
    hostBadge: 'Sinfonía Estelar',
    hostBadgeDurationDays: 7,
    iconEmoji: '🏆'
  },

  // ==================== BATTLE / PK (12 items) ====================
  {
    id: 'bat_boxing_gloves',
    name: 'Guantes de Boxeo',
    priceDiamonds: 120,
    beansValue: 60,
    rarity: 'common',
    category: 'battle',
    isActive: true,
    iconEmoji: '🥊'
  },
  {
    id: 'bat_shield',
    name: 'Escudo Guardián',
    priceDiamonds: 180,
    beansValue: 90,
    rarity: 'rare',
    category: 'battle',
    isActive: true,
    iconEmoji: '🛡️'
  },
  {
    id: 'bat_sword',
    name: 'Espada Láser',
    priceDiamonds: 250,
    beansValue: 125,
    rarity: 'rare',
    category: 'battle',
    isActive: true,
    iconEmoji: '⚔️'
  },
  {
    id: 'bat_flag',
    name: 'Estandarte de Guerra',
    priceDiamonds: 350,
    beansValue: 175,
    rarity: 'rare',
    category: 'battle',
    isActive: true,
    iconEmoji: '🚩'
  },
  {
    id: 'bat_lightning',
    name: 'Tormenta de Rayos',
    priceDiamonds: 500,
    beansValue: 250,
    rarity: 'epic',
    category: 'battle',
    isActive: true,
    roomEffectType: 'lightning_strike',
    animationType: 'big',
    iconEmoji: '⚡'
  },
  {
    id: 'bat_fire_ring',
    name: 'Anillo de Fuego',
    priceDiamonds: 750,
    beansValue: 375,
    rarity: 'epic',
    category: 'battle',
    isActive: true,
    roomEffectType: 'fire_ring',
    animationType: 'big',
    iconEmoji: '⭕'
  },
  {
    id: 'bat_cannon',
    name: 'Cañón de Confeti',
    priceDiamonds: 1000,
    beansValue: 500,
    rarity: 'epic',
    category: 'battle',
    isActive: true,
    roomEffectType: 'confetti_rain',
    animationType: 'big',
    iconEmoji: '💥'
  },
  {
    id: 'bat_victory',
    name: 'Laurel de Victoria',
    priceDiamonds: 1500,
    beansValue: 750,
    rarity: 'epic',
    category: 'battle',
    isActive: true,
    senderTitle: 'Táctico Experto',
    senderTitleDurationDays: 1,
    iconEmoji: '👑'
  },
  {
    id: 'bat_castle',
    name: 'Fortaleza PK',
    priceDiamonds: 3000,
    beansValue: 1500,
    rarity: 'legendary',
    category: 'battle',
    isActive: true,
    senderTitle: 'Mariscal de Guerra',
    senderTitleDurationDays: 3,
    hostBadge: 'Defensor Invicto',
    hostBadgeDurationDays: 3,
    iconEmoji: '🏰'
  },
  {
    id: 'bat_dragon',
    name: 'Dragón de Batalla',
    priceDiamonds: 8000,
    beansValue: 4000,
    rarity: 'legendary',
    category: 'battle',
    isActive: true,
    roomEffectType: 'dragon_roar',
    animationType: 'global',
    senderTitle: 'Domador de Dragones',
    senderTitleDurationDays: 7,
    hostBadge: 'Aliento de Fuego',
    hostBadgeDurationDays: 7,
    iconEmoji: '🐲'
  },
  {
    id: 'bat_volcano',
    name: 'Erupción Volcánica',
    priceDiamonds: 12000,
    beansValue: 6000,
    rarity: 'legendary',
    category: 'battle',
    isActive: true,
    roomEffectType: 'volcano_burst',
    animationType: 'global',
    senderTitle: 'Señor del Volcán',
    senderTitleDurationDays: 7,
    hostBadge: 'Host Supremo',
    hostBadgeDurationDays: 7,
    iconEmoji: '🌋'
  },
  {
    id: 'bat_comet',
    name: 'Colisión de Cometa',
    priceDiamonds: 15000,
    beansValue: 7500,
    rarity: 'legendary',
    category: 'battle',
    isActive: true,
    roomEffectType: 'super_nova',
    animationType: 'global',
    senderTitle: 'Destructor Estelar',
    senderTitleDurationDays: 10,
    hostBadge: 'Baluarte Celestial',
    hostBadgeDurationDays: 10,
    iconEmoji: '☄️'
  },

  // ==================== JUEGOS / DIVERSIÓN (11 items) ====================
  {
    id: 'gam_dice',
    name: 'Dados Afortunados',
    priceDiamonds: 50,
    beansValue: 25,
    rarity: 'common',
    category: 'juegos',
    isActive: true,
    iconEmoji: '🎲'
  },
  {
    id: 'gam_gamepad',
    name: 'Control Gamer',
    priceDiamonds: 150,
    beansValue: 75,
    rarity: 'common',
    category: 'juegos',
    isActive: true,
    iconEmoji: '🎮'
  },
  {
    id: 'gam_card_spades',
    name: 'As de Espadas',
    priceDiamonds: 220,
    beansValue: 110,
    rarity: 'rare',
    category: 'juegos',
    isActive: true,
    iconEmoji: '♠️'
  },
  {
    id: 'gam_slot_machine',
    name: 'Tragamonedas Jackpot',
    priceDiamonds: 550,
    beansValue: 275,
    rarity: 'rare',
    category: 'juegos',
    isActive: true,
    roomEffectType: 'jackpot_coins',
    animationType: 'small',
    iconEmoji: '🎰'
  },
  {
    id: 'gam_joker',
    name: 'Carta del Guasón',
    priceDiamonds: 450,
    beansValue: 225,
    rarity: 'rare',
    category: 'juegos',
    isActive: true,
    iconEmoji: '🃏'
  },
  {
    id: 'gam_target',
    name: 'Tiro al Blanco',
    priceDiamonds: 320,
    beansValue: 160,
    rarity: 'rare',
    category: 'juegos',
    isActive: true,
    iconEmoji: '🎯'
  },
  {
    id: 'gam_treasure',
    name: 'Cofre Secreto',
    priceDiamonds: 1200,
    beansValue: 600,
    rarity: 'epic',
    category: 'juegos',
    isActive: true,
    roomEffectType: 'treasure_sparkle',
    animationType: 'big',
    iconEmoji: '🏴‍☠️'
  },
  {
    id: 'gam_chess_king',
    name: 'Rey del Tablero',
    priceDiamonds: 2000,
    beansValue: 1000,
    rarity: 'epic',
    category: 'juegos',
    isActive: true,
    senderTitle: 'Gran Maestro',
    senderTitleDurationDays: 3,
    iconEmoji: '👑'
  },
  {
    id: 'gam_bowling',
    name: 'Chuzza Perfecta',
    priceDiamonds: 800,
    beansValue: 400,
    rarity: 'epic',
    category: 'juegos',
    isActive: true,
    iconEmoji: '🎳'
  },
  {
    id: 'gam_virtual_vr',
    name: 'Visor Holográfico VR',
    priceDiamonds: 1600,
    beansValue: 800,
    rarity: 'epic',
    category: 'juegos',
    isActive: true,
    iconEmoji: '🥽'
  },
  {
    id: 'gam_amusement_park',
    name: 'Ticket al Parque',
    priceDiamonds: 4000,
    beansValue: 2000,
    rarity: 'legendary',
    category: 'juegos',
    isActive: true,
    roomEffectType: 'neon_lasers',
    animationType: 'global',
    senderTitle: 'Gamer Legendario',
    senderTitleDurationDays: 5,
    hostBadge: 'Anfitrión Divertido',
    hostBadgeDurationDays: 5,
    iconEmoji: '🎡'
  },

  // ==================== VIP (10 items) ====================
  {
    id: 'vip_disco_ball',
    name: 'Esfera Disco Láser',
    priceDiamonds: 2000,
    beansValue: 1000,
    rarity: 'epic',
    category: 'vip',
    isActive: true,
    roomEffectType: 'disco_ball_glow',
    animationType: 'big',
    iconEmoji: '🪩'
  },
  {
    id: 'vip_sports_car',
    name: 'Deportivo Neon',
    priceDiamonds: 6000,
    beansValue: 3000,
    rarity: 'legendary',
    category: 'vip',
    isActive: true,
    roomEffectType: 'car_neon_drift',
    animationType: 'global',
    senderTitle: 'Conductor VIP',
    senderTitleDurationDays: 5,
    hostBadge: 'Parada de Estrellas',
    hostBadgeDurationDays: 5,
    iconEmoji: '🏎️'
  },
  {
    id: 'vip_yacht',
    name: 'Mega Yate PartyLive',
    priceDiamonds: 10000,
    beansValue: 5000,
    rarity: 'legendary',
    category: 'vip',
    isActive: true,
    roomEffectType: 'yacht_cruise',
    animationType: 'global',
    senderTitle: 'Magnate de la Bahía',
    senderTitleDurationDays: 7,
    hostBadge: 'Club Náutico',
    hostBadgeDurationDays: 7,
    iconEmoji: '🛳️'
  },
  {
    id: 'vip_helicopter',
    name: 'Helicóptero VIP',
    priceDiamonds: 18000,
    beansValue: 9000,
    rarity: 'legendary',
    category: 'vip',
    isActive: true,
    roomEffectType: 'helicopter_flyby',
    animationType: 'global',
    senderTitle: 'Piloto VIP',
    senderTitleDurationDays: 7,
    hostBadge: 'Alturas Reales',
    hostBadgeDurationDays: 7,
    iconEmoji: '🚁'
  },
  {
    id: 'vip_mansion',
    name: 'Villa en Ibiza',
    priceDiamonds: 25000,
    beansValue: 12500,
    rarity: 'legendary',
    category: 'vip',
    isActive: true,
    roomEffectType: 'ibiza_villa_gala',
    animationType: 'global',
    senderTitle: 'Patrón de Ibiza',
    senderTitleDurationDays: 10,
    hostBadge: 'Mansión Real',
    hostBadgeDurationDays: 10,
    iconEmoji: '🏰'
  },
  {
    id: 'vip_island',
    name: 'Isla Privada Chaton',
    priceDiamonds: 50000,
    beansValue: 25000,
    rarity: 'legendary',
    category: 'vip',
    isActive: true,
    roomEffectType: 'fireworks_gala',
    animationType: 'global',
    senderTitle: 'Dueño del Archipiélago',
    senderTitleDurationDays: 15,
    hostBadge: 'Soberano del Olimpo',
    hostBadgeDurationDays: 15,
    iconEmoji: '🏝️'
  },
  {
    id: 'vip_champagne',
    name: 'Champagne de Cristal',
    priceDiamonds: 3000,
    beansValue: 1500,
    rarity: 'epic',
    category: 'vip',
    isActive: true,
    roomEffectType: 'champagne_shower',
    animationType: 'big',
    senderTitle: 'Brindis VIP',
    senderTitleDurationDays: 2,
    iconEmoji: '🍾'
  },
  {
    id: 'vip_private_jet',
    name: 'Jet Privado Platino',
    priceDiamonds: 35000,
    beansValue: 17500,
    rarity: 'legendary',
    category: 'vip',
    isActive: true,
    roomEffectType: 'jet_flyover',
    animationType: 'global',
    senderTitle: 'Aviador Supremo',
    senderTitleDurationDays: 12,
    hostBadge: 'Cielo Infinito',
    hostBadgeDurationDays: 12,
    iconEmoji: '🛩️'
  },
  {
    id: 'vip_tiara',
    name: 'Tiara de Diamantes',
    priceDiamonds: 4500,
    beansValue: 2250,
    rarity: 'epic',
    category: 'vip',
    isActive: true,
    senderTitle: 'Realeza Social',
    senderTitleDurationDays: 3,
    iconEmoji: '👑'
  },
  {
    id: 'vip_gold_record',
    name: 'Disco de Platino Firmado',
    priceDiamonds: 8000,
    beansValue: 4000,
    rarity: 'legendary',
    category: 'vip',
    isActive: true,
    roomEffectType: 'platinum_record_glow',
    animationType: 'global',
    senderTitle: 'Productor Platino',
    senderTitleDurationDays: 7,
    hostBadge: 'Artista Superestrella',
    hostBadgeDurationDays: 7,
    iconEmoji: '💿'
  }
];

export const seedGifts = async (): Promise<void> => {
  console.log('Starting gifts seeding...');
  const batch = db.batch();
  
  for (const gift of gifts) {
    const giftRef = db.collection('gifts').doc(gift.id);
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    batch.set(giftRef, {
      ...gift,
      createdAt: timestamp,
      updatedAt: timestamp
    }, { merge: true });
  }

  await batch.commit();
  console.log(`Successfully seeded ${gifts.length} original gifts!`);
};

if (require.main === module) {
  seedGifts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
