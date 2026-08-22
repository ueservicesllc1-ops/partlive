import { db } from '../config/firebase';

export interface HelpArticle {
  articleId: string;
  title: string;
  category: 'ACCOUNT' | 'PAYMENT' | 'COINS' | 'GIFTS' | 'PAYOUT' | 'SAFETY' | 'TECHNICAL';
  summary: string;
  content: string;
  language: string;
  keywords: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  status: 'PUBLISHED' | 'DRAFT';
  version: string;
  createdAt: string;
}

const INITIAL_ARTICLES: Omit<HelpArticle, 'createdAt'>[] = [
  {
    articleId: 'art_buy_coins',
    title: '¿Cómo comprar Coins en PartyLive?',
    category: 'COINS',
    summary: 'Guía paso a paso para adquirir paquetes de Coins con Google Play o Apple App Store.',
    content: 'Para comprar Coins, dirígete a tu Billetera o presiona el botón de Regalos durante una transmisión. Selecciona el paquete deseado y confirma el pago con tu método preferido.',
    language: 'ES',
    keywords: ['comprar', 'coins', 'pago', 'tarjeta', 'monedas'],
    helpfulCount: 42,
    notHelpfulCount: 1,
    status: 'PUBLISHED',
    version: 'v1.0',
  },
  {
    articleId: 'art_withdraw_diamonds',
    title: '¿Cómo retirar mis Diamantes a dinero real?',
    category: 'PAYOUT',
    summary: 'Requisitos y pasos para solicitar un pago (Payout) de tus Diamantes acumulados.',
    content: 'Los anfitriones con verificación KYC aprobada y un saldo mínimo de 5,000 Diamantes pueden solicitar retiros a PayPal, transferencia bancaria o Binance desde Creator Studio > Retiros.',
    language: 'ES',
    keywords: ['retirar', 'diamantes', 'payout', 'paypal', 'banco', 'dólares'],
    helpfulCount: 88,
    notHelpfulCount: 3,
    status: 'PUBLISHED',
    version: 'v1.0',
  },
  {
    articleId: 'art_missing_coins',
    title: 'Pagué pero no recibí mis Coins, ¿qué hago?',
    category: 'PAYMENT',
    summary: 'Pasos para solucionar o reportar problemas con compras de Coins pendientes.',
    content: 'Si tu pago fue procesado pero no ves los Coins acreditados, presiona "Contactar Soporte" abajo e incluye el ID de transacción GPA/Apple.',
    language: 'ES',
    keywords: ['problema', 'pago', 'coins', 'no recibi', 'soporte'],
    helpfulCount: 65,
    notHelpfulCount: 4,
    status: 'PUBLISHED',
    version: 'v1.0',
  },
  {
    articleId: 'art_report_safety',
    title: '¿Cómo reportar acoso o contenido inapropiado?',
    category: 'SAFETY',
    summary: 'Herramientas de reporte y bloqueo para mantener una comunidad segura.',
    content: 'En cualquier Live o Perfil, presiona los tres puntos (...) y selecciona "Reportar". El equipo de Trust & Safety revisará el caso de inmediato.',
    language: 'ES',
    keywords: ['reportar', 'acoso', 'bloquear', 'seguridad', 'violacion'],
    helpfulCount: 35,
    notHelpfulCount: 0,
    status: 'PUBLISHED',
    version: 'v1.0',
  },
];

export const seedHelpCenter = async () => {
  console.log('[Seed] Seeding Help Center Knowledge Base...');
  const timestamp = new Date().toISOString();

  await db.collection('systemConfig').doc('helpCenter').set({
    enabled: true,
    supportedLanguages: ['ES', 'EN', 'PT'],
    updatedAt: timestamp,
  }, { merge: true });

  const batch = db.batch();
  for (const article of INITIAL_ARTICLES) {
    const ref = db.collection('helpArticles').doc(article.articleId);
    batch.set(ref, { ...article, createdAt: timestamp }, { merge: true });
  }

  await batch.commit();
  console.log(`[Seed] ✅ Help Center Seeded: ${INITIAL_ARTICLES.length} articles.`);
};

if (require.main === module) {
  seedHelpCenter()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Help Center Error]:', err);
      process.exit(1);
    });
}
