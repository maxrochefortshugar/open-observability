'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {subtitle && (
        <span className="text-xs text-[var(--color-muted-foreground)]">{subtitle}</span>
      )}
    </div>
  );
}
