import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { PayoutMethodType } from '../../types/payout';
import { getPayoutMethodTypeLabel } from '../../utils/payoutStatus';

interface PayoutMethodFormProps {
  onSubmit: (data: {
    type: PayoutMethodType;
    label: string;
    details: any;
    isDefault: boolean;
  }) => void;
  loading?: boolean;
}

export const PayoutMethodForm: React.FC<PayoutMethodFormProps> = ({
  onSubmit,
  loading = false,
}) => {
  const [type, setType] = useState<PayoutMethodType>('paypal');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  // Field states
  const [paypalEmail, setPaypalEmail] = useState('');
  const [payoneerEmail, setPayoneerEmail] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTypeSelect = (selectedType: PayoutMethodType) => {
    setType(selectedType);
    setValidationError(null);
    if (!label || label.startsWith('Mi ')) {
      setLabel(`Mi ${getPayoutMethodTypeLabel(selectedType)}`);
    }
  };

  const handleFormSubmit = () => {
    setValidationError(null);

    const finalLabel = label.trim() || `Mi ${getPayoutMethodTypeLabel(type)}`;
    let details: any = {};

    if (type === 'paypal') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        setValidationError('Por favor ingresa un email de PayPal válido.');
        return;
      }
      details = { email: paypalEmail.trim() };
    } else if (type === 'payoneer') {
      if (!payoneerEmail.trim() || !payoneerEmail.includes('@')) {
        setValidationError('Por favor ingresa un email de Payoneer válido.');
        return;
      }
      details = { email: payoneerEmail.trim() };
    } else if (type === 'bank_transfer') {
      if (!accountHolder.trim()) {
        setValidationError('El nombre del titular es requerido.');
        return;
      }
      if (!bankName.trim()) {
        setValidationError('El nombre del banco es requerido.');
        return;
      }
      if (!accountNumber.trim()) {
        setValidationError('El número de cuenta es requerido.');
        return;
      }
      details = {
        accountHolderName: accountHolder.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        routingNumber: routingNumber.trim() || undefined,
      };
    }

    onSubmit({
      type,
      label: finalLabel,
      details,
      isDefault,
    });
  };

  const typesList: PayoutMethodType[] = ['paypal', 'bank_transfer', 'payoneer'];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Selecciona el Tipo de Cuenta</Text>
      <View style={styles.typesRow}>
        {typesList.map((t) => {
          const isSelected = type === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.typeButton, isSelected && styles.selectedTypeButton]}
              onPress={() => handleTypeSelect(t)}
            >
              <Text style={[styles.typeText, isSelected && styles.selectedTypeText]}>
                {t === 'paypal' ? '🅿️ PayPal' : t === 'bank_transfer' ? '🏦 Banco' : '💸 Payoneer'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Información de la Cuenta</Text>

      {/* Label input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Etiqueta personalizada (Ej. Cuenta Personal)</Text>
        <TextInput
          style={styles.input}
          placeholder={`Mi ${getPayoutMethodTypeLabel(type)}`}
          placeholderTextColor={colors.textDark}
          value={label}
          onChangeText={setLabel}
        />
      </View>

      {/* Conditional fields */}
      {type === 'paypal' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Correo electrónico de PayPal</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@paypal.com"
            placeholderTextColor={colors.textDark}
            keyboardType="email-address"
            autoCapitalize="none"
            value={paypalEmail}
            onChangeText={setPaypalEmail}
          />
        </View>
      )}

      {type === 'payoneer' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Correo electrónico de Payoneer</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@payoneer.com"
            placeholderTextColor={colors.textDark}
            keyboardType="email-address"
            autoCapitalize="none"
            value={payoneerEmail}
            onChangeText={setPayoneerEmail}
          />
        </View>
      )}

      {type === 'bank_transfer' && (
        <View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre del Titular de la Cuenta</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan Pérez"
              placeholderTextColor={colors.textDark}
              value={accountHolder}
              onChangeText={setAccountHolder}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre del Banco</Text>
            <TextInput
              style={styles.input}
              placeholder="Banco de Crédito"
              placeholderTextColor={colors.textDark}
              value={bankName}
              onChangeText={setBankName}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de Cuenta</Text>
            <TextInput
              style={styles.input}
              placeholder="193-94829384-2-92"
              placeholderTextColor={colors.textDark}
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Código Interbancario / CCI / Routing (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="002-1939482938429283"
              placeholderTextColor={colors.textDark}
              value={routingNumber}
              onChangeText={setRoutingNumber}
            />
          </View>
        </View>
      )}

      {/* Default Checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        activeOpacity={0.8}
        onPress={() => setIsDefault(!isDefault)}
      >
        <View style={[styles.checkbox, isDefault && styles.checkedBox]}>
          {isDefault && <Text style={styles.check}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Establecer como método de retiro principal</Text>
      </TouchableOpacity>

      {validationError && <Text style={styles.errorText}>{validationError}</Text>}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleFormSubmit}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? 'Guardando...' : 'Guardar Método de Pago'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  typesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTypeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '1A',
  },
  typeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  selectedTypeText: {
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  checkedBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  check: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: spacing.xxl,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
