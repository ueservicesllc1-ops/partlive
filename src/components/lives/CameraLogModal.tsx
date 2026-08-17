import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';

interface CameraLogModalProps {
  visible: boolean;
  logs: string[];
  lastError: string | null;
  onClose: () => void;
  onClear: () => void;
  onRetrySwitch?: () => void;
}

export const CameraLogModal: React.FC<CameraLogModalProps> = ({
  visible,
  logs,
  lastError,
  onClose,
  onClear,
  onRetrySwitch,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlayContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📸 Diagnostic Logs de Cámara</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
                <Text style={styles.clearBtnText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Last Error Banner */}
          {lastError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText} numberOfLines={3}>
                {lastError}
              </Text>
            </View>
          )}

          {/* Logs ScrollView */}
          <ScrollView
            style={styles.logsScrollView}
            contentContainerStyle={styles.logsContent}
            nestedScrollEnabled
          >
            {logs.length === 0 ? (
              <Text style={styles.noLogsText}>
                No hay logs registrados aún. Toca "Girar Cámara" para iniciar diagnóstico.
              </Text>
            ) : (
              logs.map((log, index) => {
                const isError = log.includes('❌') || log.includes('Error') || log.includes('falló');
                const isSuccess = log.includes('✅') || log.includes('exitoso');
                const isWarn = log.includes('⚠️');

                return (
                  <Text
                    key={index}
                    style={[
                      styles.logLine,
                      isError && styles.logError,
                      isSuccess && styles.logSuccess,
                      isWarn && styles.logWarn,
                    ]}
                  >
                    {log}
                  </Text>
                );
              })
            )}
          </ScrollView>

          {/* Footer Action */}
          {onRetrySwitch && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.retryBtn} onPress={onRetrySwitch} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>🔄 Girar Cámara Ahora</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0D0B18',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    minHeight: '40%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2445',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#201B36',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    backgroundColor: '#201B36',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearBtnText: {
    color: '#AAA',
    fontSize: 12,
  },
  closeBtn: {
    backgroundColor: '#331B2A',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    gap: 8,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    color: '#FF8080',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  logsScrollView: {
    flex: 1,
    backgroundColor: '#05040A',
    borderRadius: 8,
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#181429',
  },
  logsContent: {
    paddingBottom: 10,
  },
  noLogsText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logLine: {
    color: '#00FF66',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  logError: {
    color: '#FF4D4D',
    fontWeight: 'bold',
  },
  logSuccess: {
    color: '#00E676',
    fontWeight: 'bold',
  },
  logWarn: {
    color: '#FFD600',
  },
  footer: {
    paddingTop: 8,
  },
  retryBtn: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
