import { db } from '../src/config/firebase';
import { seedAgencyConfig } from '../src/seeds/seedAgencyConfig';
import {
  applyForAgency,
  approveAgency,
  addHostToAgency,
  calculateAgencyCommission,
  requestAgencyTransfer,
  approveAgencyTransfer,
} from '../src/services/agencyService';

export const runAgencyAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🏢 RUNNING AGENCY SYSTEM ATOMIC TESTS');
  console.log('==================================================\n');

  // 1. Seed Config
  await seedAgencyConfig();

  const ownerAId = 'test_agency_ownerA_' + Date.now();
  const ownerBId = 'test_agency_ownerB_' + Date.now();
  const hostId = 'test_agency_host_' + Date.now();

  // Create Users
  await db.collection('users').doc(ownerAId).set({
    uid: ownerAId,
    displayName: 'Propietario Agencia A',
    role: 'user',
    status: 'active',
  });

  await db.collection('users').doc(ownerBId).set({
    uid: ownerBId,
    displayName: 'Propietario Agencia B',
    role: 'user',
    status: 'active',
  });

  await db.collection('users').doc(hostId).set({
    uid: hostId,
    displayName: 'Host Agencia Test',
    role: 'host',
    isHost: true,
    status: 'active',
  });

  await db.collection('wallets').doc(ownerAId).set({ userId: ownerAId, beans: 0, status: 'active' });
  await db.collection('wallets').doc(ownerBId).set({ userId: ownerBId, beans: 0, status: 'active' });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Apply & Approve Agency A
  console.log('\n▶ Test 1: Solicitar y aprobar Agencia A...');
  const agencyAId = await applyForAgency(ownerAId, 'Agencia Alfa', 'CL', 'alfa@agency.com');
  await approveAgency(agencyAId, 10);

  const agencyADoc = await db.collection('agencies').doc(agencyAId).get();
  console.log(`Agencia Alfa ID: ${agencyAId}, Status: ${agencyADoc.data()?.status}`);
  if (agencyADoc.data()?.status === 'approved') {
    console.log('✅ Test 1 PASADO: Agencia A aprobada con éxito.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Add Host to Agency A
  console.log('\n▶ Test 2: Vincular Host a Agencia A...');
  await addHostToAgency(agencyAId, hostId);
  const hostUserSnap = await db.collection('users').doc(hostId).get();
  console.log(`Host agencyId: ${hostUserSnap.data()?.agencyId}`);
  if (hostUserSnap.data()?.agencyId === agencyAId) {
    console.log('✅ Test 2 PASADO: Host vinculado correctamente a Agencia A.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Calculate Agency Commission & Ledger Audit
  console.log('\n▶ Test 3: Calcular comisión de agencia y verificar libro contable (Ledger)...');
  const commissionBeans = await calculateAgencyCommission(hostId, 'evt_gift_123', 1000);
  console.log(`Comisión calculada: ${commissionBeans} Beans (Esperado 100)`);

  const ledgerSnap = await db.collection('agencyCommissionLedger').where('agencyId', '==', agencyAId).get();
  console.log(`Registros de Auditoría en Ledger: ${ledgerSnap.size}`);
  if (commissionBeans === 100 && ledgerSnap.size >= 1) {
    console.log('✅ Test 3 PASADO: Comisión y registro contable verificados.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Transfer Host to Agency B
  console.log('\n▶ Test 4: Aprobar Agencia B y transferir Host...');
  const agencyBId = await applyForAgency(ownerBId, 'Agencia Beta', 'CL', 'beta@agency.com');
  await approveAgency(agencyBId, 15);

  const transferId = await requestAgencyTransfer(hostId, agencyAId, agencyBId, 'Cambio de contrato');
  await approveAgencyTransfer(transferId);

  const updatedHostSnap = await db.collection('users').doc(hostId).get();
  console.log(`Nuevo agencyId de Host: ${updatedHostSnap.data()?.agencyId}`);
  if (updatedHostSnap.data()?.agencyId === agencyBId) {
    console.log('✅ Test 4 PASADO: Transferencia de Host a Agencia B completada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(ownerAId).delete();
  await db.collection('users').doc(ownerBId).delete();
  await db.collection('users').doc(hostId).delete();
  await db.collection('wallets').doc(ownerAId).delete();
  await db.collection('wallets').doc(ownerBId).delete();
  await db.collection('agencies').doc(agencyAId).delete();
  await db.collection('agencies').doc(agencyBId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE AGENCIAS COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runAgencyAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Agencias:', err);
      process.exit(1);
    });
}
