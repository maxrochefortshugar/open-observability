'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate, formatNumber } from '@/lib/format';

interface PageViewChartProps {
  data: Array<{
    timestamp: string;
    count: number;
  }>;
  interval: 'hour' | 'day';
}

export function PageViewChart({ data, interval }: PageViewChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        No data available for this period
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0c93e8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#0c93e8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(val: string) => formatDate(val, interval === 'hour')}
            tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(val: number) => formatNumber(val)}
            tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelFormatter={(val: string) => formatDate(val, true)}
            formatter={(value: number) => [formatNumber(value), 'Page Views']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#0c93e8"
            strokeWidth={2}
            fill="url(#colorViews)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
