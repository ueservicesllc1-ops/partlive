import { db } from '../config/firebase';

export interface MonetizationStream {
  streamId: string;
  name: string;
  type: 'COINS' | 'GIFTS' | 'VIP' | 'CREATOR_SUBSCRIPTION' | 'FAN_CLUB' | 'PREMIUM_EVENT' | 'PAID_ROOM' | 'ADVERTISING' | 'SPONSORSHIP' | 'PROMOTION' | 'VIRTUAL_ITEM' | 'PREMIUM_FEATURE';
  description: string;
  enabled: boolean;
  hostSharePct: number;
  platformSharePct: number;
  agencySharePct: number;
  supportedCountries: string[];
  effectiveAt: string;
  createdAt: string;
}

const INITIAL_STREAMS: Omit<MonetizationStream, 'createdAt'>[] = [
  {
    streamId: 'stream_coins',
    name: 'Paquetes de Coins',
    type: 'COINS',
    description: 'Venta de moneda virtual para regalos y compras en la app.',
    enabled: true,
    hostSharePct: 0.00,
    platformSharePct: 1.00,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
  {
    streamId: 'stream_gifts',
    name: 'Regalos Virtuales en Lives',
    type: 'GIFTS',
    description: 'Conversión de Coins a Diamantes de Creador.',
    enabled: true,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
  {
    streamId: 'stream_vip',
    name: 'Membresías VIP',
    type: 'VIP',
    description: 'Suscripción VIP mensual con insigneas y beneficios globales.',
    enabled: true,
    hostSharePct: 0.00,
    platformSharePct: 1.00,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
  {
    streamId: 'stream_creator_sub',
    name: 'Suscripciones de Creador',
    type: 'CREATOR_SUBSCRIPTION',
    description: 'Suscripción mensual directa a canales de creadores.',
    enabled: true,
    hostSharePct: 0.80,
    platformSharePct: 0.20,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
  {
    streamId: 'stream_fan_club',
    name: 'Club de Fans',
    type: 'FAN_CLUB',
    description: 'Membresía exclusiva para fans con badge e interacciones prioritarias.',
    enabled: true,
    hostSharePct: 0.75,
    platformSharePct: 0.25,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
  {
    streamId: 'stream_premium_event',
    name: 'Eventos Premium / Tickets',
    type: 'PREMIUM_EVENT',
    description: 'Entradas pagadas para eventos especiales y transmisiones exclusivas.',
    enabled: true,
    hostSharePct: 0.85,
    platformSharePct: 0.15,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
  {
    streamId: 'stream_paid_room',
    name: 'Salas de Audio Pagadas',
    type: 'PAID_ROOM',
    description: 'Salas grupales con costo de entrada o tiempo de acceso.',
    enabled: true,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
  {
    streamId: 'stream_virtual_item',
    name: 'Artículos Virtuales',
    type: 'VIRTUAL_ITEM',
    description: 'Marcos de perfil, efectos animados y badges de chat.',
    enabled: true,
    hostSharePct: 0.00,
    platformSharePct: 1.00,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
  {
    streamId: 'stream_promotion',
    name: 'Promoción de Creadores',
    type: 'PROMOTION',
    description: 'Impulso pagado de visibilidad en el feed de descubrimiento.',
    enabled: true,
    hostSharePct: 0.00,
    platformSharePct: 1.00,
    agencySharePct: 0.00,
    supportedCountries: ['ALL'],
    effectiveAt: new Date().toISOString(),
  },
];

export const seedMonetizationStreams = async () => {
  console.log('[Seed] Seeding Monetization Revenue Streams...');
  const timestamp = new Date().toISOString();

  await db.collection('systemConfig').doc('monetization').set({
    engineEnabled: true,
    supportedStreamsCount: INITIAL_STREAMS.length,
    updatedAt: timestamp,
  }, { merge: true });

  const batch = db.batch();
  for (const stream of INITIAL_STREAMS) {
    const ref = db.collection('monetizationStreams').doc(stream.streamId);
    batch.set(ref, { ...stream, createdAt: timestamp }, { merge: true });
  }

  await batch.commit();
  console.log(`[Seed] ✅ Monetization Streams Seeded: ${INITIAL_STREAMS.length} streams.`);
};

if (require.main === module) {
  seedMonetizationStreams()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Monetization Streams Error]:', err);
      process.exit(1);
    });
}
