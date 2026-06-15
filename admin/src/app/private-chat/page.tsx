'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

interface SummaryStats {
  activeConversations: number;
  pendingRequests: number;
  totalReportedMessages: number;
}

interface ReportedUser {
  userId: string;
  count: number;
  username: string;
  displayName: string;
  photoURL: string;
  status: string;
}

interface AdminPrivateChatSummary {
  summary: SummaryStats;
  topReportedUsers: ReportedUser[];
}

export default function PrivateChatAdminPage() {
  const [data, setData] = useState<AdminPrivateChatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Message Context State
  const [searchMessageId, setSearchMessageId] = useState('');
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [reportContext, setReportContext] = useState<any>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/private-chat/summary');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error al cargar resumen de chats privados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleFetchContext = async (messageId: string) => {
    if (!messageId) return;
    setContextLoading(true);
    setContextError(null);
    setReportContext(null);
    try {
      const res = await api.get(`/api/admin/private-chat/reported-message/${messageId}/context`);
      setReportContext(res);
    } catch (err: any) {
      setContextError(err.message || 'No se pudo obtener el contexto del mensaje.');
    } finally {
      setContextLoading(false);
    }
  };

  const handleHideMessage = async (messageId: string, conversationId: string) => {
    try {
      await api.post(`/api/admin/private-chat/messages/${messageId}/hide`, { conversationId });
      alert('Mensaje ocultado correctamente.');
      // Refresh current report details
      if (searchMessageId === messageId) {
        handleFetchContext(messageId);
      }
      fetchSummary();
    } catch (err: any) {
      alert('Error al ocultar mensaje: ' + err.message);
    }
  };

  return (
    <AdminLayout title="Monitoreo de Chat Privado">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mensajes Privados 1 a 1</h1>
          <p className="mt-1 text-sm text-gray-400">
            Revisión de métricas, solicitudes de chat y moderación de mensajes reportados.
          </p>
        </div>

        {loading && <LoadingState message="Cargando resumen del sistema de chat..." />}
        {error && <ErrorState message={error} onRetry={fetchSummary} />}

        {data && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                title="Chats Activos"
                value={data.summary.activeConversations}
                icon="💬"
                color="violet"
                subText="Conversaciones activas 1 a 1"
              />
              <StatCard
                title="Solicitudes Pendientes"
                value={data.summary.pendingRequests}
                icon="📨"
                color="blue"
                subText="Esperando aprobación"
              />
              <StatCard
                title="Mensajes Reportados"
                value={data.summary.totalReportedMessages}
                icon="🚨"
                color="red"
                subText="Total reportados acumulados"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top Reported Spammers */}
              <Card className="border-gray-800 bg-gray-900/50 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Usuarios más Reportados</h2>
                {data.topReportedUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay reportes de chats privados acumulados.</p>
                ) : (
                  <div className="space-y-4">
                    {data.topReportedUsers.map(u => (
                      <div key={u.userId} className="flex items-center justify-between border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.username} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center text-white">👤</div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-white">{u.displayName}</p>
                            <p className="text-xs text-gray-500">@{u.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                            {u.count} reportes
                          </span>
                          <p className="text-[10px] text-gray-500 mt-1 capitalize">Estado: {u.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Context Moderation Search */}
              <Card className="border-gray-800 bg-gray-900/50 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Revisar Mensaje Reportado</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingresa el ID del mensaje reportado..."
                    value={searchMessageId}
                    onChange={e => setSearchMessageId(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleFetchContext(searchMessageId)}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 transition"
                  >
                    Buscar Contexto
                  </button>
                </div>

                {contextLoading && <div className="mt-4 text-sm text-gray-500">Consultando base de datos...</div>}
                {contextError && <div className="mt-4 text-sm text-red-400">{contextError}</div>}

                {reportContext && (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-lg bg-gray-950 p-4 border border-gray-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-violet-400">Razón del reporte:</span>
                        <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          {reportContext.report.reason}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">"{reportContext.report.description}"</p>
                    </div>

                    <h3 className="text-sm font-bold text-gray-400 mb-2">Contexto de la conversación (últimos 11 mensajes):</h3>
                    <div className="space-y-2 rounded-lg bg-gray-950 p-3 max-h-60 overflow-y-auto border border-gray-800">
                      {reportContext.context.map((msg: any) => {
                        const isReported = msg.id === reportContext.targetMessage.id;
                        return (
                          <div
                            key={msg.id}
                            className={`p-2 rounded text-xs leading-relaxed ${
                              isReported
                                ? 'bg-red-950/30 border border-red-500/30'
                                : 'bg-gray-900/50'
                            }`}
                          >
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                              <span className="font-bold text-gray-400">Remitente: {msg.senderId}</span>
                              <span>{new Date(msg.createdAt?._seconds ? msg.createdAt._seconds * 1000 : msg.createdAt).toLocaleTimeString()}</span>
                            </div>
                            {msg.hiddenByAdmin ? (
                              <p className="italic text-gray-600">[Ocultado por Admin]</p>
                            ) : msg.type === 'emoji' ? (
                              <p className="text-lg">{msg.emoji}</p>
                            ) : (
                              <p className="text-gray-300">{msg.text}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleHideMessage(reportContext.targetMessage.id, reportContext.targetMessage.conversationId)}
                        disabled={reportContext.targetMessage.hiddenByAdmin}
                        className="flex-1 rounded bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500"
                      >
                        {reportContext.targetMessage.hiddenByAdmin ? 'Mensaje Ocultado' : 'Ocultar Mensaje'}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
