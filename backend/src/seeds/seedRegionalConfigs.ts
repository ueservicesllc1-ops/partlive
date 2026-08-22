import { db } from '../config/firebase';

export interface CountryConfig {
  countryCode: string;
  countryName: string;
  region: 'NORTH_AMERICA' | 'LATIN_AMERICA' | 'EUROPE' | 'ASIA' | 'MIDDLE_EAST';
  currency: string;
  defaultLanguage: string;
  timezone: string;
  status: 'PLANNED' | 'BETA' | 'ACTIVE' | 'RESTRICTED' | 'DISABLED';
  allowedPayoutMethods: string[];
  minimumPayoutUsd: number;
  hostSharePct: number;
  platformSharePct: number;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_COUNTRIES: Omit<CountryConfig, 'createdAt' | 'updatedAt'>[] = [
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    region: 'NORTH_AMERICA',
    currency: 'USD',
    defaultLanguage: 'EN',
    timezone: 'America/New_York',
    status: 'ACTIVE',
    allowedPayoutMethods: ['PAYPAL', 'BANK_TRANSFER'],
    minimumPayoutUsd: 50,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
  },
  {
    countryCode: 'EC',
    countryName: 'Ecuador',
    region: 'LATIN_AMERICA',
    currency: 'USD',
    defaultLanguage: 'ES',
    timezone: 'America/Guayaquil',
    status: 'ACTIVE',
    allowedPayoutMethods: ['BANK_TRANSFER', 'PAYPAL'],
    minimumPayoutUsd: 50,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
  },
  {
    countryCode: 'MX',
    countryName: 'México',
    region: 'LATIN_AMERICA',
    currency: 'MXN',
    defaultLanguage: 'ES',
    timezone: 'America/Mexico_City',
    status: 'ACTIVE',
    allowedPayoutMethods: ['BANK_TRANSFER', 'PAYPAL'],
    minimumPayoutUsd: 50,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
  },
  {
    countryCode: 'CO',
    countryName: 'Colombia',
    region: 'LATIN_AMERICA',
    currency: 'COP',
    defaultLanguage: 'ES',
    timezone: 'America/Bogota',
    status: 'ACTIVE',
    allowedPayoutMethods: ['BANK_TRANSFER', 'PAYPAL'],
    minimumPayoutUsd: 50,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
  },
  {
    countryCode: 'PE',
    countryName: 'Perú',
    region: 'LATIN_AMERICA',
    currency: 'PEN',
    defaultLanguage: 'ES',
    timezone: 'America/Lima',
    status: 'ACTIVE',
    allowedPayoutMethods: ['BANK_TRANSFER', 'PAYPAL'],
    minimumPayoutUsd: 50,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
  },
  {
    countryCode: 'ES',
    countryName: 'España',
    region: 'EUROPE',
    currency: 'EUR',
    defaultLanguage: 'ES',
    timezone: 'Europe/Madrid',
    status: 'ACTIVE',
    allowedPayoutMethods: ['BANK_TRANSFER', 'PAYPAL'],
    minimumPayoutUsd: 50,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
  },
  {
    countryCode: 'BR',
    countryName: 'Brasil',
    region: 'LATIN_AMERICA',
    currency: 'BRL',
    defaultLanguage: 'PT',
    timezone: 'America/Sao_Paulo',
    status: 'BETA',
    allowedPayoutMethods: ['BANK_TRANSFER', 'PAYPAL'],
    minimumPayoutUsd: 50,
    hostSharePct: 0.70,
    platformSharePct: 0.30,
  },
];

export const seedRegionalConfigs = async () => {
  console.log('[Seed] Seeding Regional Country Configurations...');
  const timestamp = new Date().toISOString();

  await db.collection('systemConfig').doc('regional').set({
    globalExpansionEnabled: true,
    defaultCountry: 'US',
    defaultLanguage: 'ES',
    updatedAt: timestamp,
  }, { merge: true });

  const batch = db.batch();
  for (const country of INITIAL_COUNTRIES) {
    const ref = db.collection('countryConfigs').doc(country.countryCode);
    batch.set(ref, { ...country, createdAt: timestamp, updatedAt: timestamp }, { merge: true });
  }

  await batch.commit();
  console.log(`[Seed] ✅ Regional Configurations Seeded: ${INITIAL_COUNTRIES.length} countries.`);
};

if (require.main === module) {
  seedRegionalConfigs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Regional Configs Error]:', err);
      process.exit(1);
    });
}
