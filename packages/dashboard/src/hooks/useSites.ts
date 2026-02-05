'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

export interface Site {
  id: string;
  site_id: string;
  name: string;
  role: string;
  created_at: string;
}

const SELECTED_SITE_KEY = 'open-observability:selected-site';

export function useSites() {
  const { supabase, user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SELECTED_SITE_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const fetchSites = useCallback(async () => {
    if (!user) {
      setSites([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc('get_user_sites');
    if (error) {
      console.error('Failed to fetch sites:', error.message);
      setSites([]);
    } else {
      const fetched = (data ?? []) as Site[];
      setSites(fetched);

      // Auto-select: persisted selection, or first site
      if (fetched.length > 0) {
        const stored = localStorage.getItem(SELECTED_SITE_KEY);
        const match = fetched.find((s) => s.site_id === stored);
        if (match) {
          setSelectedSiteId(match.site_id);
        } else {
          setSelectedSiteId(fetched[0].site_id);
          localStorage.setItem(SELECTED_SITE_KEY, fetched[0].site_id);
        }
      } else {
        setSelectedSiteId(null);
      }
    }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const selectSite = useCallback((siteId: string) => {
    setSelectedSiteId(siteId);
    localStorage.setItem(SELECTED_SITE_KEY, siteId);
  }, []);

  const createSite = useCallback(
    async (siteId: string, name: string) => {
      const { error } = await supabase.rpc('create_site', {
        p_site_id: siteId,
        p_name: name,
      });

      if (error) {
        throw new Error(error.message);
      }

      await fetchSites();
      selectSite(siteId);
    },
    [supabase, fetchSites, selectSite],
  );

  return {
    sites,
    selectedSiteId,
    selectSite,
    createSite,
    loading,
    refresh: fetchSites,
  };
}
