import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { useGiftSettings } from '../../services/gifts/giftSettingsStore';

interface GiftSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GiftSettingsModal: React.FC<GiftSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [settings, setSettings] = useGiftSettings();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>⚙️ Ajustes de Regalos y Efectos</Text>

          {/* Toggle Animations */}
          <View style={styles.settingRow}>
            <View style={styles.textCol}>
              <Text style={styles.settingLabel}>Efectos Visuales</Text>
              <Text style={styles.settingSubtext}>Mostrar animaciones flotantes y pantalla completa</Text>
            </View>
            <Switch
              value={settings.animationsEnabled}
              onValueChange={(val) => setSettings({ animationsEnabled: val })}
              trackColor={{ false: '#26203D', true: colors.accent }}
              thumbColor="#FFF"
            />
          </View>

          {/* Toggle Sounds */}
          <View style={styles.settingRow}>
            <View style={styles.textCol}>
              <Text style={styles.settingLabel}>Efectos de Sonido</Text>
              <Text style={styles.settingSubtext}>Reproducir sonidos en regalos especiales</Text>
            </View>
            <Switch
              value={settings.soundsEnabled}
              onValueChange={(val) => setSettings({ soundsEnabled: val })}
              trackColor={{ false: '#26203D', true: colors.accent }}
              thumbColor="#FFF"
            />
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#1E1B30',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#342D54',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#26203D',
  },
  textCol: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  settingSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
