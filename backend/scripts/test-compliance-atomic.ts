import { db } from '../src/config/firebase';
import {
  publishLegalDocument,
  recordTermsAcceptance,
  updateUserConsent,
  submitPrivacyRequest,
  processPrivacyRequest,
} from '../src/services/legalComplianceService';

export const runComplianceAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('⚖️ RUNNING LEGAL, PRIVACY, COMPLIANCE & STORE READINESS ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_comp_user_' + Date.now();
  const adminId = 'test_comp_admin_' + Date.now();

  await db.collection('users').doc(userId).set({ uid: userId, displayName: 'Usuario Compliance', status: 'active' });
  await db.collection('users').doc(adminId).set({ uid: adminId, displayName: 'Compliance Officer', role: 'legal_admin' });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Publish Versioned Legal Document
  console.log('\n▶ Test 1: Publicar documento legal versionado con marca LEGAL_REVIEW_REQUIRED...');
  const legalDoc = await publishLegalDocument(
    'TERMS_OF_SERVICE',
    'Términos y Condiciones PartyLive v1.0',
    'Contenido completo de términos de servicio de la plataforma...',
    '1.0',
    adminId
  );

  console.log(`Documento Publicado ID: ${legalDoc.id}, Versión: ${legalDoc.version}, Revisión Legal Requerida: ${legalDoc.legalReviewRequired}`);
  if (legalDoc.version === '1.0' && legalDoc.legalReviewRequired === true) {
    console.log('✅ Test 1 PASADO: Documento legal publicado con versionado y flag de revisión.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Record User Terms Acceptance
  console.log('\n▶ Test 2: Registrar aceptación explícita de Términos por usuario...');
  const acceptance = await recordTermsAcceptance(userId, 'TERMS_OF_SERVICE', '1.0', 'US', 'iOS');
  console.log(`Aceptación Registrada: ID=${acceptance.id}, Documento=${acceptance.documentType}, Versión=${acceptance.version}`);

  if (acceptance.version === '1.0') {
    console.log('✅ Test 2 PASADO: Aceptación de términos registrada con auditoría.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Update Granular Consent
  console.log('\n▶ Test 3: Actualizar consentimiento granular de privacidad (Marketing = false)...');
  const consent = await updateUserConsent(userId, 'marketing', false);
  console.log(`Estado de Consentimiento Marketing: ${consent.marketing}`);

  if (consent.marketing === false) {
    console.log('✅ Test 3 PASADO: Consentimiento granular actualizado independientemente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Privacy Data Export Request
  console.log('\n▶ Test 4: Procesar solicitud de exportación de datos de privacidad (DOWNLOAD_DATA)...');
  const exportReq = await submitPrivacyRequest(userId, 'DOWNLOAD_DATA', 'Solicitud GDPR de exportación');
  const processedExport = await processPrivacyRequest(exportReq.id, 'COMPLETED', 'Enlace de descarga de datos generado.', adminId);

  console.log(`Solicitud de Exportación ID: ${processedExport.id}, Estado: ${processedExport.status}`);
  if (processedExport.status === 'COMPLETED') {
    console.log('✅ Test 4 PASADO: Solicitud de exportación procesada correctamente.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Account Deletion Request & Retention Rules
  console.log('\n▶ Test 5: Solicitar eliminación de cuenta (DELETE_ACCOUNT) y verificar estado PENDING_DELETION...');
  const deleteReq = await submitPrivacyRequest(userId, 'DELETE_ACCOUNT', 'Deseo eliminar mi cuenta');
  const userSnap = await db.collection('users').doc(userId).get();
  const deletionStatus = userSnap.data()?.deletionStatus;

  console.log(`Solicitud de Eliminación ID: ${deleteReq.id}, Estado del Usuario: ${deletionStatus}`);
  if (deleteReq.requestType === 'DELETE_ACCOUNT' && deletionStatus === 'PENDING_DELETION') {
    console.log('✅ Test 5 PASADO: Eliminación de cuenta solicitada en periodo de gracia.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();
  await db.collection('users').doc(adminId).delete();
  await db.collection('legalDocuments').doc(legalDoc.id).delete();
  await db.collection('termsAcceptances').doc(acceptance.id).delete();
  await db.collection('userConsents').doc(userId).delete();
  await db.collection('privacyRequests').doc(exportReq.id).delete();
  await db.collection('privacyRequests').doc(deleteReq.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE COMPLIANCE COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runComplianceAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Compliance:', err);
      process.exit(1);
    });
}
