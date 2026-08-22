import { db } from '../src/config/firebase';
import { seedCreatorLevels } from '../src/seeds/seedCreatorLevels';
import {
  submitHostApplication,
  reviewHostApplication,
  awardCreatorXP,
  getCreatorProfile,
} from '../src/services/creatorGrowthService';
import { inviteHostToAgency, respondToAgencyInvitation } from '../src/services/agencyMarketplaceService';
import { createBonusCampaign, awardCreatorBonus } from '../src/services/creatorIncentiveService';

export const runCreatorAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🌟 RUNNING CREATOR GROWTH & AGENCY MARKETPLACE ATOMIC TESTS');
  console.log('==================================================\n');

  const adminId = 'test_crea_admin_' + Date.now();
  const userId = 'test_crea_user_' + Date.now();
  const agencyId = 'test_agency_' + Date.now();

  await db.collection('users').doc(adminId).set({ uid: adminId, displayName: 'Admin Creadores', status: 'active', role: 'admin' });
  await db.collection('users').doc(userId).set({ uid: userId, displayName: 'Aspirante Anfitrión', status: 'active' });
  await db.collection('agencies').doc(agencyId).set({ id: agencyId, name: 'Agencia Top Stars', status: 'ACTIVE' });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Levels
  await seedCreatorLevels();

  // Test 1: Submit & Review Host Application
  console.log('\n▶ Test 1: Enviar y aprobar solicitud de anfitrión...');
  const app = await submitHostApplication(userId, {
    displayName: 'Carlos Host',
    category: 'Música',
    bio: 'Cantante profesional de pop latino.',
    country: 'EC',
  });

  const reviewedApp = await reviewHostApplication(app.id, true, adminId);
  console.log(`Estado de Solicitud: ${reviewedApp.status}`);

  const profile = await getCreatorProfile(userId);
  console.log(`Es Anfitrión: ${profile.isHost}, Nivel Inicial: ${profile.creatorLevel}, Categoría: ${profile.category}`);

  if (reviewedApp.status === 'APPROVED' && profile.isHost && profile.creatorLevel === 'Rookie') {
    console.log('✅ Test 1 PASADO: Solicitud de anfitrión aprobada correctamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Award Creator XP & Promotion
  console.log('\n▶ Test 2: Otorgar XP de creador y verificar promoción de nivel (Rookie -> Rising)...');
  const updatedProfile = await awardCreatorXP(userId, 150);
  console.log(`XP Acumulado: ${updatedProfile.creatorXp}, Nuevo Nivel: ${updatedProfile.creatorLevel}`);

  if (updatedProfile.creatorXp === 150 && updatedProfile.creatorLevel === 'Rising') {
    console.log('✅ Test 2 PASADO: Promoción de nivel de creador otorgada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Agency Binding
  console.log('\n▶ Test 3: Vincular anfitrión a Agencia...');
  await inviteHostToAgency(agencyId, userId);
  const bindingRes = await respondToAgencyInvitation(userId, agencyId, true);
  console.log(`Vinculación exitosa: ${bindingRes.success}, Agencia: ${bindingRes.agencyId}`);

  const boundProfile = await getCreatorProfile(userId);
  if (boundProfile.agencyId === agencyId) {
    console.log('✅ Test 3 PASADO: Anfitrión vinculado exitosamente a su agencia principal.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Bonus Campaign Budget Control
  console.log('\n▶ Test 4: Probar tope estricto de presupuesto en campaña de bonos...');
  const campaign = await createBonusCampaign('Bono Primer Live', 100.00, 50.00);

  // Award 1: $50 (Spent: $50 / $100)
  const award1 = await awardCreatorBonus(userId, campaign.id, 50.00);
  console.log(`Bono 1 Otorgado. Presupuesto Gastado: $${award1.newSpentBudgetUsd}`);

  // Award 2: $50 (Spent: $100 / $100)
  const award2 = await awardCreatorBonus(userId, campaign.id, 50.00);
  console.log(`Bono 2 Otorgado. Presupuesto Gastado: $${award2.newSpentBudgetUsd}`);

  // Award 3: $50 (Exceeds $100 budget -> MUST FAIL)
  let failedAsExpected = false;
  try {
    await awardCreatorBonus(userId, campaign.id, 50.00);
  } catch (err: any) {
    failedAsExpected = true;
    console.log(`Bloqueo correcto por presupuesto agotado: ${err.message}`);
  }

  if (award2.newSpentBudgetUsd === 100.00 && failedAsExpected) {
    console.log('✅ Test 4 PASADO: Límite estricto de presupuesto de bono aplicado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(adminId).delete();
  await db.collection('users').doc(userId).delete();
  await db.collection('agencies').doc(agencyId).delete();
  await db.collection('hostApplications').doc(app.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE CREADORES COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runCreatorAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Creadores:', err);
      process.exit(1);
    });
}
