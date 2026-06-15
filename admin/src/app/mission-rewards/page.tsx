'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

const STATUS_LABELS: Record<string, { label: string; badge: 'warning' | 'success' | 'danger' | 'muted' }> = {
  pending: { label: 'Pendiente', badge: 'warning' },
  claimed: { label: 'Reclamado', badge: 'success' },
  failed: { label: 'Fallido', badge: 'danger' },
  reversed: { label: 'Revertido', badge: 'muted' },
};

export default function MissionRewardsAdminPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reversal inputs
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/admin/missions/rewards');
      setRewards(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleReverse = async (rewardId: string) => {
    if (!reversalReason) {
      alert('Por favor especifica un motivo para revertir la recompensa.');
      return;
    }
    setActionLoading(rewardId);
    try {
      await api.post(`/api/admin/missions/rewards/${rewardId}/reverse`, { reason: reversalReason });
      setReversingId(null);
      setReversalReason('');
      await fetchRewards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout title="Recompensas">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Recompensas</h1>
          <p className="mt-1 text-sm text-gray-400">Verifica o revierte las recompensas reclamadas por los usuarios.</p>
        </div>

        {loading && <LoadingState message="Cargando recompensas..." />}
        {error && <ErrorState message={error} onRetry={fetchRewards} />}
        {!loading && !error && rewards.length === 0 && (
          <EmptyState icon="🏆" title="No hay registros" message="Ninguna recompensa ha sido reclamada todavía." />
        )}

        {!loading && !error && rewards.length > 0 && (
          <Table headers={['ID Recompensa', 'Usuario', 'ID Misión', 'Recompensa', 'Estado', 'Fecha Reclamada', 'Acciones']}>
            {rewards.map((r: any) => {
              const status = STATUS_LABELS[r.status] || { label: r.status, badge: 'muted' as const };
              const isReversing = reversingId === r.id;
              
              return (
                <tr key={r.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{r.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{r.userId}</td>
                  <td className="px-6 py-4 text-xs font-mono text-violet-400">{r.missionId}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-400">
                    {r.rewardType === 'diamonds' ? '💎' : r.rewardType === 'beans' ? '🫘' : '⚡'} {r.rewardAmount} {r.rewardType.toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={status.badge} dot>{status.label}</Badge>
                    {r.adminNote && (
                      <span className="block text-xxs text-red-500 font-medium mt-1">{r.adminNote}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {r.claimedAt?.toDate ? r.claimedAt.toDate().toLocaleString('es') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {r.status === 'claimed' && (
                      <div className="space-y-2">
                        {!isReversing ? (
                          <Button variant="danger" size="sm" onClick={() => setReversingId(r.id)}>
                            Revertir
                          </Button>
                        ) : (
                          <div className="flex flex-col gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800">
                            <Input
                              placeholder="Motivo de reversión..."
                              value={reversalReason}
                              onChange={e => setReversalReason(e.target.value)}
                              className="text-xs"
                            />
                            <div className="flex gap-2">
                              <Button 
                                variant="danger" 
                                size="sm" 
                                isLoading={actionLoading === r.id}
                                onClick={() => handleReverse(r.id)}
                              >
                                Confirmar
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => {
                                  setReversingId(null);
                                  setReversalReason('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
