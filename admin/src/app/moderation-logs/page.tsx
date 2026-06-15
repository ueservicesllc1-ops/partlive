'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Extras';
import { moderationAdminApi } from '@/services/moderationAdminApi';

export default function ModerationLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await moderationAdminApi.getModerationLogs(100);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('ban') || action.includes('close') || action.includes('kick')) return 'danger';
    if (action.includes('suspend') || action.includes('lock')) return 'warning';
    if (action.includes('warn') || action.includes('hide')) return 'info';
    return 'success';
  };

  return (
    <AdminLayout title="Historial de Moderación">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Historial de Moderación</h1>
            <p className="mt-1 text-sm text-gray-500">Auditoría global de acciones tomadas por el equipo administrativo y moderadores</p>
          </div>
          <Button variant="secondary" onClick={fetchLogs} size="sm">
            🔄 Actualizar
          </Button>
        </div>

        {loading && <LoadingState message="Cargando logs..." />}
        {error && <ErrorState message={error} onRetry={fetchLogs} />}
        {!loading && !error && logs.length === 0 && (
          <EmptyState icon="📜" title="Sin logs" message="No se han registrado acciones de moderación aún." />
        )}

        {!loading && !error && logs.length > 0 && (
          <Table headers={['Moderador / Actor', 'Acción', 'Target', 'Detalles / Motivo', 'Fecha']}>
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-900/40 transition-colors border-b border-gray-800">
                <td className="px-6 py-4 text-sm text-gray-300">
                  <span className="font-semibold text-white block">ID: {log.actorId}</span>
                  <Badge variant="muted">{log.actorRole || 'moderator'}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {log.action.replace('_', ' ').toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">{log.targetType}</span>
                  <span className="font-mono text-xs text-gray-400">{log.targetId}</span>
                  {log.roomId && <span className="block text-[10px] text-gray-500 font-mono">Sala: {log.roomId}</span>}
                  {log.liveId && <span className="block text-[10px] text-gray-500 font-mono">Live: {log.liveId}</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 max-w-sm">
                  {log.reason ? (
                    <p className="text-gray-200">{log.reason}</p>
                  ) : (
                    <p className="text-gray-500 italic">Sin motivo especificado</p>
                  )}
                  {log.reportId && (
                    <span className="inline-block bg-purple-950/40 border border-purple-800/30 text-purple-300 rounded px-1.5 py-0.5 text-[10px] mt-1">
                      Reporte: {log.reportId}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                  {log.createdAt?._seconds ? new Date(log.createdAt._seconds * 1000).toLocaleString('es') : '—'}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
