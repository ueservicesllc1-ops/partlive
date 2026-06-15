import { useState, useEffect } from 'react';
import { agencyApi } from '../services/api/agencyApi';
import { Agency, AgencyHost } from '../types/agency';
import { subscribeToAgency, subscribeToAgencyHosts } from '../services/firebase/firestore/agencyService';

export const useAgencyDashboard = (agencyId?: string) => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [hostsLinks, setHostsLinks] = useState<AgencyHost[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial dashboard metrics from the API
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agencyApi.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar el dashboard de la agencia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Listen to live database changes if agencyId is available
  useEffect(() => {
    if (!agencyId) return;

    const unsubAgency = subscribeToAgency(agencyId, (updated) => {
      setAgency(updated);
    });

    const unsubHosts = subscribeToAgencyHosts(agencyId, (updatedList) => {
      setHostsLinks(updatedList);
    });

    return () => {
      unsubAgency();
      unsubHosts();
    };
  }, [agencyId]);

  return {
    agency,
    hostsLinks,
    dashboardData,
    loading,
    error,
    refresh: fetchDashboard,
  };
};
