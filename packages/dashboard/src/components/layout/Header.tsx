'use client';

import React from 'react';
import type { TimeRangeOption } from '@/types';
import { getTimeRangeLabel } from '@/lib/format';

interface HeaderProps {
  siteId: string;
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
}

const TIME_RANGES: TimeRangeOption[] = ['1h', '24h', '7d', '30d', '90d'];

export function Header({ siteId, timeRange, onTimeRangeChange }: HeaderProps) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">open-observability</h1>
          <span className="rounded-md bg-[var(--color-muted)] px-2.5 py-1 text-sm font-medium text-[var(--color-muted-foreground)]">
            {siteId}
          </span>
        </div>

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
      </div>
    </header>
  );
}
