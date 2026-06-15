'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/Extras';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-700/60 bg-gray-900/95 p-3 shadow-2xl">
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

export default function AnalyticsRevenuePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const res = await fetch(`/api/analytics/revenue?days=${days}`, {
        headers: { 'x-admin-panel': 'true' },
      });
      if (!res.ok) throw new Error('Error cargando datos de revenue');
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totals = data.reduce(
    (acc, d) => ({
      revenue: acc.revenue + (d.revenue || 0),
      diamondsPurchased: acc.diamondsPurchased + (d.diamondsPurchased || 0),
      payoutsTotal: acc.payoutsTotal + (d.payoutsPaid || 0),
      vipCount: acc.vipCount + (d.vipPurchasesCount || 0),
    }),
    { revenue: 0, diamondsPurchased: 0, payoutsTotal: 0, vipCount: 0 }
  );

  return (
    <AdminLayout title="Analytics — Revenue">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Revenue & Finanzas</h1>
            <p className="mt-1 text-sm text-gray-500">Ingresos, compras de Diamonds y pagos procesados</p>
          </div>
          <div className="flex gap-2 rounded-xl border border-gray-800 bg-gray-900 p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                  period === p ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        {loading && <LoadingState message="Cargando revenue..." />}
        {error && <ErrorState message={error} onRetry={fetchData} />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard title={`Revenue Total (${period})`} value={`$${totals.revenue.toFixed(2)}`} icon="💵" color="amber" trend="up" />
              <StatCard title="Diamonds Comprados" value={totals.diamondsPurchased.toLocaleString()} icon="💎" color="blue" />
              <StatCard title="Payouts Pagados" value={`$${totals.payoutsTotal.toFixed(2)}`} icon="💸" color="emerald" />
              <StatCard title="Suscripciones VIP" value={totals.vipCount.toLocaleString()} icon="👑" color="violet" />
            </div>

            {/* Revenue over time */}
            <Card>
              <h2 className="mb-4 text-base font-bold text-white">Revenue USD por Día</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#f59e0b" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Diamonds vs Payouts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 text-base font-bold text-white">Diamonds Comprados</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="diamondsPurchased" name="💎 Diamonds" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <h2 className="mb-4 text-base font-bold text-white">Payouts Solicitados vs Pagados</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                    <Bar dataKey="payoutsRequested" name="Solicitados ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="payoutsPaid" name="Pagados ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Detail Table */}
            <Card>
              <h2 className="mb-4 text-base font-bold text-white">Detalle por Período</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Período', 'Revenue', 'Diamonds', 'Payouts Req.', 'Payouts Pag.', 'VIP'].map((h) => (
                        <th key={h} className="pb-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="py-2 pr-4 font-mono text-xs text-gray-400">{row.period}</td>
                        <td className="py-2 pr-4 font-bold text-amber-400">${(row.revenue || 0).toFixed(2)}</td>
                        <td className="py-2 pr-4 text-blue-400">💎 {(row.diamondsPurchased || 0).toLocaleString()}</td>
                        <td className="py-2 pr-4 text-violet-400">${(row.payoutsRequested || 0).toFixed(2)}</td>
                        <td className="py-2 pr-4 text-emerald-400">${(row.payoutsPaid || 0).toFixed(2)}</td>
                        <td className="py-2 text-pink-400">👑 {(row.vipPurchasesCount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
