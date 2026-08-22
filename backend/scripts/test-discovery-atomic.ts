import { db } from '../src/config/firebase';
import { getForYouFeed, getRisingCreatorsFeed } from '../src/services/discoveryService';
import { hideCreator } from '../src/services/userPreferenceService';
import { generateShareLink, recordShareClick, getViralAnalyticsSummary } from '../src/services/viralShareService';

export const runDiscoveryAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🔍 RUNNING DISCOVERY, PERSONALIZATION & VIRAL ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_disc_user_' + Date.now();
  const hiddenHostId = 'test_disc_hidden_host_' + Date.now();
  const activeHostId = 'test_disc_active_host_' + Date.now();

  await db.collection('users').doc(userId).set({ uid: userId, displayName: 'Usuario Discovery', status: 'active' });

  // Create sample live streams
  const liveHiddenRef = db.collection('lives').doc('live_hidden_1');
  await liveHiddenRef.set({
    id: 'live_hidden_1',
    hostId: hiddenHostId,
    hostName: 'Host Oculto',
    title: 'Live Oculto',
    status: 'active',
    viewerCount: 50,
    creatorLevel: 'Star',
  });

  const liveActiveRef = db.collection('lives').doc('live_active_1');
  await liveActiveRef.set({
    id: 'live_active_1',
    hostId: activeHostId,
    hostName: 'Host Activo',
    title: 'Live Activo Pop',
    status: 'active',
    viewerCount: 80,
    creatorLevel: 'Rising',
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Fetch initial For You feed
  console.log('\n▶ Test 1: Consultar Feed Personalizado "For You"...');
  const feed1 = await getForYouFeed(userId);
  console.log(`Elementos en Feed For You: ${feed1.length}`);
  const hasHiddenBefore = feed1.some((item) => item.hostId === hiddenHostId);
  console.log(`¿Incluye Host Oculto antes del filtro?: ${hasHiddenBefore}`);

  if (feed1.length >= 2 && hasHiddenBefore) {
    console.log('✅ Test 1 PASADO: Feed For You generado exitosamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Hide Creator & Verify Exclusion
  console.log('\n▶ Test 2: Ocultar anfitrión (Hide Creator) y verificar exclusión en Feed...');
  await hideCreator(userId, hiddenHostId);

  const feed2 = await getForYouFeed(userId);
  const hasHiddenAfter = feed2.some((item) => item.hostId === hiddenHostId);
  console.log(`¿Incluye Host Oculto después del filtro?: ${hasHiddenAfter}`);

  if (!hasHiddenAfter) {
    console.log('✅ Test 2 PASADO: Anfitrión ocultado excluido correctamente del algoritmo.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Rising Creators Feed
  console.log('\n▶ Test 3: Consultar Feed de Creadores Emergentes (Rising Creators)...');
  const risingFeed = await getRisingCreatorsFeed();
  console.log(`Creadores Emergentes en Live: ${risingFeed.length}`);
  const hasRisingHost = risingFeed.some((item) => item.hostId === activeHostId);

  if (hasRisingHost) {
    console.log('✅ Test 3 PASADO: Feed de Creadores Emergentes expone nuevo talento.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Viral Share & Deep Link Click Attribution
  console.log('\n▶ Test 4: Generar enlace profundo viral y registrar clic de atribución...');
  const shareLink = await generateShareLink('live', 'live_active_1', userId);
  console.log(`Enlace Generado: ${shareLink.url}, Código: ${shareLink.code}`);

  // Simulate human click
  const clickRes = await recordShareClick(shareLink.code, '192.168.1.1', 'Mozilla/5.0 Mobile');
  console.log(`Resultado Clic Humano: Éxito=${clickRes.success}, Bot=${clickRes.isBot}`);

  // Simulate bot click
  const botClickRes = await recordShareClick(shareLink.code, '10.0.0.1', 'Googlebot/2.1 Crawler');
  console.log(`Resultado Clic Bot: Éxito=${botClickRes.success}, Bot=${botClickRes.isBot}`);

  const viralStats = await getViralAnalyticsSummary();
  console.log(`Estadísticas Virales Totales: Shares=${viralStats.totalShares}, Clics=${viralStats.totalClicks}, K-Factor=${viralStats.kFactor}`);

  if (clickRes.success && !clickRes.isBot && botClickRes.isBot) {
    console.log('✅ Test 4 PASADO: Atribución de clics virales y filtro anti-bot funcionando.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();
  await liveHiddenRef.delete();
  await liveActiveRef.delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE DESCUBRIMIENTO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runDiscoveryAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Descubrimiento:', err);
      process.exit(1);
    });
}
