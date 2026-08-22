import { db } from '../src/config/firebase';
import { recordTapLikeBatch, getLiveTapLikeStats } from '../src/services/tapLikeService';

export const runTapLikeAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('👍 RUNNING TAP LIKE SYSTEM ATOMIC TESTS');
  console.log('==================================================\n');

  const liveId = 'test_tap_live_' + Date.now();
  const userId1 = 'test_tap_user_a_' + Date.now();
  const userId2 = 'test_tap_user_b_' + Date.now();

  // Test 1: Batch flush — 25 taps as one write
  console.log('\n▶ Test 1: Registrar lote de 25 taps en una sola escritura...');
  const result1 = await recordTapLikeBatch(liveId, userId1, 25);
  console.log(`Total Likes tras Lote 1: ${result1.totalLikes}, Likes/min: ${result1.likesPerMinute}`);
  if (result1.totalLikes === 25) {
    console.log('✅ Test 1 PASADO: 25 taps registrados en una escritura agregada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Second batch from different user
  console.log('\n▶ Test 2: Registrar segundo lote de 10 taps (usuario distinto)...');
  const result2 = await recordTapLikeBatch(liveId, userId2, 10);
  console.log(`Total Likes tras Lote 2: ${result2.totalLikes}`);
  if (result2.totalLikes === 35) {
    console.log('✅ Test 2 PASADO: Acumulación correcta con múltiples usuarios.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Anti-spam cap — 500 taps must be clamped to 50
  console.log('\n▶ Test 3: Intentar inyectar 500 taps (debe limitarse a 50)...');
  const result3 = await recordTapLikeBatch(liveId, userId1, 500);
  const expectedAfterCap = 35 + 50; // capped at 50
  console.log(`Total tras intento de 500: ${result3.totalLikes}`);
  if (result3.totalLikes === expectedAfterCap) {
    console.log('✅ Test 3 PASADO: Anti-spam cap aplicado correctamente (500 → 50).');
  } else {
    console.error(`❌ Test 3 FALLIDO. Esperado ${expectedAfterCap}, Obtenido ${result3.totalLikes}`);
  }

  // Test 4: Get live tap stats
  console.log('\n▶ Test 4: Consultar estadísticas de Tap Like del Live...');
  const stats = await getLiveTapLikeStats(liveId);
  console.log(`Stats: Total=${stats.totalLikes}, Likes/min=${stats.likesPerMinute}`);
  if (stats.totalLikes === expectedAfterCap) {
    console.log('✅ Test 4 PASADO: Estadísticas de Tap Like consistentes.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('liveLikes').doc(liveId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE TAP LIKE COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runTapLikeAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Tap Like:', err);
      process.exit(1);
    });
}
