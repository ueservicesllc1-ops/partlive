import { db } from '../src/config/firebase';
import { seedDiscoveryConfig } from '../src/seeds/seedDiscoveryConfig';
import { getForYouFeed, getTrendingLives, getNewHostsFeed, recordWatchTime } from '../src/services/discoveryService';
import { createClip, getClipsFeed, interactWithClip, getClipCreatorAnalytics } from '../src/services/clipService';

export const runDiscoveryAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🎬 RUNNING DISCOVERY & CLIPS ATOMIC TESTS');
  console.log('==================================================\n');

  // 1. Seed Discovery Config
  await seedDiscoveryConfig();

  const hostId = 'test_discovery_host_' + Date.now();
  const userId = 'test_discovery_user_' + Date.now();
  const liveId = 'test_live_stream_456';

  // Create Users & Live Stream
  await db.collection('users').doc(hostId).set({
    uid: hostId,
    displayName: 'Host Discovery Test',
    isHost: true,
    status: 'active',
  });

  await db.collection('users').doc(userId).set({
    uid: userId,
    displayName: 'Usuario Discovery Test',
    status: 'active',
  });

  await db.collection('lives').doc(liveId).set({
    id: liveId,
    hostId,
    hostName: 'Host Discovery Test',
    title: 'Transmisión Destacada de Prueba',
    status: 'live',
    viewerCount: 150,
    diamondsGenerated: 5000,
    createdAt: new Date(),
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Host Creates Clip
  console.log('\n▶ Test 1: Host publica un Clip en PartyLive...');
  const clip = await createClip(hostId, liveId, 'Momento Épico PK', 'Resumen de batalla en vivo', 'https://cdn.partylive.app/clips/video1.mp4', 'https://cdn.partylive.app/clips/thumb1.jpg', 30);

  console.log(`Clip Creado ID: ${clip.id}, Duración: ${clip.durationSeconds}s, Status: ${clip.status}`);
  if (clip.id && clip.status === 'PUBLISHED') {
    console.log('✅ Test 1 PASADO: Clip publicado con éxito.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Interact with Clip & Track Live Conversion
  console.log('\n▶ Test 2: Usuario interactúa y se une al Live desde el Clip (Conversión)...');
  await interactWithClip(userId, clip.id, 'like');
  await interactWithClip(userId, clip.id, 'join_live');

  const updatedClipDoc = await db.collection('clips').doc(clip.id).get();
  console.log(`Likes actualizados: ${updatedClipDoc.data()?.likesCount}, Entradas a Live: ${updatedClipDoc.data()?.liveEntriesCount}`);
  if (updatedClipDoc.data()?.likesCount === 1 && updatedClipDoc.data()?.liveEntriesCount === 1) {
    console.log('✅ Test 2 PASADO: Conversión de Clip a Live registrada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Calculate Creator Analytics from Clips
  console.log('\n▶ Test 3: Obtener métricas de conversión del creador...');
  const analytics = await getClipCreatorAnalytics(hostId);
  console.log(`Analíticas Creador: Clips=${analytics.totalClips}, Entradas a Live=${analytics.totalLiveEntries}`);
  if (analytics.totalClips >= 1 && analytics.totalLiveEntries >= 1) {
    console.log('✅ Test 3 PASADO: Métricas del creador calculadas correctamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Record Watch Time & Fetch Discovery Feeds
  console.log('\n▶ Test 4: Registrar tiempo de visualización y consultar Feeds...');
  await recordWatchTime(userId, liveId, 'live', 120);

  const trendingFeed = await getTrendingLives(10);
  const forYouFeed = await getForYouFeed(userId, 10);
  console.log(`Feeds Obtenidos: Trending=${trendingFeed.length} items, ForYou=${forYouFeed.length} items`);

  if (trendingFeed.length >= 1 && forYouFeed.length >= 1) {
    console.log('✅ Test 4 PASADO: Algoritmo de recomendación por señales funcionando.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(hostId).delete();
  await db.collection('users').doc(userId).delete();
  await db.collection('lives').doc(liveId).delete();
  await db.collection('clips').doc(clip.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE DISCOVERY Y CLIPS COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runDiscoveryAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Discovery:', err);
      process.exit(1);
    });
}
