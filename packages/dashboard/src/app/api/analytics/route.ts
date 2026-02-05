/**
 * API route for fetching analytics data.
 *
 * This is a server-side route that uses the SDK to query Supabase.
 * The dashboard client fetches data through this endpoint to keep
 * the service role key on the server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDateRange } from '@open-observability/sdk';
import type { TimeRange } from '@open-observability/sdk';
import { getAnalyticsClient, getSiteId } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const timeRange = (searchParams.get('range') || '24h') as TimeRange;
  const siteId = searchParams.get('siteId') || getSiteId();

  try {
    const client = getAnalyticsClient();
    const dateRange = getDateRange(timeRange);

    // Determine interval based on time range
    const interval: 'hour' | 'day' =
      timeRange === '1h' || timeRange === '24h' ? 'hour' : 'day';

    // Fetch all data in parallel
    const [stats, timeSeries, topPages, topReferrers, devices, vitals] =
      await Promise.all([
        client.getStats(siteId, dateRange),
        client.getPageViewTimeSeries(siteId, dateRange, interval),
        client.getTopPages(siteId, dateRange, 10),
        client.getTopReferrers(siteId, dateRange, 10),
        client.getDeviceBreakdown(siteId, dateRange),
        client.getVitalsSummary(siteId, dateRange),
      ]);

    return NextResponse.json({
      stats: {
        totalViews: stats.total_views,
        uniqueVisitors: stats.unique_visitors,
        avgTimeOnPage: stats.avg_time_on_page,
        bounceRate: stats.bounce_rate,
      },
      timeSeries,
      topPages,
      topReferrers: topReferrers,
      devices,
      vitals,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 },
    );
  }
}
