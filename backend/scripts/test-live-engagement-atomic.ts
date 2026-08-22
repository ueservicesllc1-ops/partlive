import { db } from '../src/config/firebase';
import {
  recordLiveEngagementEvent,
  calculateLiveEngagementScore,
  processTapBatch,
  createLivePoll,
  voteLivePoll,
  createLiveSeries,
  getLiveMomentTimeline,
} from '../src/services/liveEngagementEngineService';

export const runLiveEngagementAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🔥 RUNNING LIVE ENGAGEMENT, INTERACTION & SCORE ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_eng_user_' + Date.now();
  const liveId = 'test_eng_live_' + Date.now();

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Record Live Engagement Event
  console.log('\n▶ Test 1: Registrar evento centralizado de interacción en vivo...');
  const event = await recordLiveEngagementEvent(liveId, userId, 'USER_TAPPED', { tapCount: 10 });
  console.log(`Evento Registrado ID: ${event.id}, Tipo: ${event.eventType}, Live ID: ${event.liveId}`);

  if (event.eventType === 'USER_TAPPED' && event.liveId === liveId) {
    console.log('✅ Test 1 PASADO: Evento de interacción registrado correctamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Live Energy Score Calculation
  console.log('\n▶ Test 2: Calcular puntaje de energía en tiempo real (Live Energy Score)...');
  const score = await calculateLiveEngagementScore(liveId);
  console.log(`Live Energy Score: ${score.liveEnergyScore} (Taps: ${score.tapsCount}, Comentarios: ${score.commentsCount}, Regalos: ${score.giftsCount})`);

  if (score.liveEnergyScore > 0 && score.tapsCount >= 0) {
    console.log('✅ Test 2 PASADO: Puntaje de energía en vivo calculado dinámicamente.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Tap 👍 Batch Processing & Combo Multipliers
  console.log('\n▶ Test 3: Procesar lote de Taps 👍 con multiplicador de combo y anti-bot...');
  const tapBatch = await processTapBatch(liveId, userId, 25);
  console.log(`Taps Aceptados: ${tapBatch.acceptedTaps}, Combo Multiplicador: ${tapBatch.comboMultiplier}`);

  if (tapBatch.acceptedTaps === 25 && tapBatch.comboMultiplier === 'x50') {
    console.log('✅ Test 3 PASADO: Lote de Taps procesado con multiplicador de combo validado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Live Polls Creation & Voting
  console.log('\n▶ Test 4: Crear encuesta en vivo y registrar voto en tiempo real...');
  const poll = await createLivePoll(liveId, '¿Cuál es tu canción favorita?', ['Pop', 'Rock', 'Balada']);
  const updatedPoll = await voteLivePoll(poll.id, userId, 1); // Vote for Rock

  console.log(`Encuesta ID: ${poll.id}, Votos Totales: ${updatedPoll.totalVotes}, Opción Ganadora: ${updatedPoll.options[1].text} (${updatedPoll.options[1].votes} voto)`);
  if (updatedPoll.totalVotes === 1 && updatedPoll.options[1].votes === 1) {
    console.log('✅ Test 4 PASADO: Encuesta creada y voto registrado en tiempo real.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Live Moment Timeline
  console.log('\n▶ Test 5: Consultar cronología de momentos destacados (Moment Timeline)...');
  const timeline = await getLiveMomentTimeline(liveId);
  console.log(`Hitos en Línea de Tiempo: ${timeline.length} hitos registrados.`);

  if (timeline.length >= 4) {
    console.log('✅ Test 5 PASADO: Cronología de momentos destacados en vivo generada.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('liveEngagementEvents').doc(event.id).delete();
  await db.collection('livePolls').doc(poll.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE ENGAGEMENT Y ENERGÍA COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runLiveEngagementAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Live Engagement:', err);
      process.exit(1);
    });
}
