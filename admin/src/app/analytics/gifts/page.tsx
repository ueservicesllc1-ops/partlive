'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/Extras';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-700/60 bg-gray-900/95 p-3 shadow-2xl">
        <p className="mb-1 text-xs font-bold text-gray-400">{label}</p>
        {payload.map((e: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: e.color }}>
            {e.name}: {typeof e.value === 'number' ? e.value.toLocaleString() : e.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsGiftsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const res = await fetch(`/api/analytics/gifts?days=${days}&limit=20`, {
        headers: { 'x-admin-panel': 'true' },
      });
      if (!res.ok) throw new Error('Error cargando datos de regalos');
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalGifts = data.reduce((sum, d) => sum + (d.totalSent || 0), 0);
  const totalDiamonds = data.reduce((sum, d) => sum + (d.totalDiamondsSpent || 0), 0);

  // Top 6 for pie chart
  const pieData = data.slice(0, 6).map((d, i) => ({
    name: d.giftId || `Gift ${i + 1}`,
    value: d.totalSent || 0,
  }));

  return (
    <AdminLayout title="Analytics — Regalos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analíticas de Regalos</h1>
            <p className="mt-1 text-sm text-gray-500">Popularidad y consumo de regalos</p>
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

        {loading && <LoadingState message="Cargando regalos..." />}
        {error && <ErrorState message={error} onRetry={fetchData} />}

        {!loading && !error && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-pink-600/20 bg-gradient-to-br from-pink-600/10 to-pink-600/5 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Gifts Enviados</p>
                <p className="mt-2 text-3xl font-bold text-white">🎁 {totalGifts.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-blue-600/20 bg-gradient-to-br from-blue-600/10 to-blue-600/5 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Diamonds Gastados en Gifts</p>
                <p className="mt-2 text-3xl font-bold text-white">💎 {totalDiamonds.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Bar chart: top gifts by count */}
              <Card>
                <h2 className="mb-4 text-base font-bold text-white">Top Regalos por Cantidad Enviada</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis dataKey="giftId" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={70}
                      tickFormatter={(v) => v?.substring(0, 8)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalSent" name="🎁 Enviados" fill="#ec4899" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Pie chart: share by gifts */}
              <Card>
                <h2 className="mb-4 text-base font-bold text-white">Distribución Top 6 Regalos</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Gift Table */}
            <Card>
              <h2 className="mb-4 text-base font-bold text-white">Detalle de Regalos — {period}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['#', 'Gift ID', 'Total Enviados', 'Diamonds Gastados', 'Diamonds/Gift'].map((h) => (
                        <th key={h} className="pb-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="py-2 pr-4 text-xs text-gray-600">{i + 1}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-violet-400">{row.giftId}</td>
                        <td className="py-2 pr-4 font-bold text-pink-400">🎁 {(row.totalSent || 0).toLocaleString()}</td>
                        <td className="py-2 pr-4 text-blue-400">💎 {(row.totalDiamondsSpent || 0).toLocaleString()}</td>
                        <td className="py-2 text-gray-400">
                          {row.totalSent > 0 ? Math.round((row.totalDiamondsSpent || 0) / row.totalSent) : 0} 💎/gift
                        </td>
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
