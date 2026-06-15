'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/Extras';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Link from 'next/link';

interface AnalyticsSummary {
  period: string;
  newUsers: number;
  dau: number;
  totalUsers: number;
  revenue: number;
  diamondsPurchased: number;
  giftsCount: number;
  diamondsSpent: number;
  beansGenerated: number;
  payoutsRequested: number;
  payoutsPaid: number;
  activeLivesCount: number;
  pkBattlesCount: number;
  karaokeSessionsCount: number;
  fraudSignalsCount: number;
  vipPurchasesCount: number;
}

const CHART_COLORS = {
  violet: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  blue: '#3b82f6',
  pink: '#ec4899',
  red: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-700/60 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-md">
        <p className="mb-2 text-xs font-bold text-gray-400">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const res = await fetch(`/api/analytics/summary?days=${days}`, {
        headers: { 'x-admin-panel': 'true' },
      });
      if (!res.ok) throw new Error('Error cargando analíticas');
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aggregate totals from all periods
  const totals = data.reduce(
    (acc, d) => ({
      newUsers: acc.newUsers + (d.newUsers || 0),
      revenue: acc.revenue + (d.revenue || 0),
      giftsCount: acc.giftsCount + (d.giftsCount || 0),
      beansGenerated: acc.beansGenerated + (d.beansGenerated || 0),
      pkBattles: acc.pkBattles + (d.pkBattlesCount || 0),
      karaokeCount: acc.karaokeCount + (d.karaokeSessionsCount || 0),
      fraudSignals: acc.fraudSignals + (d.fraudSignalsCount || 0),
    }),
    { newUsers: 0, revenue: 0, giftsCount: 0, beansGenerated: 0, pkBattles: 0, karaokeCount: 0, fraudSignals: 0 }
  );

  const latestDau = data.length > 0 ? data[data.length - 1].dau : 0;

  return (
    <AdminLayout title="Analytics — Resumen General">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analíticas Generales</h1>
            <p className="mt-1 text-sm text-gray-500">Visión global del crecimiento y monetización de PartyLive</p>
          </div>
          {/* Period Selector */}
          <div className="flex gap-2 rounded-xl border border-gray-800 bg-gray-900 p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                  period === p
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        {loading && <LoadingState message="Cargando analíticas..." />}
        {error && <ErrorState message={error} onRetry={fetchData} />}

        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard title="DAU (Hoy)" value={latestDau.toLocaleString()} icon="👥" color="violet" subText={`${period}`} trend="up" />
              <StatCard title={`Nuevos Usuarios (${period})`} value={totals.newUsers.toLocaleString()} icon="🆕" color="emerald" />
              <StatCard title={`Revenue (${period})`} value={`$${totals.revenue.toFixed(2)}`} icon="💵" color="amber" trend="up" />
              <StatCard title={`Gifts Enviados (${period})`} value={totals.giftsCount.toLocaleString()} icon="🎁" color="pink" />
              <StatCard title={`Beans Generados (${period})`} value={totals.beansGenerated.toLocaleString()} icon="🫘" color="blue" />
              <StatCard title={`Batallas PK (${period})`} value={totals.pkBattles.toLocaleString()} icon="⚔️" color="red" />
              <StatCard title={`Karaoke (${period})`} value={totals.karaokeCount.toLocaleString()} icon="🎤" color="violet" />
              <StatCard title={`Alertas Fraude (${period})`} value={totals.fraudSignals.toLocaleString()} icon="🚨" color="red" subText="señales detectadas" />
            </div>

            {/* DAU Chart */}
            <Card>
              <h2 className="mb-4 text-base font-bold text-white">Usuarios Activos Diarios (DAU)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.violet} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.violet} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="dau" name="DAU" stroke={CHART_COLORS.violet} fill="url(#dauGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="newUsers" name="Nuevos" stroke={CHART_COLORS.emerald} fill="none" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Revenue + Gifts Chart */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 text-base font-bold text-white">Revenue USD por Día</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Revenue ($)" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <h2 className="mb-4 text-base font-bold text-white">Gifts y Diamonds Gastados</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                    <Line type="monotone" dataKey="giftsCount" name="Gifts" stroke={CHART_COLORS.pink} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="diamondsSpent" name="Diamonds Gastados" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { label: 'Revenue Detallado', href: '/analytics/revenue', icon: '💵' },
                { label: 'Por País', href: '/analytics/countries', icon: '🌎' },
                { label: 'Top Hosts', href: '/analytics/hosts', icon: '🎙️' },
                { label: 'Gifts', href: '/analytics/gifts', icon: '🎁' },
                { label: 'Alertas', href: '/analytics/alerts', icon: '🚨' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-violet-600/40 hover:bg-violet-600/10 hover:text-white"
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
