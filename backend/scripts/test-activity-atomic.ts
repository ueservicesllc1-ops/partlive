import { db } from '../src/config/firebase';
import {
  startLiveActivity,
  submitTriviaAnswer,
  castPollVote,
  submitWordGuess,
  endLiveActivity,
} from '../src/services/liveActivityService';
import { createScheduledEvent, toggleEventReminder } from '../src/services/eventService';

export const runActivityAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🎤 RUNNING LIVE ACTIVITIES & EVENTS ATOMIC TESTS');
  console.log('==================================================\n');

  const hostId = 'test_activity_host_' + Date.now();
  const userId = 'test_activity_user_' + Date.now();
  const liveId = 'test_live_stream_123';

  // Create Users
  await db.collection('users').doc(hostId).set({
    uid: hostId,
    displayName: 'Host Actividades Test',
    isHost: true,
    status: 'active',
  });

  await db.collection('users').doc(userId).set({
    uid: userId,
    displayName: 'Usuario Participante Test',
    level: 1,
    xp: 0,
    status: 'active',
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Start Trivia Activity & Submit Answer
  console.log('\n▶ Test 1: Iniciar Trivia en Vivo y responder...');
  const triviaActivity = await startLiveActivity(hostId, liveId, 'TRIVIA', 'Trivia de Música', {
    questions: [
      {
        questionText: '¿En qué año se lanzó el álbum Thriller?',
        options: ['1978', '1982', '1985', '1990'],
        correctOptionIndex: 1,
      },
    ],
  });

  const answerResult = await submitTriviaAnswer(userId, triviaActivity.id, 0, 1); // Option 1 is correct (1982)
  console.log(`Resultado Trivia: Correcto=${answerResult.correct}, XP=${answerResult.xpEarned}`);
  if (answerResult.correct && answerResult.xpEarned === 50) {
    console.log('✅ Test 1 PASADO: Respuesta correcta verificada y 50 XP otorgados.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Cast Poll Vote
  console.log('\n▶ Test 2: Votar en Encuesta en Vivo...');
  const pollActivity = await startLiveActivity(hostId, liveId, 'POLL', '¿Qué género cantamos ahora?', {
    options: ['Pop', 'Rock', 'Reggaeton', 'Salsa'],
  });

  await castPollVote(userId, pollActivity.id, 2);
  const voteSnap = await db.collection('liveActivities').doc(pollActivity.id).collection('pollVotes').doc(userId).get();
  console.log(`Voto registrado opción index: ${voteSnap.data()?.optionIndex}`);
  if (voteSnap.data()?.optionIndex === 2) {
    console.log('✅ Test 2 PASADO: Voto de encuesta guardado correctamente.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Word Game Guess
  console.log('\n▶ Test 3: Juego de Adivinar la Palabra...');
  const wordActivity = await startLiveActivity(hostId, liveId, 'WORD_GAME', 'Reto de Palabra', {
    targetWord: 'PARTY',
  });

  const wordResult = await submitWordGuess(userId, wordActivity.id, 'PARTY');
  console.log(`Resultado Palabra: Correcto=${wordResult.correct}, XP=${wordResult.xpEarned}`);
  if (wordResult.correct && wordResult.xpEarned === 100) {
    console.log('✅ Test 3 PASADO: Palabra adivinada correctamente y 100 XP otorgados.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Create Event & Toggle Reminder
  console.log('\n▶ Test 4: Programar Evento y activar Recordatorio...');
  const futureDate = new Date(Date.now() + 86400000);
  const event = await createScheduledEvent(hostId, 'Noche de Karaoke Pop', 'Gran evento de Karaoke', 'KARAOKE', futureDate);

  const remResult1 = await toggleEventReminder(userId, event.id);
  console.log(`Recordatorio activado: ${remResult1.isSubscribed}`);
  const remResult2 = await toggleEventReminder(userId, event.id);
  console.log(`Recordatorio desactivado: ${remResult2.isSubscribed}`);

  if (remResult1.isSubscribed && !remResult2.isSubscribed) {
    console.log('✅ Test 4 PASADO: Subscripción y cancelación de recordatorio verificadas.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await endLiveActivity(hostId, triviaActivity.id);
  await endLiveActivity(hostId, pollActivity.id);
  await endLiveActivity(hostId, wordActivity.id);
  await db.collection('users').doc(hostId).delete();
  await db.collection('users').doc(userId).delete();
  await db.collection('liveActivities').doc(triviaActivity.id).delete();
  await db.collection('liveActivities').doc(pollActivity.id).delete();
  await db.collection('liveActivities').doc(wordActivity.id).delete();
  await db.collection('events').doc(event.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE ACTIVIDADES COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runActivityAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Actividades:', err);
      process.exit(1);
    });
}
