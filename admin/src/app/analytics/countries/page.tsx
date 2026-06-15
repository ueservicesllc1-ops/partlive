'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/Extras';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COUNTRY_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#14b8a6', '#f97316'];

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

export default function AnalyticsCountriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'newUsers' | 'revenue' | 'giftsCount'>('newUsers');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/countries?limit=20', {
        headers: { 'x-admin-panel': 'true' },
      });
      if (!res.ok) throw new Error('Error cargando datos por país');
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metricLabels = {
    newUsers: '👥 Nuevos Usuarios',
    revenue: '💵 Revenue ($)',
    giftsCount: '🎁 Gifts Enviados',
  };

  return (
    <AdminLayout title="Analytics — Países">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Métricas por País</h1>
            <p className="mt-1 text-sm text-gray-500">Distribución geográfica de usuarios y actividad</p>
          </div>
          <div className="flex gap-2 rounded-xl border border-gray-800 bg-gray-900 p-1">
            {(Object.keys(metricLabels) as Array<keyof typeof metricLabels>).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  metric === m ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                {metricLabels[m]}
              </button>
            ))}
          </div>
        </div>

        {loading && <LoadingState message="Cargando datos por país..." />}
        {error && <ErrorState message={error} onRetry={fetchData} />}

        {!loading && !error && (
          <>
            {/* Bar Chart */}
            <Card>
              <h2 className="mb-4 text-base font-bold text-white">{metricLabels[metric]} por País</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis dataKey="country" type="category" tick={{ fill: '#9ca3af', fontSize: 12 }} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={metric} name={metricLabels[metric]} radius={[0, 4, 4, 0]}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Country Table */}
            <Card>
              <h2 className="mb-4 text-base font-bold text-white">Tabla Completa por País</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['#', 'País', 'Usuarios', 'Revenue', 'Gifts', 'Beans Gen.'].map((h) => (
                        <th key={h} className="pb-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="py-2 pr-4 text-xs text-gray-600">{i + 1}</td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                            />
                            <span className="font-bold text-white">{row.country || '??'}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-emerald-400">{(row.newUsers || 0).toLocaleString()}</td>
                        <td className="py-2 pr-4 font-bold text-amber-400">${(row.revenue || 0).toFixed(2)}</td>
                        <td className="py-2 pr-4 text-pink-400">{(row.giftsCount || 0).toLocaleString()}</td>
                        <td className="py-2 text-blue-400">{(row.beansGenerated || 0).toLocaleString()}</td>
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
