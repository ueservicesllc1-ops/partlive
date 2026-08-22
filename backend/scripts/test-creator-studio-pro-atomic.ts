import { db } from '../src/config/firebase';
import {
  createStreamGoal,
  getStreamHealth,
  scheduleLiveEvent,
  getAdvancedCreatorAnalytics,
  createStreamClip,
} from '../src/services/creatorStudioProService';

export const runCreatorStudioProAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🌟 RUNNING CREATOR STUDIO PRO & LIVE TOOLS ATOMIC TESTS');
  console.log('==================================================\n');

  const hostId = 'test_pro_host_' + Date.now();
  const liveId = 'test_pro_live_' + Date.now();

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Create Stream Goal
  console.log('\n▶ Test 1: Crear meta de transmisión (Stream Goal)...');
  const goal = await createStreamGoal(hostId, liveId, 'GIFTS', 5000);
  console.log(`Meta Creada ID: ${goal.id}, Tipo: ${goal.type}, Objetivo: ${goal.targetAmount} Regalos`);

  if (goal.type === 'GIFTS' && goal.targetAmount === 5000 && !goal.completed) {
    console.log('✅ Test 1 PASADO: Meta de transmisión creada exitosamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Monitor Stream Health & WebRTC Stats
  console.log('\n▶ Test 2: Consultar estado de salud y tasa de bits de la transmisión LiveKit...');
  const health = await getStreamHealth(liveId);
  console.log(`Calidad: ${health.connectionQuality}, Bitrate: ${health.bitrateKbps} kbps, FPS: ${health.fps}, Latencia: ${health.latencyMs} ms`);

  if (health.connectionQuality === 'EXCELLENT' && health.bitrateKbps === 3500) {
    console.log('✅ Test 2 PASADO: Métricas de salud de transmisión WebRTC verificadas.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Schedule Live Event
  console.log('\n▶ Test 3: Programar un evento en vivo con recordatorio para seguidores...');
  const event = await scheduleLiveEvent(hostId, 'Noche de Karaoke Retro', 'Karaoke', new Date().toISOString());
  console.log(`Evento Programado ID: ${event.id}, Título: "${event.title}", Estado: ${event.status}`);

  if (event.status === 'SCHEDULED' && event.title === 'Noche de Karaoke Retro') {
    console.log('✅ Test 3 PASADO: Evento en vivo programado correctamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Advanced Audience Analytics & Retention
  console.log('\n▶ Test 4: Generar analítica avanzada de audiencia y curvas de retención...');
  const analytics = await getAdvancedCreatorAnalytics(hostId, '30d');
  console.log(`Espectadores Únicos: ${analytics.uniqueViewers}, Horas Totales: ${analytics.totalWatchTimeHours} hrs, Curva de Retención: ${analytics.retentionCurve.length} puntos`);

  if (analytics.uniqueViewers > 0 && analytics.retentionCurve.length >= 4) {
    console.log('✅ Test 4 PASADO: Analítica avanzada de retención generada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Create Video Clip
  console.log('\n▶ Test 5: Crear un clip corto de transmisión para la sección de Discovery...');
  const clip = await createStreamClip(hostId, liveId, 'Mejor Momento del Karaoke', 30);
  console.log(`Clip Creado ID: ${clip.id}, Título: "${clip.title}", Duración: ${clip.durationSeconds}s, URL: ${clip.clipUrl}`);

  if (clip.durationSeconds === 30 && clip.clipUrl.includes('.mp4')) {
    console.log('✅ Test 5 PASADO: Clip de transmisión creado exitosamente.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('streamGoals').doc(goal.id).delete();
  await db.collection('scheduledLiveEvents').doc(event.id).delete();
  await db.collection('clips').doc(clip.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE CREATOR STUDIO PRO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runCreatorStudioProAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Creator Studio Pro:', err);
      process.exit(1);
    });
}
