'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

const STATUS_LABELS: Record<string, { label: string; badge: 'warning' | 'info' | 'success' | 'danger' | 'muted' }> = {
  pending: { label: 'Pendiente', badge: 'warning' },
  under_review: { label: 'En revisión', badge: 'info' },
  approved: { label: 'Aprobado', badge: 'success' },
  paid: { label: 'Pagado', badge: 'success' },
  rejected: { label: 'Rechazado', badge: 'danger' },
  cancelled: { label: 'Cancelado', badge: 'muted' },
};

export default function PayoutsAdminPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; payoutId: string | null }>({ open: false, payoutId: null });
  const [rejectNotes, setRejectNotes] = useState('');

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/payouts/admin/pending');
      let filtered = Array.isArray(data) ? data : data.payouts || [];
      if (filter !== 'pending') {
        filtered = filtered.filter((p: any) => p.status === filter);
      }
      setPayouts(filtered);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayouts(); }, [filter]);

  const handleApprove = async (payoutId: string) => {
    setActionLoading(`approve-${payoutId}`);
    try {
      await api.post(`/api/payouts/admin/${payoutId}/approve`);
      await fetchPayouts();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleMarkPaid = async (payoutId: string) => {
    setActionLoading(`paid-${payoutId}`);
    try {
      await api.post(`/api/payouts/admin/${payoutId}/mark-paid`, { adminNotes: 'Pago procesado manualmente' });
      await fetchPayouts();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectModal.payoutId) return;
    setActionLoading(`reject-${rejectModal.payoutId}`);
    try {
      await api.post(`/api/payouts/admin/${rejectModal.payoutId}/reject`, { adminNotes: rejectNotes });
      setRejectModal({ open: false, payoutId: null });
      setRejectNotes('');
      await fetchPayouts();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const statusFilters = ['pending', 'approved', 'paid', 'rejected'];

  return (
    <AdminLayout title="Payouts">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payouts / Retiros</h1>
          <p className="mt-1 text-sm text-gray-500">Aprueba, rechaza y marca pagos de hosts</p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                filter === s
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                  : 'bg-gray-900/50 text-gray-500 border border-gray-800 hover:text-gray-300'
              }`}
            >
              {STATUS_LABELS[s]?.label || s}
            </button>
          ))}
        </div>

        {loading && <LoadingState message="Cargando payouts..." />}
        {error && <ErrorState message={error} onRetry={fetchPayouts} />}
        {!loading && !error && payouts.length === 0 && (
          <EmptyState icon="💸" title={`No hay payouts ${STATUS_LABELS[filter]?.label || filter}`} />
        )}

        {!loading && !error && payouts.length > 0 && (
          <Table headers={['Host', 'Diamonds', 'USD Neto', 'Método', 'Estado', 'Fecha', 'Acciones']}>
            {payouts.map((p: any) => {
              const status = STATUS_LABELS[p.status] || { label: p.status, badge: 'muted' as const };
              return (
                <tr key={p.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-medium">{p.hostId || '—'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-400">💎 {(p.amountDiamonds || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-mono text-emerald-400">${(p.netAmountUsd || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-xs text-gray-400">{p.payoutMethodType || '—'}</td>
                  <td className="px-6 py-4"><Badge variant={status.badge} dot>{status.label}</Badge></td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('es') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {p.status === 'pending' && (
                        <>
                          <Button variant="success" size="sm" isLoading={actionLoading === `approve-${p.id}`} onClick={() => handleApprove(p.id)}>
                            Aprobar
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setRejectModal({ open: true, payoutId: p.id })}>
                            Rechazar
                          </Button>
                        </>
                      )}
                      {p.status === 'approved' && (
                        <Button variant="primary" size="sm" isLoading={actionLoading === `paid-${p.id}`} onClick={() => handleMarkPaid(p.id)}>
                          Marcar Pagado
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, payoutId: null })} title="Rechazar Payout">
        <div className="space-y-4">
          <Textarea
            label="Notas del admin (opcional)"
            placeholder="Motivo del rechazo..."
            value={rejectNotes}
            onChange={e => setRejectNotes(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRejectModal({ open: false, payoutId: null })}>Cancelar</Button>
            <Button variant="danger" onClick={handleReject} isLoading={actionLoading?.startsWith('reject')}>Confirmar Rechazo</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
