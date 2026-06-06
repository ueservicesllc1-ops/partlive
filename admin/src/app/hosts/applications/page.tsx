'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

export default function HostApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; appId: string | null }>({ open: false, appId: null });
  const [rejectReason, setRejectReason] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'hostApplications'),
        where('status', '==', filter),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [filter]);

  const handleApprove = async (appId: string) => {
    setActionLoading(`approve-${appId}`);
    try {
      await api.post(`/api/host/admin/applications/${appId}/approve`);
      await fetchApplications();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectModal.appId) return;
    setActionLoading(`reject-${rejectModal.appId}`);
    try {
      await api.post(`/api/host/admin/applications/${rejectModal.appId}/reject`, { reason: rejectReason });
      setRejectModal({ open: false, appId: null });
      setRejectReason('');
      await fetchApplications();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const statusFilters = ['pending', 'approved', 'rejected'];

  return (
    <AdminLayout title="Host Applications">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Aplicaciones de Host</h1>
          <p className="mt-1 text-sm text-gray-500">Revisa y aprueba solicitudes de hosts</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2">
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
              {s}
            </button>
          ))}
        </div>

        {loading && <LoadingState message="Cargando aplicaciones..." />}
        {error && <ErrorState message={error} onRetry={fetchApplications} />}
        {!loading && !error && applications.length === 0 && (
          <EmptyState icon="📋" title={`No hay aplicaciones ${filter}`} />
        )}

        {!loading && !error && applications.length > 0 && (
          <Table headers={['Usuario', 'País', 'Experiencia', 'Por qué host', 'Estado', 'Fecha', 'Acciones']}>
            {applications.map((app: any) => (
              <tr key={app.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{app.fullName || '—'}</p>
                    <p className="text-xs text-gray-500">{app.userId}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{app.country || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-400 max-w-[180px] truncate">{app.experience || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-400 max-w-[200px] truncate">{app.whyHost || '—'}</td>
                <td className="px-6 py-4">
                  {app.status === 'approved' && <Badge variant="success">Aprobado</Badge>}
                  {app.status === 'rejected' && <Badge variant="danger">Rechazado</Badge>}
                  {app.status === 'pending' && <Badge variant="warning" dot>Pendiente</Badge>}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString('es') : '—'}
                </td>
                <td className="px-6 py-4">
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        isLoading={actionLoading === `approve-${app.id}`}
                        onClick={() => handleApprove(app.id)}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setRejectModal({ open: true, appId: app.id })}
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, appId: null })} title="Rechazar Aplicación">
        <div className="space-y-4">
          <Textarea
            label="Motivo del rechazo"
            placeholder="Explica por qué se rechaza la solicitud..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRejectModal({ open: false, appId: null })}>Cancelar</Button>
            <Button variant="danger" onClick={handleReject} isLoading={actionLoading?.startsWith('reject')}>
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
