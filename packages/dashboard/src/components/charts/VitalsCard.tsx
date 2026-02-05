'use client';

import React from 'react';
import { formatMetricValue, formatPercentage } from '@/lib/format';

interface VitalsCardProps {
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

const VITAL_INFO: Record<string, { label: string; description: string }> = {
  LCP: {
    label: 'Largest Contentful Paint',
    description: 'Time until the largest content element is visible',
  },
  FCP: {
    label: 'First Contentful Paint',
    description: 'Time until the first content element is visible',
  },
  CLS: {
    label: 'Cumulative Layout Shift',
    description: 'Visual stability score (lower is better)',
  },
  INP: {
    label: 'Interaction to Next Paint',
    description: 'Responsiveness to user interactions',
  },
  TTFB: {
    label: 'Time to First Byte',
    description: 'Server response time',
  },
  FID: {
    label: 'First Input Delay',
    description: 'Time until first interaction is processed',
  },
};

export function VitalsCard({ vitals }: VitalsCardProps) {
  if (vitals.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        No Web Vitals data collected yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vitals.map((vital) => {
        const info = VITAL_INFO[vital.metric_name] || {
          label: vital.metric_name,
          description: '',
        };
        const goodPct =
          vital.total_count > 0 ? (vital.good_count / vital.total_count) * 100 : 0;
        const needsImpPct =
          vital.total_count > 0
            ? (vital.needs_improvement_count / vital.total_count) * 100
            : 0;
        const poorPct =
          vital.total_count > 0 ? (vital.poor_count / vital.total_count) * 100 : 0;

        return (
          <div
            key={vital.metric_name}
            className="rounded-lg border border-[var(--color-border)] p-4"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{vital.metric_name}</span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {info.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                  {info.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formatMetricValue(vital.metric_name, vital.p75)}
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">p75</div>
              </div>
            </div>

            {/* Distribution bar */}
            <div className="mb-2 flex h-2 overflow-hidden rounded-full">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${goodPct}%` }}
                title={`Good: ${formatPercentage(goodPct)}`}
              />
              <div
                className="bg-yellow-500 transition-all"
                style={{ width: `${needsImpPct}%` }}
                title={`Needs Improvement: ${formatPercentage(needsImpPct)}`}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${poorPct}%` }}
                title={`Poor: ${formatPercentage(poorPct)}`}
              />
            </div>

            {/* Percentile values */}
            <div className="flex gap-4 text-xs text-[var(--color-muted-foreground)]">
              <span>p50: {formatMetricValue(vital.metric_name, vital.p50)}</span>
              <span>p75: {formatMetricValue(vital.metric_name, vital.p75)}</span>
              <span>p95: {formatMetricValue(vital.metric_name, vital.p95)}</span>
              <span className="ml-auto">{vital.total_count.toLocaleString()} samples</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
