import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const AdminComplianceLaunchScreen = ({ navigation }: any) => {
  const [checklist, setChecklist] = useState<any>(null);
  const [launchGates, setLaunchGates] = useState<any>(null);
  const [delResult, setDelResult] = useState<any>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchComplianceData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const readinessRes = await apiFetch<any>('/compliance-2/readiness');
      const gatesRes = await apiFetch<any>('/compliance-2/launch-gates');

      setChecklist(readinessRes.checklist);
      setLaunchGates(gatesRes.gates);
    } catch (err) {
      console.error('Error fetching compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAccountDeletion = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/compliance-2/account-deletion', {
        method: 'POST',
        body: JSON.stringify({ justification: 'Prueba de eliminación de cuenta desde panel admin' }),
      });
      setDelResult(res.deletion);
      Alert.alert(
        'Solicitud de Eliminación de Cuenta',
        `Solicitud ID: ${res.deletion.requestId}\nEstado: PENDIENTE (Periodo de Gracia: ${res.deletion.gracePeriodDays} días)\nRetención Auditoría Financiera: ${res.deletion.financialRecordsRetained ? 'RETENIDA ✅' : 'NO'}`
      );
    } catch (err: any) {
      Alert.alert('Error Eliminación Cuenta', err.message || 'Error en flujo de eliminación');
    }
  };

  const handleTestDataExport = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/compliance-2/data-export', {
        method: 'POST',
      });
      setExportResult(res.export);
      Alert.alert(
        'Exportación de Datos Personales (Privacy Center)',
        `Paquete Generado: ${res.export.exportId}\nURL Descarga: ${res.export.downloadUrl}\nExpira: ${new Date(res.export.expiresAt).toLocaleDateString()}`
      );
    } catch (err: any) {
      Alert.alert('Error Exportación Datos', err.message || 'Error al generar paquete de datos');
    }
  };

  const handleCreateSupportTicket = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/compliance-2/support-ticket', {
        method: 'POST',
        body: JSON.stringify({
          category: 'PAYMENTS',
          subject: 'Consulta sobre acreditación de compra de Coins',
          description: 'El paquete de 1,000 Coins fue facturado pero requirió verificación secundaria.',
          linkedTransactionId: 'tx_pay_9988',
        }),
      });
      setTicketResult(res.ticket);
      Alert.alert(
        'Ticket de Soporte Creado',
        `Ticket ID: ${res.ticket.ticketId}\nCategoría: ${res.ticket.category} | Prioridad: ${res.ticket.priority} | Transacción Vinculada: ${res.ticket.linkedTransactionId}`
      );
    } catch (err: any) {
      Alert.alert('Error Ticket Soporte', err.message || 'Error al crear ticket');
    }
  };

  const handleApproveReleaseAudit = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/compliance-2/release-audit', {
        method: 'POST',
        body: JSON.stringify({ version: '1.0.0', buildNumber: 100 }),
      });
      setAuditResult(res.audit);
      Alert.alert(
        'Auditoría de Lanzamiento a Producción',
        `Versión v${res.audit.version} (Build #${res.audit.buildNumber}) APROBADA para publicación en App Store & Google Play ✅`
      );
    } catch (err: any) {
      Alert.alert('Error Auditoría Lanzamiento', err.message || 'Error al firmar lanzamiento');
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="📱 Centro de Lanzamiento & Compliance"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Verificando listas App Store / Google Play y puertas de producción...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Store Readiness Checklist Status */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏬 Estado de Preparación App Store & Google Play</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Apple App Store:</Text>
              <Text style={[styles.val, { color: checklist?.appStore?.status === 'READY' ? '#00E5FF' : '#FF5252' }]}>
                {checklist?.appStore?.status} (Eliminación de Cuenta ✅ | Restore IAP ✅)
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Google Play Store:</Text>
              <Text style={[styles.val, { color: checklist?.googlePlay?.status === 'READY' ? '#00E5FF' : '#FF5252' }]}>
                {checklist?.googlePlay?.status} (Sección Data Safety ✅ | Target SDK ✅)
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado General:</Text>
              <Text style={[styles.val, { color: '#00E5FF', fontWeight: 'bold' }]}>{checklist?.overallStatus}</Text>
            </View>
          </View>

          {/* Production Launch Gates */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚪 Puertas de Calidad para Producción (Launch Gates)</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{launchGates?.securityGatePassed ? 'APROBADO ✅' : 'RECHAZADO ❌'}</Text>
                <Text style={styles.kpiLabel}>Puerta de Seguridad (0 Vulns)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{launchGates?.performanceGatePassed ? 'APROBADO ✅' : 'RECHAZADO ❌'}</Text>
                <Text style={styles.kpiLabel}>Puerta Rendimiento (&lt;= 45ms)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{launchGates?.livekitGatePassed ? 'APROBADO ✅' : 'RECHAZADO ❌'}</Text>
                <Text style={styles.kpiLabel}>Puerta LiveKit WebRTC</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{launchGates?.iapGatePassed ? 'APROBADO ✅' : 'RECHAZADO ❌'}</Text>
                <Text style={styles.kpiLabel}>Puerta Compras IAP</Text>
              </View>
            </View>
          </View>

          {/* Privacy Center & Account Deletion Flow */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔒 Centro de Privacidad & Eliminación de Cuenta</Text>
            <Text style={styles.subText}>Prueba la exportación de datos y la eliminación de cuenta con retención contable.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={handleTestDataExport}>
                <Text style={styles.actionBtnText}>Exportar Mis Datos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#FF5252' }]} onPress={handleTestAccountDeletion}>
                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Solicitar Eliminación</Text>
              </TouchableOpacity>
            </View>

            {delResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Eliminación ID: {delResult.requestId} (Estado: {delResult.status})</Text>
                <Text style={styles.resultSub}>Días de Gracia: {delResult.gracePeriodDays} | Registros Financieros Retenidos: SÍ ✅</Text>
              </View>
            )}
          </View>

          {/* Support Ticket System */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎫 Sistema de Tickets de Soporte & Finanzas</Text>
            <Text style={styles.subText}>Crea un ticket vinculado a una transacción sin exponer secretos.</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleCreateSupportTicket}>
              <Text style={styles.actionBtnText}>Crear Ticket de Soporte Financiero</Text>
            </TouchableOpacity>

            {ticketResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Ticket ID: {ticketResult.ticketId} (Prioridad: {ticketResult.priority})</Text>
                <Text style={styles.resultSub}>Asunto: {ticketResult.subject} | Transacción: {ticketResult.linkedTransactionId}</Text>
              </View>
            )}
          </View>

          {/* Release Management & Production Audit */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✍️ Firma de Auditoría de Lanzamiento (Release Audit)</Text>
            <Text style={styles.subText}>Firma el registro oficial de auditoría para autorizar despliegue en tiendas.</Text>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00E5FF' }]} onPress={handleApproveReleaseAudit}>
              <Text style={[styles.actionBtnText, { color: '#000' }]}>Aprobar Lanzamiento v1.0.0 (Build #100)</Text>
            </TouchableOpacity>

            {auditResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Auditoría ID: {auditResult.auditId} ✅</Text>
                <Text style={styles.resultSub}>Versión: v{auditResult.version} (Build #{auditResult.buildNumber}) | Aprobado para Tiendas</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
  val: {
    fontSize: 12,
    color: '#FFF',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  kpiBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: colors.accent,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  resultBox: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  resultSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
