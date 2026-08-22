import { db } from '../src/config/firebase';
import { seedHelpCenter } from '../src/seeds/seedHelpCenter';
import { searchHelpArticles, recordArticleFeedback } from '../src/services/helpCenterService';
import {
  createSupportTicket,
  addTicketMessage,
  getUserTickets,
  getTicketMessagesForUser,
  getAdminTicketQueue,
  resolveTicket,
} from '../src/services/supportTicketService';

export const runSupportAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🎧 RUNNING CUSTOMER SUPPORT & TICKETING ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_supp_user_' + Date.now();
  const agentId = 'test_agent_' + Date.now();

  await db.collection('users').doc(userId).set({ uid: userId, displayName: 'Usuario Soporte', status: 'active' });
  await db.collection('users').doc(agentId).set({ uid: agentId, displayName: 'Agente Soporte', status: 'active', role: 'admin' });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Help Center
  await seedHelpCenter();

  // Test 1: Search Help Articles
  console.log('\n▶ Test 1: Buscar artículos de ayuda por palabra clave ("coins")...');
  const articles = await searchHelpArticles('coins');
  console.log(`Artículos encontrados para "coins": ${articles.length}`);
  if (articles.length >= 1) {
    console.log('✅ Test 1 PASADO: Búsqueda de artículos en la base de conocimientos.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Ticket Creation & Auto-Priority Calculation
  console.log('\n▶ Test 2: Crear ticket de soporte con prioridad calculada automáticamente...');
  const ticketCrit = await createSupportTicket(userId, {
    category: 'ACCOUNT',
    subject: 'My account was hacked',
    description: 'Someone changed my email and password without permission.',
  });

  console.log(`Ticket Creado ID: ${ticketCrit.id}, Prioridad Asignada: ${ticketCrit.priority}, Equipo: ${ticketCrit.assignedTeam}`);
  if (ticketCrit.priority === 'CRITICAL' && ticketCrit.assignedTeam === 'GENERAL') {
    console.log('✅ Test 2 PASADO: Prioridad CRITICAL calculada automáticamente para hackeo.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Public Message & Internal Staff Note
  console.log('\n▶ Test 3: Agregar respuesta pública y nota interna de personal...');
  const publicMsg = await addTicketMessage(ticketCrit.id, agentId, 'AGENT', 'Hola, estamos investigando tu caso.', false);
  const internalNote = await addTicketMessage(ticketCrit.id, agentId, 'AGENT', 'Verificar logs de IP con el equipo de seguridad.', true);

  console.log(`Mensaje Público ID: ${publicMsg.id}, Nota Interna ID: ${internalNote.id}`);

  // Fetch messages from User view -> internal note MUST be hidden!
  const userVisibleMsgs = await getTicketMessagesForUser(userId, ticketCrit.id);
  console.log(`Mensajes visibles para el usuario: ${userVisibleMsgs.length}`);

  const containsInternal = userVisibleMsgs.some((m) => m.isInternalNote);
  if (userVisibleMsgs.length === 2 && !containsInternal) {
    console.log('✅ Test 3 PASADO: La nota interna del personal fue aislada y no es visible para el usuario.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Admin Ticket Queue & Resolution
  console.log('\n▶ Test 4: Consultar cola de soporte administrativa y resolver ticket...');
  const queue = await getAdminTicketQueue(undefined, 'IN_PROGRESS');
  console.log(`Tickets en Cola de Administración: ${queue.length}`);

  const resolved = await resolveTicket(ticketCrit.id, 'Cuenta recuperada y verificada.', agentId);
  console.log(`Estado del Ticket tras resolución: ${resolved.status}, Asignado a: ${resolved.assignedTo}`);

  if (resolved.status === 'RESOLVED' && resolved.assignedTo === agentId) {
    console.log('✅ Test 4 PASADO: Ticket resuelto exitosamente.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();
  await db.collection('users').doc(agentId).delete();
  await db.collection('supportTickets').doc(ticketCrit.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE SOPORTE Y TICKETS COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runSupportAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Soporte:', err);
      process.exit(1);
    });
}
