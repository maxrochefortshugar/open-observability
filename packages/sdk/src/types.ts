/**
 * Shared types for the open-observability SDK.
 */

/**
 * Time range filter for queries.
 */
export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Page view record as stored in the database.
 */
export interface PageView {
  id: string;
  site_id: string;
  url: string;
  pathname: string;
  referrer: string;
  title: string;
  screen_width: number;
  timezone: string;
  language: string;
  connection_type: string | null;
  page_view_id: string;
  tracker_version: string;
  created_at: string;
}

/**
 * Web Vital record as stored in the database.
 */
export interface WebVital {
  id: string;
  site_id: string;
  url: string;
  pathname: string;
  metric_name: string;
  metric_value: number;
  metric_rating: 'good' | 'needs-improvement' | 'poor';
  metric_id: string;
  navigation_type: string | null;
  tracker_version: string;
  created_at: string;
}

/**
 * Error record as stored in the database.
 */
export interface ErrorRecord {
  id: string;
  site_id: string;
  url: string;
  pathname: string;
  message: string;
  stack: string | null;
  source: string | null;
  line: number | null;
  column_number: number | null;
  tracker_version: string;
  created_at: string;
}

/**
 * Custom event record as stored in the database.
 */
export interface CustomEventRecord {
  id: string;
  site_id: string;
  url: string;
  pathname: string;
  event_name: string;
  properties: Record<string, string | number | boolean> | null;
  tracker_version: string;
  created_at: string;
}

/**
 * Aggregated page view statistics.
 */
export interface PageViewStats {
  total_views: number;
  unique_visitors: number;
  avg_time_on_page: number | null;
  bounce_rate: number | null;
}

/**
 * Page view time series data point.
 */
export interface TimeSeriesPoint {
  timestamp: string;
  count: number;
}

/**
 * Top page with view count.
 */
export interface TopPage {
  pathname: string;
  count: number;
}

/**
 * Referrer with count.
 */
export interface TopReferrer {
  referrer: string;
  count: number;
}

/**
 * Device category breakdown.
 */
export interface DeviceBreakdown {
  category: 'mobile' | 'tablet' | 'desktop';
  count: number;
  percentage: number;
}

/**
 * Web Vitals summary for a metric.
 */
export interface VitalSummary {
  metric_name: string;
  p50: number;
  p75: number;
  p95: number;
  good_count: number;
  needs_improvement_count: number;
  poor_count: number;
  total_count: number;
}

/**
 * Backend interface. Allows swapping Supabase for other backends
 * in the future.
 */
export interface AnalyticsBackend {
  /**
   * Query page views within a date range.
   */
  getPageViews(siteId: string, range: DateRange, limit?: number): Promise<PageView[]>;

  /**
   * Get page view time series data, bucketed by interval.
   */
  getPageViewTimeSeries(
    siteId: string,
    range: DateRange,
    interval: 'hour' | 'day',
  ): Promise<TimeSeriesPoint[]>;

  /**
   * Get top pages by view count.
   */
  getTopPages(siteId: string, range: DateRange, limit?: number): Promise<TopPage[]>;

  /**
   * Get top referrers.
   */
  getTopReferrers(siteId: string, range: DateRange, limit?: number): Promise<TopReferrer[]>;

  /**
   * Get device category breakdown.
   */
  getDeviceBreakdown(siteId: string, range: DateRange): Promise<DeviceBreakdown[]>;

  /**
   * Get Web Vitals summary.
   */
  getVitalsSummary(siteId: string, range: DateRange): Promise<VitalSummary[]>;

  /**
   * Get recent errors.
   */
  getErrors(siteId: string, range: DateRange, limit?: number): Promise<ErrorRecord[]>;

  /**
   * Get custom events.
   */
  getCustomEvents(
    siteId: string,
    range: DateRange,
    eventName?: string,
    limit?: number,
  ): Promise<CustomEventRecord[]>;

  /**
   * Get overall stats for the period.
   */
  getStats(siteId: string, range: DateRange): Promise<PageViewStats>;
}
