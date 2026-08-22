import { db } from '../src/config/firebase';
import { seedLegalPolicies } from '../src/seeds/seedLegalPolicies';
import { acceptPolicy, checkUserPolicyAcceptances } from '../src/services/legalComplianceService';
import { declareUserAge, canUserAccessAgeRestrictedContent } from '../src/services/ageSafetyService';
import { createSafetyCase, getTrustSafetyQueue, resolveSafetyCase } from '../src/services/trustSafetyService';
import { requestAccountDeletion, exportUserData } from '../src/services/privacyService';

export const runLegalAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('⚖️ RUNNING LEGAL, AGE SAFETY & TRUST ATOMIC TESTS');
  console.log('==================================================\n');

  const userIdAdult = 'test_legal_adult_' + Date.now();
  const userIdMinor = 'test_legal_minor_' + Date.now();

  await db.collection('users').doc(userIdAdult).set({ uid: userIdAdult, displayName: 'Adulto Test', status: 'active' });
  await db.collection('users').doc(userIdMinor).set({ uid: userIdMinor, displayName: 'Menor Test', status: 'active' });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Legal Policies
  await seedLegalPolicies();

  // Test 1: Accept Policy & Versioning
  console.log('\n▶ Test 1: Aceptar Términos de Servicio y verificar seguimiento de versiones...');
  await acceptPolicy(userIdAdult, 'TERMS_OF_SERVICE', 'v1.0');
  const userStatus = await checkUserPolicyAcceptances(userIdAdult);

  console.log(`Políticas Activas: ${userStatus.policies.length}, Versión Aceptada TOS: ${userStatus.userAcceptances['TERMS_OF_SERVICE']}`);
  if (userStatus.policies.length >= 4 && userStatus.userAcceptances['TERMS_OF_SERVICE'] === 'v1.0') {
    console.log('✅ Test 1 PASADO: Aceptación de política registrada con control de versiones.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Age Gate & Restriction Check
  console.log('\n▶ Test 2: Declarar fecha de nacimiento y verificar restricciones por edad...');
  const adultProfile = await declareUserAge(userIdAdult, '1995-05-15');
  const minorProfile = await declareUserAge(userIdMinor, '2009-08-20');

  const accessAdult = await canUserAccessAgeRestrictedContent(userIdAdult, 'MATURE');
  const accessMinor = await canUserAccessAgeRestrictedContent(userIdMinor, 'MATURE');

  console.log(`Adulto Edad: ${adultProfile.calculatedAge} (${adultProfile.ageStatus}), Acceso Content MATURE: ${accessAdult}`);
  console.log(`Menor Edad: ${minorProfile.calculatedAge} (${minorProfile.ageStatus}), Acceso Content MATURE: ${accessMinor}`);

  if (adultProfile.ageStatus === 'ADULT' && minorProfile.ageStatus === 'RESTRICTED' && accessAdult && !accessMinor) {
    console.log('✅ Test 2 PASADO: Sistema de control de edad restringió correctamente al menor.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Trust & Safety Case Management Queue
  console.log('\n▶ Test 3: Crear caso de seguridad de severidad CRITICAL y resolver...');
  const safetyCase = await createSafetyCase('report_123', userIdMinor, 'content_999', 'CRITICAL');
  console.log(`Caso de Seguridad Creado ID: ${safetyCase.id}, Severidad: ${safetyCase.severity}`);

  const queue = await getTrustSafetyQueue('CRITICAL', 'OPEN');
  console.log(`Casos CRITICAL en Cola: ${queue.length}`);

  const resolved = await resolveSafetyCase(safetyCase.id, 'WARNING', 'Se emitió advertencia formal', 'admin_safety');
  console.log(`Estado tras resolución: ${resolved.status}, Acción: ${resolved.actionTaken}`);

  if (queue.length >= 1 && resolved.status === 'RESOLVED') {
    console.log('✅ Test 3 PASADO: Caso de seguridad gestionado en cola prioritaria.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Privacy Account Deletion Grace Period
  console.log('\n▶ Test 4: Solicitar eliminación de cuenta (Periodo de Gracia 14 días)...');
  const deletionRes = await requestAccountDeletion(userIdAdult);
  const userAfterDel = await db.collection('users').doc(userIdAdult).get();

  console.log(`Fecha de Eliminación Programada: ${deletionRes.scheduledFor}, Estado: ${userAfterDel.data()?.status}, Nombre Anónimo: ${userAfterDel.data()?.displayName}`);
  if (userAfterDel.data()?.status === 'pending_deletion' && userAfterDel.data()?.displayName === 'Usuario Anónimo') {
    console.log('✅ Test 4 PASADO: Eliminación de cuenta programada y datos personales anonimizados.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userIdAdult).delete();
  await db.collection('users').doc(userIdMinor).delete();
  await db.collection('userAgeProfile').doc(userIdAdult).delete();
  await db.collection('userAgeProfile').doc(userIdMinor).delete();
  await db.collection('safetyCases').doc(safetyCase.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE LEGAL & SAFETY COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runLegalAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Legal & Safety:', err);
      process.exit(1);
    });
}
