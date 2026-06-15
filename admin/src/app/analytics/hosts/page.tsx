'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/Extras';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

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

export default function AnalyticsHostsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const res = await fetch(`/api/analytics/hosts?days=${days}&limit=20`, {
        headers: { 'x-admin-panel': 'true' },
      });
      if (!res.ok) throw new Error('Error cargando datos de hosts');
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <AdminLayout title="Analytics — Top Hosts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Top Hosts</h1>
            <p className="mt-1 text-sm text-gray-500">Hosts ordenados por Beans generados y actividad</p>
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

        {loading && <LoadingState message="Cargando hosts..." />}
        {error && <ErrorState message={error} onRetry={fetchData} />}

        {!loading && !error && (
          <>
            {/* Chart: Beans by host */}
            <Card>
              <h2 className="mb-4 text-base font-bold text-white">Beans Generados por Host (Top 10)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis dataKey="hostId" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80}
                    tickFormatter={(v) => v?.substring(0, 8) + '...'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                  <Bar dataKey="beansGenerated" name="🫘 Beans" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="giftsReceived" name="🎁 Gifts" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Hosts ranking table */}
            <Card>
              <h2 className="mb-4 text-base font-bold text-white">Ranking de Hosts — {period}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['#', 'Host ID', 'Beans Gen.', 'Gifts Rec.', 'Mins Live', 'Diamonds Req.'].map((h) => (
                        <th key={h} className="pb-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="py-2 pr-4">
                          <span className={`text-sm font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-600'}`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-violet-400">
                          {row.hostId?.substring(0, 12)}...
                        </td>
                        <td className="py-2 pr-4 font-bold text-blue-400">🫘 {(row.beansGenerated || 0).toLocaleString()}</td>
                        <td className="py-2 pr-4 text-pink-400">🎁 {(row.giftsReceived || 0).toLocaleString()}</td>
                        <td className="py-2 pr-4 text-emerald-400">{(row.liveMinutes || 0).toLocaleString()} min</td>
                        <td className="py-2 text-amber-400">💎 {(row.diamondsRequested || 0).toLocaleString()}</td>
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
