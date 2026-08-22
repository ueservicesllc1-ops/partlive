import { db } from '../src/config/firebase';
import { processTapBatch, setLiveGoal } from '../src/services/tapEngineService';
import { recordDailyStreak, awardPartyPoints, getUserGamificationProfile } from '../src/services/gamificationService';

export const runGamificationAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🎮 RUNNING GAMIFICATION, TAPS & STREAKS ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_gami_user_' + Date.now();
  const liveId = 'live_gami_test_' + Date.now();

  await db.collection('users').doc(userId).set({ uid: userId, displayName: 'Usuario Gamer', status: 'active' });
  await db.collection('lives').doc(liveId).set({ id: liveId, title: 'Live de Prueba', status: 'active', tapCount: 0, liveEnergy: 0 });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Process 👍 Tap Batch & Live Energy Formula
  console.log('\n▶ Test 1: Procesar lote de taps 👍 y calcular energía del Live...');
  const tapRes1 = await processTapBatch(userId, liveId, 15);
  console.log(`Taps Procesados: 15. Total Taps: ${tapRes1.totalTaps}, Energía del Live: ${tapRes1.liveEnergy}`);

  if (tapRes1.totalTaps === 15 && tapRes1.liveEnergy === 15) {
    console.log('✅ Test 1 PASADO: Lote de taps 👍 procesado y energía calculada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Rate Limit Anti-Abuse (Max 30 taps/batch)
  console.log('\n▶ Test 2: Probar límite anti-abuso (100 taps reducidos a 30 por lote)...');
  const tapRes2 = await processTapBatch(userId, liveId, 100);
  console.log(`Taps Totales tras intento excesivo: ${tapRes2.totalTaps}`);

  if (tapRes2.totalTaps === 45) { // 15 + 30
    console.log('✅ Test 2 PASADO: Protección anti-abuso de taps aplicada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Set Live Goal & Goal Celebration
  console.log('\n▶ Test 3: Estableser meta de taps del Live (Tap Goal: 50)...');
  await setLiveGoal(liveId, 50, userId);
  const tapRes3 = await processTapBatch(userId, liveId, 10);
  console.log(`Taps Totales: ${tapRes3.totalTaps}, Meta Alcanzada: ${tapRes3.goalReached}`);

  if (tapRes3.totalTaps === 55 && tapRes3.goalReached === true) {
    console.log('✅ Test 3 PASADO: Meta del Live alcanzada y evento registrado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Daily Streak & User Level
  console.log('\n▶ Test 4: Registrar racha de días (Daily Streak)...');
  const streakProfile = await recordDailyStreak(userId);
  console.log(`Días de Racha: ${streakProfile.currentStreakDays}, Nivel de Usuario: ${streakProfile.userLevel}`);

  if (streakProfile.currentStreakDays >= 1 && Boolean(streakProfile.userLevel)) {
    console.log('✅ Test 4 PASADO: Racha de usuario registrada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Award Non-Financial Party Points
  console.log('\n▶ Test 5: Otorgar Party Points (Moneda no financiera)...');
  const pointsRes = await awardPartyPoints(userId, 50, 'Misión diaria completada');
  console.log(`Party Points Totales: ${pointsRes.newTotalPoints}`);

  const profile = await getUserGamificationProfile(userId);
  if (profile.partyPoints >= 50) {
    console.log('✅ Test 5 PASADO: Party Points acumulados exitosamente.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();
  await db.collection('lives').doc(liveId).delete();
  await db.collection('userGamification').doc(userId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE GAMIFICACIÓN COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runGamificationAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Gamificación:', err);
      process.exit(1);
    });
}
