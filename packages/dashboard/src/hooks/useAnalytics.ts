'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createAnalyticsClient, getDateRange } from '@open-observability/sdk';
import type { AnalyticsBackend } from '@open-observability/sdk';
import { useAuth } from '@/components/providers/AuthProvider';
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
  const { supabase } = useAuth();
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<AnalyticsBackend | null>(null);

  // Create SDK client once using the authenticated Supabase client
  if (!clientRef.current) {
    clientRef.current = createAnalyticsClient({
      backend: 'supabase',
      client: supabase,
    });
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const client = clientRef.current!;
      const dateRange = getDateRange(timeRange);
      const interval: 'hour' | 'day' =
        timeRange === '1h' || timeRange === '24h' ? 'hour' : 'day';

      const [stats, timeSeries, topPages, topReferrers, devices, vitals] =
        await Promise.all([
          client.getStats(siteId, dateRange),
          client.getPageViewTimeSeries(siteId, dateRange, interval),
          client.getTopPages(siteId, dateRange, 10),
          client.getTopReferrers(siteId, dateRange, 10),
          client.getDeviceBreakdown(siteId, dateRange),
          client.getVitalsSummary(siteId, dateRange),
        ]);

      setData({
        stats: {
          totalViews: stats.total_views,
          uniqueVisitors: stats.unique_visitors,
          avgTimeOnPage: stats.avg_time_on_page,
          bounceRate: stats.bounce_rate,
        },
        timeSeries,
        topPages,
        topReferrers,
        devices,
        vitals,
      });
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
