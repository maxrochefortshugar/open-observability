'use client';

import React from 'react';
import { formatNumber } from '@/lib/format';

interface ReferrersTableProps {
  referrers: Array<{
    referrer: string;
    count: number;
  }>;
}

export function ReferrersTable({ referrers }: ReferrersTableProps) {
  if (referrers.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        No referrer data available
      </div>
    );
  }

  const maxCount = Math.max(...referrers.map((r) => r.count));

  return (
    <div className="space-y-2">
      {referrers.map((ref, index) => {
        let displayName = ref.referrer;
        try {
          if (ref.referrer.startsWith('http')) {
            const url = new URL(ref.referrer);
            displayName = url.hostname;
          }
        } catch {
          // Keep as-is
        }

        return (
          <div key={ref.referrer} className="group relative">
            <div
              className="absolute inset-y-0 left-0 rounded bg-green-500/10 transition-all group-hover:bg-green-500/15"
              style={{ width: `${(ref.count / maxCount) * 100}%` }}
            />
            <div className="relative flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="w-5 text-xs text-[var(--color-muted-foreground)]">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{displayName}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatNumber(ref.count)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
