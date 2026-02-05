'use client';

import React, { useState } from 'react';
import type { TimeRangeOption } from '@/types';
import type { Site } from '@/hooks/useSites';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { PageViewChart } from '@/components/charts/PageViewChart';
import { TopPagesTable } from '@/components/charts/TopPagesTable';
import { ReferrersTable } from '@/components/charts/ReferrersTable';
import { DeviceChart } from '@/components/charts/DeviceChart';
import { VitalsCard } from '@/components/charts/VitalsCard';
import { formatNumber, formatPercentage } from '@/lib/format';

interface DashboardProps {
  siteId: string;
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
  onCreateSite: (siteId: string, name: string) => Promise<void>;
}

export function Dashboard({
  siteId,
  sites,
  selectedSiteId,
  onSelectSite,
  onCreateSite,
}: DashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('24h');
  const { data, loading, error } = useAnalytics(siteId, timeRange);

  const interval: 'hour' | 'day' =
    timeRange === '1h' || timeRange === '24h' ? 'hour' : 'day';

  return (
    <div className="min-h-screen">
      <Header
        siteId={siteId}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSelectSite={onSelectSite}
        onCreateSite={onCreateSite}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : data.stats.totalViews === 0 && data.vitals.length === 0 ? (
          <EmptyState
            title="No analytics data yet"
            description="Add the tracking script to your website to start collecting metrics. Check the README for setup instructions."
          />
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <section>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Page Views"
                  value={formatNumber(data.stats.totalViews)}
                />
                <StatCard
                  label="Unique Visitors"
                  value={formatNumber(data.stats.uniqueVisitors)}
                />
                <StatCard
                  label="Bounce Rate"
                  value={
                    data.stats.bounceRate !== null
                      ? formatPercentage(data.stats.bounceRate)
                      : '--'
                  }
                  subtitle={data.stats.bounceRate === null ? 'Not enough data' : undefined}
                />
                <StatCard
                  label="Avg. Time on Page"
                  value={
                    data.stats.avgTimeOnPage !== null
                      ? `${Math.round(data.stats.avgTimeOnPage)}s`
                      : '--'
                  }
                  subtitle={data.stats.avgTimeOnPage === null ? 'Not enough data' : undefined}
                />
              </div>
            </section>

            {/* Page Views Chart */}
            <section>
              <div className="card">
                <h2 className="mb-4 text-lg font-semibold">Page Views</h2>
                <PageViewChart data={data.timeSeries} interval={interval} />
              </div>
            </section>

            {/* Top Pages & Referrers */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="card">
                <h2 className="mb-4 text-lg font-semibold">Top Pages</h2>
                <TopPagesTable pages={data.topPages} />
              </div>
              <div className="card">
                <h2 className="mb-4 text-lg font-semibold">Top Referrers</h2>
                <ReferrersTable referrers={data.topReferrers} />
              </div>
            </section>

            {/* Web Vitals & Devices */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="card lg:col-span-2">
                <h2 className="mb-4 text-lg font-semibold">Web Vitals</h2>
                <VitalsCard vitals={data.vitals} />
              </div>
              <div className="card">
                <h2 className="mb-4 text-lg font-semibold">Devices</h2>
                <DeviceChart data={data.devices} />
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Powered by{' '}
        <a
          href="https://github.com/open-observability/open-observability"
          className="font-medium text-brand-500 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          open-observability
        </a>
      </footer>
    </div>
  );
}
