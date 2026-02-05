/**
 * Supabase backend implementation for open-observability.
 *
 * Queries the Supabase database (and its built-in RPC functions)
 * to retrieve analytics data. This is the default and initially
 * only supported backend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  AnalyticsBackend,
  DateRange,
  PageView,
  TimeSeriesPoint,
  TopPage,
  TopReferrer,
  DeviceBreakdown,
  VitalSummary,
  ErrorRecord,
  CustomEventRecord,
  PageViewStats,
} from '../types';

export interface SupabaseBackendConfig {
  /**
   * Supabase project URL.
   * Example: "https://<project>.supabase.co"
   */
  supabaseUrl: string;

  /**
   * Supabase service role key (for server-side usage) or anon key.
   */
  supabaseKey: string;
}

export class SupabaseBackend implements AnalyticsBackend {
  private client: SupabaseClient;

  constructor(config: SupabaseBackendConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseKey);
  }

  async getPageViews(siteId: string, range: DateRange, limit = 100): Promise<PageView[]> {
    const { data, error } = await this.client
      .from('page_views')
      .select('*')
      .eq('site_id', siteId)
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch page views: ${error.message}`);
    return data ?? [];
  }

  async getPageViewTimeSeries(
    siteId: string,
    range: DateRange,
    interval: 'hour' | 'day',
  ): Promise<TimeSeriesPoint[]> {
    const { data, error } = await this.client.rpc('get_pageview_timeseries', {
      p_site_id: siteId,
      p_from: range.from.toISOString(),
      p_to: range.to.toISOString(),
      p_interval: interval,
    });

    if (error) throw new Error(`Failed to fetch time series: ${error.message}`);
    return (data ?? []).map((row: { bucket: string; count: number }) => ({
      timestamp: row.bucket,
      count: Number(row.count),
    }));
  }

  async getTopPages(siteId: string, range: DateRange, limit = 10): Promise<TopPage[]> {
    const { data, error } = await this.client.rpc('get_top_pages', {
      p_site_id: siteId,
      p_from: range.from.toISOString(),
      p_to: range.to.toISOString(),
      p_limit: limit,
    });

    if (error) throw new Error(`Failed to fetch top pages: ${error.message}`);
    return (data ?? []).map((row: { pathname: string; count: number }) => ({
      pathname: row.pathname,
      count: Number(row.count),
    }));
  }

  async getTopReferrers(siteId: string, range: DateRange, limit = 10): Promise<TopReferrer[]> {
    const { data, error } = await this.client.rpc('get_top_referrers', {
      p_site_id: siteId,
      p_from: range.from.toISOString(),
      p_to: range.to.toISOString(),
      p_limit: limit,
    });

    if (error) throw new Error(`Failed to fetch top referrers: ${error.message}`);
    return (data ?? []).map((row: { referrer: string; count: number }) => ({
      referrer: row.referrer || '(direct)',
      count: Number(row.count),
    }));
  }

  async getDeviceBreakdown(siteId: string, range: DateRange): Promise<DeviceBreakdown[]> {
    const { data, error } = await this.client.rpc('get_device_breakdown', {
      p_site_id: siteId,
      p_from: range.from.toISOString(),
      p_to: range.to.toISOString(),
    });

    if (error) throw new Error(`Failed to fetch device breakdown: ${error.message}`);

    const rows = (data ?? []) as Array<{ category: string; count: number }>;
    const total = rows.reduce((sum, row) => sum + Number(row.count), 0);

    return rows.map((row) => ({
      category: row.category as 'mobile' | 'tablet' | 'desktop',
      count: Number(row.count),
      percentage: total > 0 ? Math.round((Number(row.count) / total) * 10000) / 100 : 0,
    }));
  }

  async getVitalsSummary(siteId: string, range: DateRange): Promise<VitalSummary[]> {
    const { data, error } = await this.client.rpc('get_vitals_summary', {
      p_site_id: siteId,
      p_from: range.from.toISOString(),
      p_to: range.to.toISOString(),
    });

    if (error) throw new Error(`Failed to fetch vitals summary: ${error.message}`);
    return (data ?? []).map(
      (row: {
        metric_name: string;
        p50: number;
        p75: number;
        p95: number;
        good_count: number;
        needs_improvement_count: number;
        poor_count: number;
        total_count: number;
      }) => ({
        metric_name: row.metric_name,
        p50: Number(row.p50),
        p75: Number(row.p75),
        p95: Number(row.p95),
        good_count: Number(row.good_count),
        needs_improvement_count: Number(row.needs_improvement_count),
        poor_count: Number(row.poor_count),
        total_count: Number(row.total_count),
      }),
    );
  }

  async getErrors(siteId: string, range: DateRange, limit = 50): Promise<ErrorRecord[]> {
    const { data, error } = await this.client
      .from('errors')
      .select('*')
      .eq('site_id', siteId)
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch errors: ${error.message}`);
    return data ?? [];
  }

  async getCustomEvents(
    siteId: string,
    range: DateRange,
    eventName?: string,
    limit = 100,
  ): Promise<CustomEventRecord[]> {
    let query = this.client
      .from('custom_events')
      .select('*')
      .eq('site_id', siteId)
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString());

    if (eventName) {
      query = query.eq('event_name', eventName);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch custom events: ${error.message}`);
    return data ?? [];
  }

  async getStats(siteId: string, range: DateRange): Promise<PageViewStats> {
    const { data, error } = await this.client.rpc('get_page_view_stats', {
      p_site_id: siteId,
      p_from: range.from.toISOString(),
      p_to: range.to.toISOString(),
    });

    if (error) throw new Error(`Failed to fetch stats: ${error.message}`);

    const row = data?.[0] ?? {
      total_views: 0,
      unique_visitors: 0,
      avg_time_on_page: null,
      bounce_rate: null,
    };

    return {
      total_views: Number(row.total_views),
      unique_visitors: Number(row.unique_visitors),
      avg_time_on_page: row.avg_time_on_page ? Number(row.avg_time_on_page) : null,
      bounce_rate: row.bounce_rate ? Number(row.bounce_rate) : null,
    };
  }
}
