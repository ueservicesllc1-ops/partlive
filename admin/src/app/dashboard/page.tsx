'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

interface SummaryData {
  usersCount: number;
  activeRoomsCount: number;
  activeLivesCount: number;
  pendingReportsCount: number;
  pendingHostApplicationsCount: number;
  pendingPayoutsCount: number;
  purchasesTodayCount: number;
  giftsTodayCount: number;
  diamondsToday: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/admin/summary');
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Bienvenido al Panel Admin</h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de actividad de la plataforma PartyLive
          </p>
        </div>

        {loading && <LoadingState message="Cargando estadísticas..." />}
        {error && <ErrorState message={error} onRetry={fetchSummary} />}

        {summary && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <StatCard
                title="Total Usuarios"
                value={summary.usersCount}
                icon="👥"
                color="violet"
                subText="Usuarios registrados"
              />
              <StatCard
                title="Salas Activas"
                value={summary.activeRoomsCount}
                icon="🏠"
                color="blue"
                subText="En este momento"
              />
              <StatCard
                title="Lives Activos"
                value={summary.activeLivesCount}
                icon="🔴"
                color="red"
                subText="Transmitiendo ahora"
              />
              <StatCard
                title="Reportes Pendientes"
                value={summary.pendingReportsCount}
                icon="🚨"
                color="amber"
                subText="Por revisar"
                trend={summary.pendingReportsCount > 0 ? 'up' : 'neutral'}
              />
              <StatCard
                title="Host Applications"
                value={summary.pendingHostApplicationsCount}
                icon="📋"
                color="emerald"
                subText="En espera de aprobación"
              />
              <StatCard
                title="Payouts Pendientes"
                value={summary.pendingPayoutsCount}
                icon="💸"
                color="pink"
                subText="Por procesar"
              />
              <StatCard
                title="Compras Hoy"
                value={summary.purchasesTodayCount}
                icon="🛒"
                color="emerald"
                subText="Transacciones del día"
              />
              <StatCard
                title="Regalos Hoy"
                value={summary.giftsTodayCount}
                icon="🎁"
                color="violet"
                subText="Enviados hoy"
              />
            </div>

            {/* Diamond Today Highlight */}
            <Card className="relative overflow-hidden border-violet-600/20 bg-gradient-to-r from-violet-950/40 to-violet-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
                    Diamantes Generados Hoy
                  </p>
                  <p className="mt-2 text-4xl font-black text-white">
                    💎 {summary.diamondsToday.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    ≈ ${(summary.diamondsToday * 0.005).toFixed(2)} USD en valor de retiro
                  </p>
                </div>
                <div className="text-7xl opacity-20">💎</div>
              </div>
            </Card>

            {/* Quick Actions */}
            <div>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
                Acciones Rápidas
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Ver Reportes', icon: '🚨', href: '/reports', highlight: summary.pendingReportsCount > 0 },
                  { label: 'Host Applications', icon: '📋', href: '/hosts/applications', highlight: summary.pendingHostApplicationsCount > 0 },
                  { label: 'Aprobar Payouts', icon: '💸', href: '/payouts', highlight: summary.pendingPayoutsCount > 0 },
                  { label: 'Ver Usuarios', icon: '👥', href: '/users', highlight: false },
                ].map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    className={`group flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                      action.highlight
                        ? 'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15'
                        : 'border-gray-800 bg-gray-900/50 hover:bg-gray-900'
                    }`}
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-xs font-semibold text-gray-300">{action.label}</span>
                    {action.highlight && (
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
