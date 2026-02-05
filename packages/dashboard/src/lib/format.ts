/**
 * Formatting utilities for the dashboard.
 */

/**
 * Format a number with appropriate suffixes (K, M, B).
 */
export function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K';
  }
  return value.toLocaleString();
}

/**
 * Format milliseconds into a human-readable duration.
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return ms.toFixed(3);
  }
  if (ms < 1000) {
    return Math.round(ms) + 'ms';
  }
  return (ms / 1000).toFixed(2) + 's';
}

/**
 * Format a CLS value (unitless).
 */
export function formatCLS(value: number): string {
  return value.toFixed(3);
}

/**
 * Format a web vital metric value based on its name.
 */
export function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') return formatCLS(value);
  return formatDuration(value);
}

/**
 * Format a percentage.
 */
export function formatPercentage(value: number): string {
  return value.toFixed(1) + '%';
}

/**
 * Format a date for display.
 */
export function formatDate(dateStr: string, includeTime = false): string {
  const date = new Date(dateStr);
  if (includeTime) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get a human-readable label for a time range.
 */
export function getTimeRangeLabel(range: string): string {
  const labels: Record<string, string> = {
    '1h': 'Last hour',
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };
  return labels[range] || range;
}
