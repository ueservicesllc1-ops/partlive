'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  doc,
  addDoc,
  deleteDoc,
  writeBatch,
  orderBy,
  limit,
} from 'firebase/firestore';

interface BlockedTerm {
  id: string;
  term: string;
  reason: string;
  isActive: boolean;
  createdAt: any;
}

interface TrendingSearch {
  id: string;
  query: string;
  count: number;
  country?: string;
  language?: string;
}

export default function SearchConfigPage() {
  const [blockedTerms, setBlockedTerms] = useState<BlockedTerm[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTerm, setNewTerm] = useState('');
  const [newReason, setNewReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch blocked terms
      const blockedSnap = await getDocs(query(collection(db, 'blockedSearchTerms')));
      const terms: BlockedTerm[] = blockedSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          term: data.term || '',
          reason: data.reason || '',
          isActive: !!data.isActive,
          createdAt: data.createdAt,
        };
      });
      setBlockedTerms(terms);

      // Fetch trending searches
      const trendingSnap = await getDocs(
        query(collection(db, 'trendingSearches'), orderBy('count', 'desc'), limit(15))
      );
      const trendings: TrendingSearch[] = trendingSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          query: data.query || '',
          count: data.count || 0,
          country: data.country,
          language: data.language,
        };
      });
      setTrendingSearches(trendings);
    } catch (err) {
      console.error('Error fetching search admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBlockedTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim()) return;

    try {
      await addDoc(collection(db, 'blockedSearchTerms'), {
        term: newTerm.trim().toLowerCase(),
        reason: newReason.trim() || 'Moderación',
        isActive: true,
        createdAt: new Date(),
      });
      setNewTerm('');
      setNewReason('');
      fetchData();
    } catch (err) {
      console.error('Error adding blocked term:', err);
    }
  };

  const handleDeleteBlockedTerm = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blockedSearchTerms', id));
      fetchData();
    } catch (err) {
      console.error('Error deleting blocked term:', err);
    }
  };

  const handleClearTrending = async () => {
    if (!confirm('¿Estás seguro de que deseas vaciar las tendencias de búsqueda?')) return;
    try {
      const snap = await getDocs(collection(db, 'trendingSearches'));
      const batch = writeBatch(db);
      snap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      fetchData();
    } catch (err) {
      console.error('Error clearing trending searches:', err);
    }
  };

  return (
    <AdminLayout title="Configuración de Búsqueda">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Configuración de Búsqueda y Filtros</h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando datos...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blocked Search Terms */}
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-bold text-white mb-4">🚫 Términos Bloqueados</h2>
                <form onSubmit={handleAddBlockedTerm} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-semibold">Término o palabra</label>
                    <input
                      type="text"
                      value={newTerm}
                      onChange={e => setNewTerm(e.target.value)}
                      placeholder="Ej: groseria"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-semibold">Razón del bloqueo</label>
                    <input
                      type="text"
                      value={newReason}
                      onChange={e => setNewReason(e.target.value)}
                      placeholder="Ej: Lenguaje ofensivo"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-bold transition"
                  >
                    Agregar Término
                  </button>
                </form>

                <div className="border-t border-gray-800/80 pt-4">
                  <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Lista de Bloqueo</h3>
                  {blockedTerms.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No hay términos bloqueados.</p>
                  ) : (
                    <div className="space-y-2">
                      {blockedTerms.map(item => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-gray-950 border border-gray-800 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-bold text-rose-400 font-mono">"{item.term}"</p>
                            <p className="text-xs text-gray-500">Razón: {item.reason}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteBlockedTerm(item.id)}
                            className="text-xs text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Trending Searches & Stats */}
            <div className="space-y-6">
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">🔥 Tendencias de Búsqueda</h2>
                  <button
                    onClick={handleClearTrending}
                    className="text-xs bg-red-600/15 text-red-400 hover:bg-red-600/25 px-3 py-1.5 rounded-lg font-bold transition"
                  >
                    Vaciar Tendencias
                  </button>
                </div>

                {trendingSearches.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-6 text-center">No hay búsquedas registradas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-500">
                          <th className="pb-2 font-semibold">Término</th>
                          <th className="pb-2 font-semibold text-center">Filtro Origen</th>
                          <th className="pb-2 font-semibold text-right">Consultas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                        {trendingSearches.map((item, index) => (
                          <tr key={item.id} className="text-gray-300">
                            <td className="py-2.5 font-medium flex items-center gap-2">
                              <span className="text-gray-500 font-bold text-xs w-4">{index + 1}</span>
                              {item.query}
                            </td>
                            <td className="py-2.5 text-center text-xs text-gray-500">
                              {item.country || '—'} / {item.language || '—'}
                            </td>
                            <td className="py-2.5 text-right font-bold text-white">{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="text-lg font-bold text-white mb-4">📈 Estadísticas de Búsqueda</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Palabras Bloqueadas</p>
                    <p className="text-2xl font-bold text-rose-500">{blockedTerms.length}</p>
                  </div>
                  <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Tendencias Únicas</p>
                    <p className="text-2xl font-bold text-violet-500">{trendingSearches.length}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
