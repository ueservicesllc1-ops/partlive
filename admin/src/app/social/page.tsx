'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

interface FollowLog {
  id: string;
  followerId: string;
  followingId: string;
  status: string;
  createdAt: any;
}

interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  type: string;
  title: string;
  description: string;
  createdAt: any;
}

export default function AdminSocialPage() {
  const [follows, setFollows] = useState<FollowLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [popularHosts, setPopularHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch recent follows
      const followsSnap = await getDocs(
        query(collection(db, 'follows'), orderBy('createdAt', 'desc'), limit(10))
      );
      setFollows(
        followsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            followerId: data.followerId || '',
            followingId: data.followingId || '',
            status: data.status || 'active',
            createdAt: data.createdAt,
          };
        })
      );

      // Fetch recent activities
      const activitiesSnap = await getDocs(
        query(collection(db, 'socialActivities'), orderBy('createdAt', 'desc'), limit(15))
      );
      setActivities(
        activitiesSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || '',
            username: data.username || 'Usuario',
            type: data.type || '',
            title: data.title || '',
            description: data.description || '',
            createdAt: data.createdAt,
          };
        })
      );

      // Fetch most followed hosts
      const hostsSnap = await getDocs(
        query(collection(db, 'users'), orderBy('followersCount', 'desc'), limit(5))
      );
      setPopularHosts(
        hostsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || data.username || 'Host',
            username: data.username || '',
            followersCount: data.followersCount || 0,
            isHost: !!data.isHost,
          };
        })
      );
    } catch (err) {
      console.error('Error fetching admin social data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AdminLayout title="Panel Social">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Monitoreo de Actividad Social</h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm font-semibold"
          >
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando métricas...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent activities */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="text-lg font-bold text-white mb-4">📢 Feed de Actividad Global</h2>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No hay actividades recientes.</p>
                  ) : (
                    activities.map(act => (
                      <div
                        key={act.id}
                        className="p-3 bg-gray-950 border border-gray-800/40 rounded-xl space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-violet-400">@{act.username}</span>
                          <span className="text-[10px] text-gray-500">
                            {act.createdAt ? new Date(act.createdAt.toDate()).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white">{act.title}</p>
                        <p className="text-xs text-gray-400">{act.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Side columns */}
            <div className="space-y-6">
              {/* Popular Hosts */}
              <Card>
                <h2 className="text-lg font-bold text-white mb-4">👑 Hosts Más Populares</h2>
                <div className="space-y-3">
                  {popularHosts.map((host, idx) => (
                    <div
                      key={host.id}
                      className="flex justify-between items-center p-2.5 bg-gray-950 border border-gray-850 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-bold">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{host.displayName}</p>
                          <p className="text-xs text-gray-500">@{host.username}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-violet-400">
                        👥 {host.followersCount} seguidores
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent follows list */}
              <Card>
                <h2 className="text-lg font-bold text-white mb-4">👤 Nuevas Conexiones</h2>
                <div className="space-y-3">
                  {follows.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No hay nuevos seguidores.</p>
                  ) : (
                    follows.map(flw => (
                      <div key={flw.id} className="text-xs text-gray-400 p-2 bg-gray-950 rounded-lg border border-gray-850">
                        <span className="font-bold text-white font-mono">{flw.followerId.substring(0, 6)}</span> comenzó a seguir a <span className="font-bold text-white font-mono">{flw.followingId.substring(0, 6)}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
