import { db } from '../src/config/firebase';
import {
  getPerformanceBaseline,
  executeBackgroundJobQueue,
  executeCircuitBreaker,
  getCircuitBreakersState,
  calculateInfrastructureCostModel,
  executeDisasterRecoveryBackupAndRestoreTest,
} from '../src/services/infrastructurePerformanceService';

export const runInfrastructurePerformanceAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('⚡ RUNNING INFRASTRUCTURE, PERFORMANCE & DR ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: System Latency Benchmarks & SLO Error Budget
  console.log('\n▶ Test 1: Consultar benchmarks de latencia p50/p95/p99 y presupuesto de error SLO...');
  const baseline = await getPerformanceBaseline();
  console.log(`Latencia p50: ${baseline.p50Ms}ms, p95: ${baseline.p95Ms}ms, p99: ${baseline.p99Ms}ms | Target SLO: ${baseline.sloTargetPercent}% | Error Budget Restante: ${baseline.errorBudgetRemainingPercent}%`);

  if (baseline.p50Ms <= 50 && baseline.errorBudgetRemainingPercent > 90) {
    console.log('✅ Test 1 PASADO: Benchmarks de latencia y presupuesto de error verificados.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Asynchronous Job Worker & Dead Letter Queue (DLQ)
  console.log('\n▶ Test 2: Ejecutar trabajo asíncrono y verificar enrutamiento a la Cola de Letras Muertas (DLQ)...');
  const job = await executeBackgroundJobQueue('ANALYTICS_AGGREGATION', { dataset: 'live_sessions' }, true);
  console.log(`Trabajo ID: ${job.jobId}, Tipo: ${job.jobType}, Estado: ${job.status}, Reintentos: ${job.attempts}`);

  if (job.status === 'DLQ' && job.attempts === 3) {
    console.log('✅ Test 2 PASADO: Trabajo asíncrono fallido enviado correctamente a la Cola DLQ.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Circuit Breaker Failure Isolation
  console.log('\n▶ Test 3: Probar aislador de fallos Circuit Breaker para proveedores externos...');
  const cbCall = await executeCircuitBreaker('PAYMENT_STRIPE', async () => ({ status: 'PAID' }));
  console.log(`Circuit Breaker PAYMENT_STRIPE: Estado=${cbCall.circuitState}, Degradado=${cbCall.degradedFallbackUsed}`);

  if (cbCall.circuitState === 'CLOSED' && !cbCall.degradedFallbackUsed) {
    console.log('✅ Test 3 PASADO: Circuit breaker operando en estado CLOSED (Normal).');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Cost-per-User & Infrastructure Economics
  console.log('\n▶ Test 4: Calcular costo de infraestructura por usuario activo y hora de Live...');
  const costModel = await calculateInfrastructureCostModel();
  console.log(`Costo por Usuario Activo: $${costModel.costPerUserUsd} USD, Costo por Hora de Live: $${costModel.costPerLiveHourUsd} USD, Proyección Mensual: $${costModel.monthlyForecastUsd} USD`);

  if (costModel.costPerUserUsd < 0.05 && costModel.monthlyForecastUsd > 0) {
    console.log('✅ Test 4 PASADO: Modelo económico de infraestructura por usuario validado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Disaster Recovery Backup & Restore Simulation
  console.log('\n▶ Test 5: Ejecutar simulación de respaldo y recuperación ante desastres (Disaster Recovery)...');
  const drTest = await executeDisasterRecoveryBackupAndRestoreTest();
  console.log(`Backup ID: ${drTest.backupId}, Colecciones Verificadas: ${drTest.verifiedCollections.join(', ')}, Estado Simulación: ${drTest.restoreSimulationStatus}`);

  if (drTest.restoreSimulationStatus === 'SUCCESS' && drTest.verifiedCollections.length === 5) {
    console.log('✅ Test 5 PASADO: Prueba de recuperación ante desastres completada exitosamente.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('backgroundJobs').doc(job.jobId).delete();
  await db.collection('deadLetterQueue').doc(job.jobId).delete();
  await db.collection('drBackups').doc(drTest.backupId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE INFRAESTRUCTURA Y RENDIMIENTO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runInfrastructurePerformanceAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Infraestructura y Rendimiento:', err);
      process.exit(1);
    });
}
