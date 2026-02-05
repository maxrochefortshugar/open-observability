/**
 * Dashboard-specific types.
 */

export type TimeRangeOption = '1h' | '24h' | '7d' | '30d' | '90d';

export interface DashboardData {
  stats: {
    totalViews: number;
    uniqueVisitors: number;
    avgTimeOnPage: number | null;
    bounceRate: number | null;
  };
  timeSeries: Array<{
    timestamp: string;
    count: number;
  }>;
  topPages: Array<{
    pathname: string;
    count: number;
  }>;
  topReferrers: Array<{
    referrer: string;
    count: number;
  }>;
  devices: Array<{
    category: 'mobile' | 'tablet' | 'desktop';
    count: number;
    percentage: number;
  }>;
  vitals: Array<{
    metric_name: string;
    p50: number;
    p75: number;
    p95: number;
    good_count: number;
    needs_improvement_count: number;
    poor_count: number;
    total_count: number;
  }>;
}
