import { db } from '../config/firebase';

export interface LegalPolicy {
  policyId: string;
  title: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'SUPERSEDED';
  effectiveAt: string;
  summary: string;
  contentUrl: string;
  createdAt: string;
}

const INITIAL_POLICIES: Omit<LegalPolicy, 'createdAt'>[] = [
  {
    policyId: 'TERMS_OF_SERVICE',
    title: 'Términos y Condiciones de Servicio de PartyLive',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveAt: new Date().toISOString(),
    summary: 'Términos principales de uso de la plataforma PartyLive, registro y reglas comunitarias.',
    contentUrl: 'https://cdn.partylive.app/legal/terms-v1.0.html',
  },
  {
    policyId: 'PRIVACY_POLICY',
    title: 'Política de Privacidad y Protección de Datos',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveAt: new Date().toISOString(),
    summary: 'Tratamiento de datos personales, derechos ARCO, minimización y política de cookies.',
    contentUrl: 'https://cdn.partylive.app/legal/privacy-v1.0.html',
  },
  {
    policyId: 'COMMUNITY_GUIDELINES',
    title: 'Pautas de la Comunidad PartyLive',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveAt: new Date().toISOString(),
    summary: 'Reglas de convivencia, prohibición de acoso, spam, fraude y contenido inapropiado.',
    contentUrl: 'https://cdn.partylive.app/legal/guidelines-v1.0.html',
  },
  {
    policyId: 'CREATOR_AGREEMENT',
    title: 'Acuerdo de Creador y Anfitrión PartyLive',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveAt: new Date().toISOString(),
    summary: 'Términos de monetización para Creadores, Diamantes, Retiros y normas de transmisión.',
    contentUrl: 'https://cdn.partylive.app/legal/creator-agreement-v1.0.html',
  },
  {
    policyId: 'VIRTUAL_CURRENCY_TERMS',
    title: 'Términos de Moneda Virtual y Regalos',
    version: 'v1.0',
    status: 'ACTIVE',
    effectiveAt: new Date().toISOString(),
    summary: 'Condiciones de uso de Coins y Diamonds. Las monedas virtuales no son dinero legal.',
    contentUrl: 'https://cdn.partylive.app/legal/virtual-currency-v1.0.html',
  },
];

export const seedLegalPolicies = async () => {
  console.log('[Seed] Seeding Legal Policies & Versioning...');
  const timestamp = new Date().toISOString();

  await db.collection('systemConfig').doc('legal').set({
    policyVersioningEnabled: true,
    requireExplicitTermsAcceptance: true,
    accountDeletionGracePeriodDays: 14,
    updatedAt: timestamp,
  }, { merge: true });

  const batch = db.batch();
  for (const policy of INITIAL_POLICIES) {
    const ref = db.collection('legalPolicies').doc(policy.policyId);
    batch.set(ref, { ...policy, createdAt: timestamp }, { merge: true });
  }

  await batch.commit();
  console.log(`[Seed] ✅ Legal Policies Seeded: ${INITIAL_POLICIES.length} policies.`);
};

if (require.main === module) {
  seedLegalPolicies()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Legal Error]:', err);
      process.exit(1);
    });
}
