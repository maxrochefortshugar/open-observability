'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TimeRangeOption, DashboardData } from '@/types';

const EMPTY_DATA: DashboardData = {
  stats: {
    totalViews: 0,
    uniqueVisitors: 0,
    avgTimeOnPage: null,
    bounceRate: null,
  },
  timeSeries: [],
  topPages: [],
  topReferrers: [],
  devices: [],
  vitals: [],
};

export function useAnalytics(siteId: string, timeRange: TimeRangeOption) {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/analytics?range=${timeRange}&siteId=${encodeURIComponent(siteId)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(message);
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }, [siteId, timeRange]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
