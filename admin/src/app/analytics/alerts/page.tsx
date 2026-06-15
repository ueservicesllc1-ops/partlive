'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/Extras';

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
};

const TYPE_ICONS: Record<string, string> = {
  payout_spike: '💸',
  fraud_signals: '🚨',
  low_dau: '📉',
  revenue_drop: '📊',
  gift_spike: '🎁',
  default: '⚠️',
};

export default function AnalyticsAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/alerts?status=${filter}`, {
        headers: { 'x-admin-panel': 'true' },
      });
      if (!res.ok) throw new Error('Error cargando alertas');
      const json = await res.json();
      setAlerts(json.alerts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/analytics/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'x-admin-panel': 'true', 'Content-Type': 'application/json' },
      });
      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const openCount = alerts.filter((a) => a.status === 'open').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <AdminLayout title="Analytics — Alertas del Sistema">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Alertas del Sistema
              {openCount > 0 && (
                <span className="ml-3 rounded-full bg-red-500/20 px-2.5 py-0.5 text-sm font-bold text-red-400 border border-red-500/30">
                  {openCount} abiertas
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Notificaciones automáticas de anomalías y eventos importantes
            </p>
          </div>
          <div className="flex gap-2 rounded-xl border border-gray-800 bg-gray-900 p-1">
            {(['open', 'all', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                  filter === f ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f === 'open' ? '🔴 Abiertas' : f === 'all' ? '📋 Todas' : '✅ Resueltas'}
              </button>
            ))}
          </div>
        </div>

        {/* Critical Banner */}
        {criticalCount > 0 && (
          <div className="flex items-center gap-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-red-300">{criticalCount} alerta(s) CRÍTICA(S) activa(s)</p>
              <p className="text-sm text-red-400/80">Requieren atención inmediata</p>
            </div>
          </div>
        )}

        {loading && <LoadingState message="Cargando alertas..." />}
        {error && <ErrorState message={error} onRetry={fetchAlerts} />}

        {!loading && !error && alerts.length === 0 && (
          <Card>
            <div className="py-16 text-center">
              <p className="text-4xl">✅</p>
              <p className="mt-3 text-lg font-bold text-white">
                {filter === 'open' ? 'No hay alertas abiertas' : 'No hay alertas registradas'}
              </p>
              <p className="mt-1 text-sm text-gray-500">El sistema funciona con normalidad</p>
            </div>
          </Card>
        )}

        {!loading && !error && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const icon = TYPE_ICONS[alert.type] || TYPE_ICONS.default;
              const severityStyle = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
              const isOpen = alert.status === 'open';

              return (
                <div
                  key={alert.id}
                  className={`relative flex items-start gap-4 rounded-2xl border p-5 transition-all ${
                    isOpen
                      ? 'border-gray-700/60 bg-gray-900/80'
                      : 'border-gray-800/40 bg-gray-900/30 opacity-60'
                  }`}
                >
                  {/* Pulse dot for open alerts */}
                  {isOpen && alert.severity === 'critical' && (
                    <span className="absolute right-4 top-4 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                  )}

                  {/* Icon */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-800 text-2xl">
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${severityStyle}`}>
                        {alert.severity}
                      </span>
                      <span className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                        {alert.type?.replace(/_/g, ' ')}
                      </span>
                      {!isOpen && (
                        <span className="rounded-full border border-emerald-700/40 bg-emerald-700/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          ✅ Resuelta
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-semibold text-white">{alert.message || alert.title || 'Alerta del sistema'}</p>
                    {alert.details && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{JSON.stringify(alert.details)}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-600">
                      {alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleString('es') : 'Fecha desconocida'}
                    </p>
                  </div>

                  {/* Action */}
                  {isOpen && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="flex-shrink-0 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-600/20 hover:text-emerald-300"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
