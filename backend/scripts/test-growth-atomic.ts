import { db } from '../src/config/firebase';
import { seedGrowthConfig } from '../src/seeds/seedGrowthConfig';
import { trackAcquisitionEvent, getAttributionFunnelReport } from '../src/services/growthAttributionService';
import { generateUserReferralCode, registerReferral, qualifyReferral, getReferralDashboard } from '../src/services/referralService';
import { createAffiliate, recordAffiliateCommission, reverseAffiliateCommission } from '../src/services/affiliateService';

export const runGrowthAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🚀 RUNNING GROWTH ENGINE & REFERRAL ATOMIC TESTS');
  console.log('==================================================\n');

  const referrerId = 'test_referrer_user_' + Date.now();
  const referredUserId = 'test_referred_user_' + Date.now();

  // Create Users
  await db.collection('users').doc(referrerId).set({
    uid: referrerId,
    displayName: 'Usuario Referidor Test',
    xp: 0,
    status: 'active',
  });

  await db.collection('users').doc(referredUserId).set({
    uid: referredUserId,
    displayName: 'Usuario Referido Test',
    status: 'active',
  });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Config
  await seedGrowthConfig();

  // Test 1: Track Acquisition Event
  console.log('\n▶ Test 1: Rastrear evento de adquisición...');
  const acqEvent = await trackAcquisitionEvent(referredUserId, 'REFERRAL', 'camp_101', '', referrerId);
  console.log(`Evento de Adquisición ID: ${acqEvent.id}, Fuente: ${acqEvent.source}`);
  if (acqEvent.id && acqEvent.source === 'REFERRAL') {
    console.log('✅ Test 1 PASADO: Atribución de usuario registrada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Generate Referral Code & Anti-Self-Referral
  console.log('\n▶ Test 2: Generar código de referido y probar protección contra auto-referidos...');
  const refCode = await generateUserReferralCode(referrerId);
  console.log(`Código de Referido Generado: ${refCode}`);

  try {
    await registerReferral(refCode, referrerId); // Self-referral attempt
    console.error('❌ Test 2 FALLIDO: Se permitió auto-referido.');
  } catch (err: any) {
    console.log(`✅ Test 2 PASADO: Auto-referido rechazado correctamente (${err.message}).`);
  }

  // Test 3: Register & Qualify Valid Referral
  console.log('\n▶ Test 3: Registrar y calificar referido legítimo...');
  const refRecord = await registerReferral(refCode, referredUserId);
  await qualifyReferral(referredUserId);

  const dash = await getReferralDashboard(referrerId);
  console.log(`Dashboard Referidor: Total=${dash.totalReferrals}, Calificados=${dash.qualifiedReferrals}, XP Ganada=${dash.earnedXp}`);
  if (dash.qualifiedReferrals >= 1 && dash.earnedXp >= 500) {
    console.log('✅ Test 3 PASADO: Referido calificado e insignia/XP otorgada.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Affiliate Creation & Commission Logging & Reversal
  console.log('\n▶ Test 4: Crear socio Afiliado, registrar comisión y procesar reversión...');
  const aff = await createAffiliate('Socio Influencer Test', referrerId, 'PL-TEST2026', 'REV_SHARE', 10.0);
  const comm = await recordAffiliateCommission(aff.id, referredUserId, 'tx_source_777', 100.0);

  console.log(`Comisión Registrada ID: ${comm?.id}, Importe Bruto: $${comm?.grossRevenue}, Comisión (10%): $${comm?.commissionAmount}`);
  
  await reverseAffiliateCommission('tx_source_777', 'Solicitud de reembolso');
  const commDoc = await db.collection('affiliateCommissionLedger').doc(comm!.id).get();
  console.log(`Estado de Comisión tras Reembolso: ${commDoc.data()?.status}`);

  if (commDoc.data()?.status === 'REVERSED') {
    console.log('✅ Test 4 PASADO: Comisión de afiliado registrada y revertida por reembolso.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(referrerId).delete();
  await db.collection('users').doc(referredUserId).delete();
  await db.collection('referralCodes').doc(refCode).delete();
  await db.collection('referrals').doc(refRecord.id).delete();
  await db.collection('affiliates').doc(aff.id).delete();
  await db.collection('affiliateCommissionLedger').doc(comm!.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE CRECIMIENTO Y REFERIDOS COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runGrowthAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Crecimiento:', err);
      process.exit(1);
    });
}
