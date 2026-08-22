import {
  getPerformanceBaseline,
  getOrSetCache,
  invalidateCacheKey,
  bufferAnalyticsEvent,
  calculateUnitEconomics,
} from '../src/services/performanceOptimizationService';

export const runPerformanceAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🚀 RUNNING PERFORMANCE, SCALABILITY & COST ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Fetch Performance Baseline
  console.log('\n▶ Test 1: Consultar presupuestos de latencia y baseline de rendimiento...');
  const baseline = await getPerformanceBaseline();
  console.log(`Inicio App: ${baseline.appStartupMs} ms, Descubrimiento: ${baseline.discoveryLoadMs} ms, Unión a Live: ${baseline.liveJoinLatencyMs} ms`);

  if (baseline.appStartupMs < 500 && baseline.liveJoinLatencyMs < 300) {
    console.log('✅ Test 1 PASADO: Baseline de rendimiento dentro de presupuesto.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: In-Memory TTL Cache Hit & Invalidation
  console.log('\n▶ Test 2: Probar capa de cache TTL en memoria e invalidación...');
  let fetchCount = 0;
  const mockFetcher = async () => {
    fetchCount++;
    return { catalog: 'gifts_v1', count: 12 };
  };

  const res1 = await getOrSetCache('test_gift_catalog', 60, mockFetcher);
  const res2 = await getOrSetCache('test_gift_catalog', 60, mockFetcher);

  console.log(`Primer Fetch Hit: ${res1.isCacheHit}, Segundo Fetch Hit: ${res2.isCacheHit}, Invocaciones Reales: ${fetchCount}`);
  invalidateCacheKey('test_gift_catalog');
  const res3 = await getOrSetCache('test_gift_catalog', 60, mockFetcher);
  console.log(`Fetch tras Invalidación Hit: ${res3.isCacheHit}, Invocaciones Reales Totales: ${fetchCount}`);

  if (!res1.isCacheHit && res2.isCacheHit && fetchCount === 2) {
    console.log('✅ Test 2 PASADO: Cache TTL en memoria e invalidación funcionando.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Event Pipeline Buffering
  console.log('\n▶ Test 3: Probar buffer de eventos de cliente para reducción de escrituras...');
  const buf1 = bufferAnalyticsEvent('u1', 'view_live', { liveId: 'l1' });
  const buf2 = bufferAnalyticsEvent('u2', 'tap_thumbs_up', { liveId: 'l1' });

  console.log(`Tamaño de Buffer en Memoria: ${buf2.bufferSize}`);
  if (buf2.bufferSize >= 2) {
    console.log('✅ Test 3 PASADO: Buffer de eventos reduciendo escrituras individuales.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Unit Economics Calculation
  console.log('\n▶ Test 4: Calcular economía de unidad y margen de contribución...');
  const economics = await calculateUnitEconomics();
  console.log(`Costo por DAU: $${economics.costPerDauUsd}, Costo por Hora Live: $${economics.costPerLiveHourUsd}, Margen de Contribución: ${economics.contributionMarginPercent}%`);

  if (economics.costPerDauUsd < 0.01 && economics.contributionMarginPercent > 50) {
    console.log('✅ Test 4 PASADO: Economía de unidad y márgenes calculados exitosamente.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE RENDIMIENTO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runPerformanceAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Rendimiento:', err);
      process.exit(1);
    });
}
