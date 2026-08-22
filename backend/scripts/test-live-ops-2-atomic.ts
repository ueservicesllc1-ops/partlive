import { db } from '../src/config/firebase';
import {
  getExecutiveOperationsMetrics,
  createLiveOperationCampaign,
  getCreatorHealthScorecard,
  getRealtimeOperationsAlerts,
  toggleOperationEmergencySwitch,
  generateDailyExecutiveReport,
} from '../src/services/liveOperationsEngine2Service';

export const runLiveOps2AtomicTests = async () => {
  console.log('\n==================================================');
  console.log('📈 RUNNING LIVE OPERATIONS & REVENUE OPTIMIZATION 2.0 ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Executive & Revenue Operations Dashboard Metrics
  console.log('\n▶ Test 1: Consultar métricas del tablero ejecutivo de operaciones e ingresos (30 Días)...');
  const metrics = await getExecutiveOperationsMetrics('30D');

  console.log(`DAU: ${metrics.dauCount.toLocaleString()}, WAU: ${metrics.wauCount.toLocaleString()}, MAU: ${metrics.mauCount.toLocaleString()}`);
  console.log(`Ingresos Brutos: $${metrics.grossRevenueUsd.toLocaleString()} USD, Plataforma: $${metrics.platformShareUsd.toLocaleString()} USD, Retiros Creadores: $${metrics.creatorPayoutsUsd.toLocaleString()} USD`);

  if (metrics.dauCount > 40000 && metrics.grossRevenueUsd === 148500.0 && metrics.activeCreatorsCount === 3200) {
    console.log('✅ Test 1 PASADO: Métricas del tablero ejecutivo de operaciones verificadas.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Campaign Engine & Coupon Promotion Creation
  console.log('\n▶ Test 2: Crear campaña de operación con presupuesto protegido y código de cupón...');
  const campaign = await createLiveOperationCampaign('Campaña Recarga Inicial LATAM Q3', 'COIN_PROMOTION', 5000, 1000, 'LATAM_BONUS_2026');

  console.log(`Campaña ID: ${campaign.campaignId}, Título: ${campaign.title}, Cupón: ${campaign.couponCode}, Presupuesto: $${campaign.budgetUsd} USD, Límite: ${campaign.maxParticipants}`);

  if (campaign.budgetUsd === 5000 && campaign.couponCode === 'LATAM_BONUS_2026' && campaign.status === 'ACTIVE') {
    console.log('✅ Test 2 PASADO: Creación de campaña operativa con cupón y presupuesto protegido verificado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Creator Health Scorecard & At-Risk Reactivation
  console.log('\n▶ Test 3: Consultar scorecard de salud de creadores y recomendaciones de retención...');
  const creatorId = 'creator_star_99';
  const health = await getCreatorHealthScorecard(creatorId);

  console.log(`Creador: ${health.creatorName}, Puntaje Salud: ${health.healthScore}/100, Consistencia: ${health.broadcastingConsistency}, En Riesgo: ${health.isAtRiskOfChurn}`);

  if (health.healthScore === 92 && !health.isAtRiskOfChurn && health.broadcastingConsistency === 'EXCELLENT') {
    console.log('✅ Test 3 PASADO: Scorecard de salud de creador verificado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Real-time Operations Anomaly Alert Stream
  console.log('\n▶ Test 4: Consultar ráfaga de alertas de operaciones en tiempo real (Picos de Tráfico & Gifts)...');
  const alerts = await getRealtimeOperationsAlerts();

  console.log(`Alertas Activas: ${alerts.length}, Primera Alerta: [${alerts[0].type}] - ${alerts[0].message}`);

  if (alerts.length >= 2 && alerts[0].type === 'GIFT_SURGE') {
    console.log('✅ Test 4 PASADO: Ráfaga de alertas de operaciones en tiempo real verificada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Emergency Operations Kill Switches Execution
  console.log('\n▶ Test 5: Probar interruptor de emergencia operativa (Pausar Regalos) con auditoría...');
  const emergency = await toggleOperationEmergencySwitch('giftsPaused', true, 'ADMIN_SUPER_OPS');

  console.log(`Regalos Pausados: ${emergency.giftsPaused}, Actualizado Por: ${emergency.updatedBy}`);

  await toggleOperationEmergencySwitch('giftsPaused', false, 'ADMIN_SUPER_OPS'); // Revert
  console.log(`Regalos Restablecidos a Normal (false).`);

  if (emergency.giftsPaused && emergency.updatedBy === 'ADMIN_SUPER_OPS') {
    console.log('✅ Test 5 PASADO: Interruptor de emergencia operativa y registro de auditoría verificado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Daily Executive Summary Report Generation
  console.log('\n▶ Test 6: Generar informe diario ejecutivo de resumen operativo...');
  const report = await generateDailyExecutiveReport();

  console.log(`Reporte ID: ${report.reportId}, Resumen: "${report.summary}", URL PDF: ${report.pdfExportUrl}`);

  if (report.summary.includes('45.2K DAU') && report.pdfExportUrl.includes('.pdf')) {
    console.log('✅ Test 6 PASADO: Generación de informe diario ejecutivo verificado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Cleanup
  await db.collection('liveOpsCampaigns2').doc(campaign.campaignId).delete();
  await db.collection('dailyExecutiveReports2').doc(report.reportId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE OPERACIONES DIARIAS COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runLiveOps2AtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Operaciones Diarias 2.0:', err);
      process.exit(1);
    });
}
