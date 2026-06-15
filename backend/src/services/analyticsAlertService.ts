import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface SystemAlert {
  id?: string;
  type: 'payout_spike' | 'revenue_drop' | 'fraud_spike' | 'active_user_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  isResolved: boolean;
  createdAt: admin.firestore.Timestamp | Date;
  resolvedAt?: admin.firestore.Timestamp | Date;
  resolvedBy?: string;
}

export const triggerAlert = async (alert: Omit<SystemAlert, 'createdAt' | 'isResolved'>): Promise<string> => {
  const alertRef = db.collection('adminAlerts').doc();
  const newAlert: SystemAlert = {
    ...alert,
    isResolved: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
  };

  await alertRef.set(newAlert);
  console.warn(`[AnalyticsAlert] ALERT TRIGGERED [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.message}`);

  // In a real system, you might trigger a Slack webhook, send SMS/Email notifications here.
  return alertRef.id;
};

export const checkMetricsForAlerts = async (
  currentMetrics: Record<string, any>,
  previousMetrics?: Record<string, any>
) => {
  try {
    // 1. Payout spikes: If payout requested today exceeds $5,000 USD
    if (currentMetrics.payoutsRequestedUsd && currentMetrics.payoutsRequestedUsd > 5000) {
      await triggerAlert({
        type: 'payout_spike',
        severity: 'high',
        title: 'High Volume Payout Requested',
        message: `Payout requested volume is $${currentMetrics.payoutsRequestedUsd.toFixed(2)}, exceeding threshold of $5000.`,
        metadata: { payoutsRequestedUsd: currentMetrics.payoutsRequestedUsd },
      });
    }

    // 2. Fraud signals: More than 10 fraud signals in a single day
    if (currentMetrics.fraudSignals && currentMetrics.fraudSignals > 10) {
      await triggerAlert({
        type: 'fraud_spike',
        severity: 'critical',
        title: 'Abnormal Fraud Activity Detected',
        message: `High frequency of fraud signals detected: ${currentMetrics.fraudSignals} signals in the current period.`,
        metadata: { fraudSignals: currentMetrics.fraudSignals },
      });
    }

    // 3. Drop in active users (if previous period exists)
    if (previousMetrics && previousMetrics.activeUsers && currentMetrics.activeUsers) {
      const dropPercentage = ((previousMetrics.activeUsers - currentMetrics.activeUsers) / previousMetrics.activeUsers) * 100;
      if (dropPercentage > 25) { // 25% drop
        await triggerAlert({
          type: 'active_user_drop',
          severity: 'medium',
          title: 'Significant DAU Drop Detected',
          message: `Active users dropped by ${dropPercentage.toFixed(1)}% compared to the previous period. Current: ${currentMetrics.activeUsers}, Previous: ${previousMetrics.activeUsers}`,
          metadata: { currentActive: currentMetrics.activeUsers, previousActive: previousMetrics.activeUsers, dropPercentage },
        });
      }
    }
  } catch (error) {
    console.error('Error checking metrics for alerts:', error);
  }
};
