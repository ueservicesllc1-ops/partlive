import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface ProductCatalogEntry {
  internalId: string;
  type: 'COIN_PACKAGE' | 'VIP' | 'SUBSCRIPTION' | 'PREMIUM_EVENT';
  coins: number;
  priceUsd: number;
  currency: string;
  appleProductId: string;
  googleProductId: string;
  label: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const COIN_PACKAGES: Omit<ProductCatalogEntry, 'createdAt'>[] = [
  {
    internalId: 'coins_100',
    type: 'COIN_PACKAGE',
    coins: 100,
    priceUsd: 0.99,
    currency: 'USD',
    appleProductId: 'com.partylive.coins.100',
    googleProductId: 'com.partylive.coins.100',
    label: '100 Coins',
    status: 'ACTIVE',
  },
  {
    internalId: 'coins_500',
    type: 'COIN_PACKAGE',
    coins: 500,
    priceUsd: 4.99,
    currency: 'USD',
    appleProductId: 'com.partylive.coins.500',
    googleProductId: 'com.partylive.coins.500',
    label: '500 Coins',
    status: 'ACTIVE',
  },
  {
    internalId: 'coins_1000',
    type: 'COIN_PACKAGE',
    coins: 1000,
    priceUsd: 9.99,
    currency: 'USD',
    appleProductId: 'com.partylive.coins.1000',
    googleProductId: 'com.partylive.coins.1000',
    label: '1,000 Coins',
    status: 'ACTIVE',
  },
  {
    internalId: 'coins_5000',
    type: 'COIN_PACKAGE',
    coins: 5000,
    priceUsd: 44.99,
    currency: 'USD',
    appleProductId: 'com.partylive.coins.5000',
    googleProductId: 'com.partylive.coins.5000',
    label: '5,000 Coins',
    status: 'ACTIVE',
  },
  {
    internalId: 'coins_10000',
    type: 'COIN_PACKAGE',
    coins: 10000,
    priceUsd: 84.99,
    currency: 'USD',
    appleProductId: 'com.partylive.coins.10000',
    googleProductId: 'com.partylive.coins.10000',
    label: '10,000 Coins',
    status: 'ACTIVE',
  },
];

const VIP_PRODUCTS: Omit<ProductCatalogEntry, 'createdAt'>[] = [
  {
    internalId: 'vip_monthly',
    type: 'VIP',
    coins: 0,
    priceUsd: 9.99,
    currency: 'USD',
    appleProductId: 'com.partylive.vip.monthly',
    googleProductId: 'com.partylive.vip.monthly',
    label: 'VIP Monthly',
    status: 'ACTIVE',
  },
];

export const seedProductCatalog = async () => {
  console.log('[Seed] Seeding Product Catalog...');
  const batch = db.batch();
  const timestamp = new Date().toISOString();

  const allProducts = [...COIN_PACKAGES, ...VIP_PRODUCTS];

  for (const product of allProducts) {
    const ref = db.collection('products').doc(product.internalId);
    batch.set(ref, { ...product, createdAt: timestamp }, { merge: true });
  }

  // Store economy config
  await db.collection('systemConfig').doc('economy').set({
    coinToDiamondRate: 1,   // 1 Coin = 1 Diamond (configurable)
    diamondsPerUsd: 100,    // 100 Diamonds = $1 USD
    minPayoutDiamonds: 5000,
    platformSharePct: 0.30, // 30% platform fee
    hostSharePct: 0.70,     // 70% to host
    updatedAt: timestamp,
  }, { merge: true });

  await batch.commit();
  console.log(`[Seed] ✅ Product Catalog Seeded: ${allProducts.length} products.`);
};

export const getActiveProducts = async (): Promise<ProductCatalogEntry[]> => {
  const snap = await db.collection('products')
    .where('status', '==', 'ACTIVE')
    .get();
  return snap.docs.map((d) => d.data() as ProductCatalogEntry);
};

export const validateProductId = async (internalId: string): Promise<ProductCatalogEntry> => {
  const snap = await db.collection('products').doc(internalId).get();
  if (!snap.exists) throw new Error(`PRODUCT_INVALID: ${internalId}`);
  const product = snap.data() as ProductCatalogEntry;
  if (product.status !== 'ACTIVE') throw new Error(`PRODUCT_INACTIVE: ${internalId}`);
  return product;
};

if (require.main === module) {
  seedProductCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Product Catalog Error]:', err);
      process.exit(1);
    });
}
