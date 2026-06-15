import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { HostPayout } from '../../types/payout';

interface PayoutTimelineProps {
  payout: HostPayout;
}

interface StepItem {
  title: string;
  desc: string;
  date: string;
  active: boolean;
  completed: boolean;
  isCancel?: boolean;
  isError?: boolean;
}

export const PayoutTimeline: React.FC<PayoutTimelineProps> = ({ payout }) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      // Firebase Timestamp or JS Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Determine active steps
  const isPending = payout.status === 'pending';
  const isApproved = payout.status === 'approved' || payout.status === 'paid';
  const isPaid = payout.status === 'paid';
  const isRejected = payout.status === 'rejected';
  const isCancelled = payout.status === 'cancelled';

  // Build steps
  const steps: StepItem[] = [
    {
      title: 'Solicitado',
      desc: 'Tu solicitud de retiro fue recibida.',
      date: formatDate(payout.createdAt),
      active: true,
      completed: true,
    },
  ];

  if (isCancelled) {
    steps.push({
      title: 'Cancelado por el Usuario',
      desc: 'Cancelaste la solicitud de retiro voluntariamente.',
      date: formatDate(payout.cancelledAt || payout.updatedAt),
      active: true,
      completed: true,
      isCancel: true,
    });
  } else if (isRejected) {
    steps.push({
      title: 'Rechazado',
      desc: payout.adminNote || 'La solicitud fue rechazada por administración.',
      date: formatDate(payout.rejectedAt || payout.updatedAt),
      active: true,
      completed: true,
      isError: true,
    });
  } else {
    // Approved Step
    steps.push({
      title: 'Aprobado',
      desc: 'La administración revisó y aprobó el retiro.',
      date: formatDate(payout.processedAt),
      active: isApproved,
      completed: isApproved,
    });

    // Paid Step
    steps.push({
      title: 'Pagado',
      desc: payout.adminNote || 'Los fondos fueron transferidos a tu cuenta.',
      date: formatDate(payout.paidAt),
      active: isPaid,
      completed: isPaid,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estado del Retiro</Text>
      
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        
        let nodeColor = colors.border;
        if (step.completed) {
          if (step.isError) nodeColor = colors.error;
          else if (step.isCancel) nodeColor = colors.textDark;
          else nodeColor = colors.primary;
        }

        return (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.leftCol}>
              <View style={[styles.node, { backgroundColor: nodeColor }]} />
              {!isLast && <View style={[styles.line, step.completed && { backgroundColor: nodeColor }]} />}
            </View>

            <View style={styles.rightCol}>
              <Text style={[styles.stepTitle, step.active ? styles.textActive : styles.textInactive]}>
                {step.title}
              </Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
              {step.date ? <Text style={styles.stepDate}>{step.date}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 65,
  },
  leftCol: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  node: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  rightCol: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  textActive: {
    color: colors.text,
  },
  textInactive: {
    color: colors.textDark,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepDate: {
    fontSize: 11,
    color: colors.textDark,
    marginTop: 4,
  },
});
