'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatPercentage } from '@/lib/format';

interface DeviceChartProps {
  data: Array<{
    category: 'mobile' | 'tablet' | 'desktop';
    count: number;
    percentage: number;
  }>;
}

const COLORS: Record<string, string> = {
  desktop: '#0c93e8',
  mobile: '#22c55e',
  tablet: '#f59e0b',
};

const LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
};

export function DeviceChart({ data }: DeviceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        No data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: LABELS[d.category] || d.category,
    value: d.count,
    percentage: d.percentage,
    color: COLORS[d.category] || '#999',
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            formatter={(value: number, _name: string, props: { payload?: { percentage: number } }) => [
              `${value.toLocaleString()}${props.payload ? ` (${formatPercentage(props.payload.percentage)})` : ''}`,
              'Visits',
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span style={{ color: 'var(--color-foreground)', fontSize: '13px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
