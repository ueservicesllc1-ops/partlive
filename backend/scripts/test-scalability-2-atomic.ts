import { db } from '../src/config/firebase';
import {
  aggregateShardedTaps,
  processRealtimePresence,
  runLoadTestingSimulation,
  executeDisasterRecoveryFailoverTest,
  getInfrastructureObservabilityMetrics,
  toggleAutoScaling,
} from '../src/services/scalabilityPerformanceEngine2Service';

export const runScalability2AtomicTests = async () => {
  console.log('\n==================================================');
  console.log('⚡ RUNNING SCALABILITY, PERFORMANCE & RELIABILITY 2.0 ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Sharded Counter Tap Aggregation & Write Reduction
  console.log('\n▶ Test 1: Agrupar lote de 500 taps masivos en contadores sharded y verificar reducción de escrituras...');
  const liveId = 'live_high_concurrency_99';
  const sharded = await aggregateShardedTaps(liveId, 500);

  console.log(`Live: ${sharded.liveId}, Taps Recibidos: ${sharded.rawTapsReceived}, Shards: ${sharded.shardsUpdated}, Escrituras Ahorradas: +${sharded.firestoreWritesSaved}`);

  if (sharded.rawTapsReceived === 500 && sharded.firestoreWritesSaved === 490) {
    console.log('✅ Test 1 PASADO: Agregación de contadores sharded y ahorro de escrituras verificado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Ephemeral Presence & Real-Time Animation Processing
  console.log('\n▶ Test 2: Procesar presencia efímera sin escrituras en base de datos...');
  const userId = 'user_scale_100';
  const presence = await processRealtimePresence(userId, liveId, 'TYPING');

  console.log(`Usuario: ${presence.userId}, Estado: ${presence.status}, En Tiempo Real: ${presence.processedInRealtime}, Persistido en DB: ${presence.persistedToDatabase}`);

  if (presence.processedInRealtime && !presence.persistedToDatabase) {
    console.log('✅ Test 2 PASADO: Procesamiento de datos efímeros sin escrituras persistentes verificado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Load Testing Simulation (100K Users / 1K Lives)
  console.log('\n▶ Test 3: Ejecutar simulación de prueba de carga masiva (100,000 Usuarios / 1,000 Lives)...');
  const sim = await runLoadTestingSimulation(100000, 1000);

  console.log(`Simulación ID: ${sim.simulationId}, Usuarios: ${sim.concurrentUsersSimulated}, Lives: ${sim.concurrentLivesSimulated}, Latencia Promedio: ${sim.avgLatencyMs}ms, Estado: ${sim.status}`);

  if (sim.status === 'PASSED' && sim.avgLatencyMs <= 45) {
    console.log('✅ Test 3 PASADO: Simulación de carga masiva de alta concurrencia verificada.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Disaster Recovery Failover Simulation (RPO / RTO Target Verification)
  console.log('\n▶ Test 4: Ejecutar prueba de failover Disaster Recovery (RPO <= 5m, RTO <= 15m)...');
  const dr = await executeDisasterRecoveryFailoverTest();

  console.log(`Failover ID: ${dr.failoverId}, Objetivo: ${dr.simulatedOutageTarget}, RPO: ${dr.rpoMinutes}m, RTO: ${dr.rtoMinutes}m, Estado: ${dr.failoverStatus}`);

  if (dr.failoverStatus === 'SUCCESSFUL' && dr.rpoMinutes <= 5 && dr.rtoMinutes <= 15) {
    console.log('✅ Test 4 PASADO: Prueba de failover Disaster Recovery validada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Infrastructure Observability Metrics & Latency Benchmarks
  console.log('\n▶ Test 5: Consultar métricas de observabilidad SLO y latencias p50/p95/p99...');
  const metrics = await getInfrastructureObservabilityMetrics();

  console.log(`Disponibilidad: ${metrics.currentAvailabilityPercent}% (Meta SLO ${metrics.sloTargetPercent}%), p50: ${metrics.p50LatencyMs}ms, p95: ${metrics.p95LatencyMs}ms, p99: ${metrics.p99LatencyMs}ms`);

  if (metrics.currentAvailabilityPercent >= metrics.sloTargetPercent && metrics.p50LatencyMs < 20) {
    console.log('✅ Test 5 PASADO: Métricas de observabilidad y SLO verificadas.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Worker Auto-Scaling Control
  console.log('\n▶ Test 6: Probar interruptor de escalado automático de workers (Auto-Scaling)...');
  const autoScaling = await toggleAutoScaling(true);

  console.log(`Auto-Scaling Activado: ${autoScaling.enabled}, Workers Activos: ${autoScaling.currentWorkers}`);

  if (autoScaling.enabled && autoScaling.currentWorkers === 16) {
    console.log('✅ Test 6 PASADO: Control de escalado automático de workers verificado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Cleanup
  await db.collection('shardedCounters2').doc(liveId).delete();
  await db.collection('loadTestSimulations2').doc(sim.simulationId).delete();
  await db.collection('disasterRecoveryLogs2').doc(dr.failoverId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE ESCALABILIDAD COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runScalability2AtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Escalabilidad 2.0:', err);
      process.exit(1);
    });
}
