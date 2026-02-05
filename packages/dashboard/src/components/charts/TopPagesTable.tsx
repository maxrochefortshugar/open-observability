'use client';

import React from 'react';
import { formatNumber } from '@/lib/format';

interface TopPagesTableProps {
  pages: Array<{
    pathname: string;
    count: number;
  }>;
}

export function TopPagesTable({ pages }: TopPagesTableProps) {
  if (pages.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        No page data available
      </div>
    );
  }

  const maxCount = Math.max(...pages.map((p) => p.count));

  return (
    <div className="space-y-2">
      {pages.map((page, index) => (
        <div key={page.pathname} className="group relative">
          {/* Background bar */}
          <div
            className="absolute inset-y-0 left-0 rounded bg-brand-500/10 transition-all group-hover:bg-brand-500/15"
            style={{ width: `${(page.count / maxCount) * 100}%` }}
          />
          <div className="relative flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="w-5 text-xs text-[var(--color-muted-foreground)]">
                {index + 1}
              </span>
              <span className="text-sm font-medium">{page.pathname}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatNumber(page.count)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
