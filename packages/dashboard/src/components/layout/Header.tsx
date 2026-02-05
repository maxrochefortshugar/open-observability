'use client';

import React from 'react';
import type { TimeRangeOption } from '@/types';
import type { Site } from '@/hooks/useSites';
import { getTimeRangeLabel } from '@/lib/format';
import { useAuth } from '@/components/providers/AuthProvider';
import { SiteSelector } from '@/components/layout/SiteSelector';

interface HeaderProps {
  siteId: string;
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
  onCreateSite: (siteId: string, name: string) => Promise<void>;
}

const TIME_RANGES: TimeRangeOption[] = ['1h', '24h', '7d', '30d', '90d'];

export function Header({
  timeRange,
  onTimeRangeChange,
  sites,
  selectedSiteId,
  onSelectSite,
  onCreateSite,
}: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">open-observability</h1>
          <SiteSelector
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelect={onSelectSite}
            onCreateSite={onCreateSite}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-lg bg-[var(--color-muted)] p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {getTimeRangeLabel(range)}
              </button>
            ))}
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="rounded-md px-2.5 py-1.5 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
