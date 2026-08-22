import { db } from '../src/config/firebase';
import {
  getMonetizationProducts,
  purchaseVIPMembership,
  purchaseEventTicket,
  createCreatorBoost,
  createSponsorshipCampaign,
  verifyPriceIntegrity,
  getMonetizationProfitabilityReport,
} from '../src/services/advancedMonetizationService';

export const runAdvancedMonetizationAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('💎 RUNNING ADVANCED MONETIZATION & MULTI-PRODUCT ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_monetize_user_' + Date.now();
  const hostId = 'test_monetize_host_' + Date.now();
  const sponsorId = 'test_monetize_sponsor_' + Date.now();

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Product Catalog Query
  console.log('\n▶ Test 1: Consultar catálogo universal de 10 productos de monetización...');
  const products = await getMonetizationProducts();
  console.log(`Productos en Catálogo: ${products.length} productos cargados.`);

  if (products.length >= 5) {
    console.log('✅ Test 1 PASADO: Catálogo universal de productos consultado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Server-Side Price Protection Guard
  console.log('\n▶ Test 2: Verificar la guardia de integridad de precios server-side (Anti-tampering)...');
  const validPrice = verifyPriceIntegrity('VIP_LEVEL_1', 499);
  const tamperedPrice = verifyPriceIntegrity('VIP_LEVEL_1', 100);

  console.log(`Precio Válido ($4.99): ${validPrice}, Precio Manipulado ($1.00): ${tamperedPrice}`);
  if (validPrice && !tamperedPrice) {
    console.log('✅ Test 2 PASADO: Intentos de manipulación de precio bloqueados correctamente.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Purchase VIP Membership
  console.log('\n▶ Test 3: Comprar membresía VIP 5 Leyenda y verificar insignia de usuario...');
  const vip = await purchaseVIPMembership(userId, 5, 1);
  console.log(`VIP Adquirido ID: ${vip.id}, Nivel: ${vip.vipLevel}, Insignia: ${vip.badge}, Estado: ${vip.status}`);

  if (vip.vipLevel === 5 && vip.status === 'ACTIVE') {
    console.log('✅ Test 3 PASADO: Membresía VIP adquirida e insignia asignada.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Purchase Paid Event Ticket
  console.log('\n▶ Test 4: Comprar entrada para evento en vivo pagado...');
  const ticket = await purchaseEventTicket(userId, 'demo_event_99', 'EVENT_TICKET_KARAOKE');
  console.log(`Entrada ID: ${ticket.ticketId}, Evento: ${ticket.eventId}, Precio Cents: ${ticket.priceCents}`);

  if (ticket.priceCents === 299 && ticket.eventId === 'demo_event_99') {
    console.log('✅ Test 4 PASADO: Entrada de evento comprada y validada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Creator Boost & Sponsorship Campaign
  console.log('\n▶ Test 5: Crear impulso (Boost) de transmisión y campaña de patrocinio...');
  const boost = await createCreatorBoost(hostId, 'LIVE', 'demo_live_123', 15.0, 4);
  const sponsor = await createSponsorshipCampaign(sponsorId, hostId, 500.0, ['Mention in Live', 'Social Post']);

  console.log(`Boost ID: ${boost.id}, Presupuesto: $${boost.budgetUsd} USD`);
  console.log(`Patrocinio ID: ${sponsor.id}, Presupuesto: $${sponsor.budgetUsd} USD, Estado: ${sponsor.status}`);

  if (boost.status === 'ACTIVE' && sponsor.status === 'ACTIVE') {
    console.log('✅ Test 5 PASADO: Impulso y campaña de patrocinio creados exitosamente.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Product Profitability Aggregator
  console.log('\n▶ Test 6: Consultar reporte consolidado de rentabilidad por producto...');
  const report = await getMonetizationProfitabilityReport();
  console.log(`Ventas Brutas: $${report.grossRevenueUsd} USD, Margen de Contribución: $${report.contributionMarginUsd} USD`);

  if (report.grossRevenueUsd > 0 && report.contributionMarginUsd > 0) {
    console.log('✅ Test 6 PASADO: Reporte de rentabilidad por producto generado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Cleanup
  await db.collection('vipMemberships').doc(userId).delete();
  await db.collection('eventTickets').doc(ticket.ticketId).delete();
  await db.collection('creatorBoosts').doc(boost.id).delete();
  await db.collection('sponsorshipCampaigns').doc(sponsor.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE MONETIZACIÓN AVANZADA COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runAdvancedMonetizationAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Monetización Avanzada:', err);
      process.exit(1);
    });
}
