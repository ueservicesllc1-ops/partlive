'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Extras';
import { moderationAdminApi } from '@/services/moderationAdminApi';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Resolution Modal State
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [resolutionAction, setResolutionAction] = useState('resolve_report');
  const [resolutionNote, setResolutionNote] = useState('');
  const [durationHours, setDurationHours] = useState('24');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await moderationAdminApi.getReports({ status: statusFilter || undefined });
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleStartReview = async (reportId: string) => {
    setActionLoading(`reviewing-${reportId}`);
    try {
      await moderationAdminApi.reviewReport(reportId);
      await fetchReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenResolveModal = (report: any) => {
    setSelectedReport(report);
    setResolutionNote('');
    setResolutionAction('resolve_report');
    setResolutionModalOpen(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setActionLoading(`resolving-${selectedReport.id}`);
    try {
      // 1. Take the selected moderation action first
      const targetId = selectedReport.targetId;
      const reportId = selectedReport.id;
      const note = resolutionNote || 'Resuelto desde panel de control';

      if (resolutionAction === 'warn_user' && selectedReport.targetType === 'user') {
        await moderationAdminApi.warnUser(targetId, note, reportId);
      } else if (resolutionAction === 'suspend_user' && selectedReport.targetType === 'user') {
        await moderationAdminApi.suspendUser(targetId, note, parseInt(durationHours) || 24, reportId);
      } else if (resolutionAction === 'ban_user' && selectedReport.targetType === 'user') {
        await moderationAdminApi.banUser(targetId, note, reportId);
      } else if (resolutionAction === 'hide_message' && selectedReport.targetType === 'message') {
        if (!selectedReport.roomId && !selectedReport.liveId) {
          throw new Error('No se especificó la sala o live de procedencia del mensaje.');
        }
        const parentId = selectedReport.roomId || selectedReport.liveId;
        const parentType = selectedReport.roomId ? 'room' : 'live';
        await moderationAdminApi.hideMessage(parentType, parentId, targetId, note, reportId);
      } else if (resolutionAction === 'close_room' && selectedReport.targetType === 'room') {
        await moderationAdminApi.closeRoom(targetId, note, reportId);
      } else if (resolutionAction === 'suspend_room' && selectedReport.targetType === 'room') {
        await moderationAdminApi.suspendRoom(targetId, note, reportId);
      } else if (resolutionAction === 'end_live' && selectedReport.targetType === 'live') {
        await moderationAdminApi.endLive(targetId, note, reportId);
      } else if (resolutionAction === 'lock_wallet') {
        const ownerId = selectedReport.targetOwnerId || selectedReport.targetId;
        await moderationAdminApi.lockWallet(ownerId, note, reportId);
      }

      // 2. Resolve the report
      await moderationAdminApi.resolveReport(selectedReport.id, resolutionAction, note);
      setResolutionModalOpen(false);
      await fetchReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reportId: string) => {
    const note = prompt('Ingresa un motivo de rechazo (opcional):');
    if (note === null) return; // cancelled

    setActionLoading(`rejecting-${reportId}`);
    try {
      await moderationAdminApi.rejectReport(reportId, note || 'Rechazado por el administrador');
      await fetchReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout title="Reportes">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Reportes</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona reportes de la comunidad</p>
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
            className="w-44 bg-gray-900 border-gray-700 text-white rounded-lg"
          />
        </div>

        {loading && <LoadingState message="Cargando reportes..." />}
        {error && <ErrorState message={error} onRetry={fetchReports} />}
        {!loading && !error && reports.length === 0 && (
          <EmptyState icon="🚨" title="No hay reportes" message="No se encontraron reportes con ese filtro" />
        )}

        {!loading && !error && reports.length > 0 && (
          <Table headers={['Reportero', 'Tipo Target', 'ID Target', 'Razón', 'Estado', 'Fecha', 'Acciones']}>
            {reports.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-900/40 transition-colors border-b border-gray-800">
                <td className="px-6 py-4 text-sm text-gray-300">
                  <span className="font-semibold">{r.reporterName || 'Admin'}</span>
                  <span className="block text-xs text-gray-500">{r.reporterId}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="muted">{r.targetType}</Badge>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                  {r.targetId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  <span className="font-semibold text-white block capitalize">{r.reason.replace('_', ' ')}</span>
                  {r.description && <span className="text-xs text-gray-500 block max-w-xs truncate">{r.description}</span>}
                </td>
                <td className="px-6 py-4">
                  {r.status === 'pending' && <Badge variant="warning" dot>Pendiente</Badge>}
                  {r.status === 'reviewing' && <Badge variant="info" dot>En revisión</Badge>}
                  {r.status === 'resolved' && <Badge variant="success">Resuelto</Badge>}
                  {r.status === 'rejected' && <Badge variant="danger">Rechazado</Badge>}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {r.createdAt?._seconds ? new Date(r.createdAt._seconds * 1000).toLocaleString('es') : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 flex-wrap">
                    {r.status === 'pending' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionLoading === `reviewing-${r.id}`}
                        onClick={() => handleStartReview(r.id)}
                      >
                        Revisar
                      </Button>
                    )}
                    {(r.status === 'pending' || r.status === 'reviewing') && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          isLoading={actionLoading === `resolving-${r.id}`}
                          onClick={() => handleOpenResolveModal(r)}
                        >
                          Resolver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={actionLoading === `rejecting-${r.id}`}
                          onClick={() => handleReject(r.id)}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                    {r.status === 'resolved' && (
                      <span className="text-xs text-green-500 font-semibold">
                        Acción: {r.actionTaken || 'Resuelto'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Resolution Modal */}
      {resolutionModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md text-white shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Resolver Reporte</h2>
            <p className="text-xs text-gray-400 mb-4">
              Aplicar una acción correctiva para el reporte del tipo <span className="font-semibold text-white">{selectedReport.targetType}</span>.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Acción de Moderación</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="resolve_report">Solo resolver (Sin sanción extra)</option>
                  
                  {selectedReport.targetType === 'user' && (
                    <>
                      <option value="warn_user">Enviar advertencia al usuario</option>
                      <option value="suspend_user">Suspender cuenta temporalmente</option>
                      <option value="ban_user">Banear cuenta permanentemente</option>
                    </>
                  )}

                  {selectedReport.targetType === 'message' && (
                    <option value="hide_message">Ocultar/Eliminar Mensaje</option>
                  )}

                  {selectedReport.targetType === 'room' && (
                    <>
                      <option value="close_room">Cerrar Sala definitivamente</option>
                      <option value="suspend_room">Suspender Sala temporalmente</option>
                    </>
                  )}

                  {selectedReport.targetType === 'live' && (
                    <option value="end_live">Finalizar Live stream</option>
                  )}

                  <option value="lock_wallet">Bloquear Wallet del creador/usuario</option>
                </select>
              </div>

              {resolutionAction === 'suspend_user' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Duración (Horas)</label>
                  <input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="24"
                    min="1"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Notas de resolución</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Detalles sobre la resolución de este caso..."
                  rows={3}
                  required
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResolutionModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  isLoading={actionLoading?.startsWith('resolving-')}
                >
                  Confirmar Resolución
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
