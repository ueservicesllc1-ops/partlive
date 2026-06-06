'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/admin/reports');
      let filtered = Array.isArray(data) ? data : [];
      if (statusFilter) filtered = filtered.filter((r: any) => r.status === statusFilter);
      setReports(filtered);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [statusFilter]);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    setActionLoading(`${status}-${reportId}`);
    try {
      await api.post(`/api/admin/reports/${reportId}/status`, { status });
      await fetchReports();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  return (
    <AdminLayout title="Reportes">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Reportes</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona reportes de usuarios</p>
          </div>
          <Select
            options={[
              { label: 'Todos', value: '' },
              { label: 'Pendiente', value: 'pending' },
              { label: 'En revisión', value: 'reviewing' },
              { label: 'Resuelto', value: 'resolved' },
              { label: 'Rechazado', value: 'rejected' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-44"
          />
        </div>

        {loading && <LoadingState message="Cargando reportes..." />}
        {error && <ErrorState message={error} onRetry={fetchReports} />}
        {!loading && !error && reports.length === 0 && (
          <EmptyState icon="🚨" title="No hay reportes" message="No se encontraron reportes con ese filtro" />
        )}

        {!loading && !error && reports.length > 0 && (
          <Table headers={['Reporter', 'Tipo Target', 'Razón', 'Estado', 'Fecha', 'Acciones']}>
            {reports.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-400">{r.reporterId || '—'}</td>
                <td className="px-6 py-4"><Badge variant="muted">{r.targetType || '—'}</Badge></td>
                <td className="px-6 py-4 text-sm text-gray-400 max-w-[200px] truncate">{r.reason || '—'}</td>
                <td className="px-6 py-4">
                  {r.status === 'pending' && <Badge variant="warning" dot>Pendiente</Badge>}
                  {r.status === 'reviewing' && <Badge variant="info" dot>En revisión</Badge>}
                  {r.status === 'resolved' && <Badge variant="success">Resuelto</Badge>}
                  {r.status === 'rejected' && <Badge variant="danger">Rechazado</Badge>}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('es') : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {r.status === 'pending' && (
                      <Button variant="secondary" size="sm" isLoading={actionLoading === `reviewing-${r.id}`}
                        onClick={() => handleUpdateStatus(r.id, 'reviewing')}>
                        Revisar
                      </Button>
                    )}
                    {(r.status === 'pending' || r.status === 'reviewing') && (
                      <>
                        <Button variant="success" size="sm" isLoading={actionLoading === `resolved-${r.id}`}
                          onClick={() => handleUpdateStatus(r.id, 'resolved')}>
                          Resolver
                        </Button>
                        <Button variant="ghost" size="sm" isLoading={actionLoading === `rejected-${r.id}`}
                          onClick={() => handleUpdateStatus(r.id, 'rejected')}>
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
