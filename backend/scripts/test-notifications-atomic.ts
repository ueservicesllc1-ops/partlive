import { db } from '../src/config/firebase';
import {
  shouldSendNotification,
  checkNotificationCap,
  bundleGiftNotifications,
  updateUserNotificationSettings,
} from '../src/services/notificationService';
import { evaluateUserLifecycleState, runReEngagementScan } from '../src/services/reEngagementService';
import { buildDeepLink } from '../src/services/deepLinkService';
import { createNotificationCampaign, executeNotificationCampaign } from '../src/services/notificationCampaignService';

export const runNotificationsAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🔔 RUNNING NOTIFICATIONS & RE-ENGAGEMENT ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_notif_user_' + Date.now();
  const adminId = 'test_admin_' + Date.now();

  await db.collection('users').doc(userId).set({
    uid: userId,
    displayName: 'Usuario Notif Test',
    status: 'active',
    livesWatchedCount: 8,
  });

  await db.collection('users').doc(adminId).set({
    uid: adminId,
    displayName: 'Admin Notif Test',
    status: 'active',
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Quiet Hours Filter
  console.log('\n▶ Test 1: Verificar filtro de Horario Silencioso (Quiet Hours)...');
  await updateUserNotificationSettings(userId, {
    pushEnabled: true,
    quietHoursEnabled: true,
    quietHoursStart: '00:00',
    quietHoursEnd: '23:59', // All day quiet hours for test
  });

  const shouldSendLive = await shouldSendNotification(userId, 'live_started');
  const shouldSendModeration = await shouldSendNotification(userId, 'moderation');

  console.log(`Push Live durante Horario Silencioso: ${shouldSendLive}, Push Moderación (Bypass): ${shouldSendModeration}`);
  if (!shouldSendLive && shouldSendModeration) {
    console.log('✅ Test 1 PASADO: Horario silencioso bloqueó alertas normales pero permitió alertas críticas.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Reset quiet hours
  await updateUserNotificationSettings(userId, { quietHoursEnabled: false });

  // Test 2: Frequency Capping
  console.log('\n▶ Test 2: Probar límite de frecuencia (Frequency Cap: 3 por hora)...');
  const cap1 = await checkNotificationCap(userId, 'live_started', 3);
  const cap2 = await checkNotificationCap(userId, 'live_started', 3);
  const cap3 = await checkNotificationCap(userId, 'live_started', 3);
  const cap4 = await checkNotificationCap(userId, 'live_started', 3); // Must be blocked

  console.log(`Intento 1: ${cap1}, Intento 2: ${cap2}, Intento 3: ${cap3}, Intento 4 (bloqueado): ${cap4}`);
  if (cap1 && cap2 && cap3 && !cap4) {
    console.log('✅ Test 2 PASADO: Límite de frecuencia por hora aplicado correctamente.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Gift Aggregation
  console.log('\n▶ Test 3: Probar agrupación (bundling) de notificaciones de regalos...');
  const singleBundle = await bundleGiftNotifications(userId, 'Maria', 'Rosa', 1);
  const multiBundle = await bundleGiftNotifications(userId, 'Maria', 'Rosa', 25);

  console.log(`Individual: "${singleBundle.title}" - "${singleBundle.body}"`);
  console.log(`Agrupado (25): "${multiBundle.title}" - "${multiBundle.body}"`);
  if (multiBundle.title.includes('Múltiples') && multiBundle.body.includes('25 regalos')) {
    console.log('✅ Test 3 PASADO: Notificaciones de regalos agrupadas exitosamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: User Lifecycle State Engine
  console.log('\n▶ Test 4: Evaluar ciclo de vida del usuario (Lifecycle State)...');
  const lifecycle = await evaluateUserLifecycleState(userId);
  console.log(`Estado de Ciclo de Vida: ${lifecycle.state}`);
  if (['ENGAGED', 'POWER_USER', 'NEW', 'ACTIVATED'].includes(lifecycle.state)) {
    console.log('✅ Test 4 PASADO: Estado de ciclo de vida evaluado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Deep Link Generator & Notification Campaign
  console.log('\n▶ Test 5: Crear y ejecutar Campaña de Notificación con Deep Link...');
  const deepLink = buildDeepLink('live', 'live_12345');
  console.log(`Deep Link Generado: ${deepLink.url}`);

  const campaign = await createNotificationCampaign({
    title: '🔥 ¡Novedades en PartyLive!',
    body: 'Entra ahora y descubre los mejores eventos en vivo.',
    targetSegment: 'ALL',
    deepLinkTarget: 'live',
    deepLinkId: 'live_12345',
    createdBy: adminId,
  });

  const execRes = await executeNotificationCampaign(campaign.id, adminId);
  console.log(`Campaña Ejecutada ID: ${campaign.id}, Envíos Exitosos: ${execRes.sentCount}`);

  if (execRes.sentCount >= 1) {
    console.log('✅ Test 5 PASADO: Campaña despachada con Deep Links.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();
  await db.collection('users').doc(adminId).delete();
  await db.collection('notificationSettings').doc(userId).delete();
  await db.collection('notificationCampaigns').doc(campaign.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE NOTIFICACIONES COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runNotificationsAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Notificaciones:', err);
      process.exit(1);
    });
}
