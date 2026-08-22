import { db } from '../src/config/firebase';
import { seedMusicCatalog } from '../src/seeds/seedMusicCatalog';
import { checkTrackAccess, getLicensedCatalog } from '../src/services/musicCatalogService';
import {
  submitCopyrightClaim,
  processTakedownAction,
  fileCopyrightAppeal,
  issueCopyrightStrike,
} from '../src/services/copyrightService';

export const runMusicAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🎵 RUNNING MUSIC CATALOG & COPYRIGHT ATOMIC TESTS');
  console.log('==================================================\n');

  const claimantId = 'test_claimant_' + Date.now();
  const creatorId = 'test_creator_' + Date.now();

  await db.collection('users').doc(claimantId).set({ uid: claimantId, displayName: 'Reclamante Test', status: 'active' });
  await db.collection('users').doc(creatorId).set({ uid: creatorId, displayName: 'Creador Test', status: 'active' });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Catalog
  await seedMusicCatalog();

  // Test 1: Geo-blocking & Access Check
  console.log('\n▶ Test 1: Probar geobloqueo por territorio (track_restricted_demo)...');
  const accessUS = await checkTrackAccess('track_restricted_demo', 'US');
  const accessEC = await checkTrackAccess('track_restricted_demo', 'EC');

  console.log(`Acceso US: ${accessUS.allowed}, Acceso EC (bloqueado): ${accessEC.allowed} (${accessEC.reason})`);
  if (accessUS.allowed && !accessEC.allowed) {
    console.log('✅ Test 1 PASADO: Geobloqueo por territorio aplicado correctamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Query Licensed Catalog
  console.log('\n▶ Test 2: Consultar catálogo de pistas licenciadas...');
  const catalog = await getLicensedCatalog('US');
  console.log(`Pistas Licenciadas en US: ${catalog.length}`);
  if (catalog.length >= 2) {
    console.log('✅ Test 2 PASADO: Catálogo de música consultado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Copyright Claim & Takedown Action
  console.log('\n▶ Test 3: Registrar reclamación de derechos y ejecutar Takedown...');
  const clipRef = db.collection('clips').doc();
  await clipRef.set({ id: clipRef.id, creatorId, status: 'PUBLISHED', isMuted: false });

  const claim = await submitCopyrightClaim(clipRef.id, 'CLIP', claimantId, 'Uncredited commercial audio usage');
  console.log(`Reclamación Creada ID: ${claim.id}, Estado: ${claim.status}`);

  const processed = await processTakedownAction(claim.id, 'MUTE', 'admin_tester');
  const updatedClip = await clipRef.get();

  console.log(`Acción Ejecutada: ${processed.actionTaken}, Clip Silenciado: ${updatedClip.data()?.isMuted}`);
  if (processed.actionTaken === 'MUTE' && updatedClip.data()?.isMuted === true) {
    console.log('✅ Test 3 PASADO: Reclamación procesada y contenido silenciado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Appeal Filing
  console.log('\n▶ Test 4: Registrar apelación del creador...');
  await fileCopyrightAppeal(claim.id, creatorId, 'I hold a valid synchronization license for this track.');
  const appealedClaim = await db.collection('copyrightClaims').doc(claim.id).get();

  console.log(`Estado tras Apelación: ${appealedClaim.data()?.status}`);
  if (appealedClaim.data()?.status === 'APPEALED') {
    console.log('✅ Test 4 PASADO: Apelación registrada exitosamente.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Copyright Strike Progressive Penalties
  console.log('\n▶ Test 5: Aplicar Strikes de Derechos de Autor acumulativos...');
  await issueCopyrightStrike(creatorId, clipRef.id, 'Strike 1');
  await issueCopyrightStrike(creatorId, clipRef.id, 'Strike 2');
  const strikeRes3 = await issueCopyrightStrike(creatorId, clipRef.id, 'Strike 3');

  const suspendedUser = await db.collection('users').doc(creatorId).get();

  console.log(`Total Strikes: ${strikeRes3.strikeCount}, Estado de Usuario tras Strike 3: ${suspendedUser.data()?.status}`);
  if (strikeRes3.strikeCount === 3 && suspendedUser.data()?.status === 'suspended') {
    console.log('✅ Test 5 PASADO: Penalización progresiva de strikes aplicada (Suspensión en Strike 3).');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(claimantId).delete();
  await db.collection('users').doc(creatorId).delete();
  await db.collection('clips').doc(clipRef.id).delete();
  await db.collection('copyrightClaims').doc(claim.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE MÚSICA Y DERECHOS COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runMusicAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Música:', err);
      process.exit(1);
    });
}
