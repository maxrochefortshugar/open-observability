/**
 * open-observability SDK
 *
 * Server-side SDK for querying analytics data from open-observability
 * backends. Used by the dashboard and available for custom integrations.
 *
 * @example
 * ```typescript
 * import { createAnalyticsClient } from '@open-observability/sdk';
 *
 * const client = createAnalyticsClient({
 *   backend: 'supabase',
 *   supabaseUrl: process.env.SUPABASE_URL!,
 *   supabaseKey: process.env.SUPABASE_KEY!,
 * });
 *
 * const stats = await client.getStats('my-site', {
 *   from: new Date('2024-01-01'),
 *   to: new Date(),
 * });
 * ```
 */

import {
  SupabaseBackend,
  type SupabaseBackendConfig,
  type SupabaseBackendCredentialsConfig,
  type SupabaseBackendClientConfig,
} from './backends/supabase';
import type { AnalyticsBackend } from './types';

export type { AnalyticsBackend } from './types';
export type {
  DateRange,
  TimeRange,
  PageView,
  WebVital,
  ErrorRecord,
  CustomEventRecord,
  PageViewStats,
  TimeSeriesPoint,
  TopPage,
  TopReferrer,
  DeviceBreakdown,
  VitalSummary,
} from './types';
export { SupabaseBackend } from './backends/supabase';
export type {
  SupabaseBackendConfig,
  SupabaseBackendCredentialsConfig,
  SupabaseBackendClientConfig,
} from './backends/supabase';

/**
 * Configuration for creating an analytics client.
 *
 * Supabase backend accepts either URL + key credentials or an existing
 * SupabaseClient instance (useful in browser contexts with @supabase/ssr).
 */
export type AnalyticsClientConfig =
  | ({ backend: 'supabase' } & SupabaseBackendCredentialsConfig)
  | ({ backend: 'supabase' } & SupabaseBackendClientConfig);

/**
 * Create an analytics client with the specified backend.
 *
 * Currently only Supabase is supported. The architecture is designed
 * to support additional backends (ClickHouse, Postgres, etc.) in
 * the future.
 */
export function createAnalyticsClient(config: AnalyticsClientConfig): AnalyticsBackend {
  switch (config.backend) {
    case 'supabase':
      if ('client' in config) {
        return new SupabaseBackend({ client: config.client });
      }
      return new SupabaseBackend({
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey,
      });
    default:
      throw new Error(`Unsupported backend: ${(config as { backend: string }).backend}`);
  }
}

/**
 * Helper to compute a DateRange from a TimeRange string.
 */
export function getDateRange(
  range: import('./types').TimeRange,
  customRange?: import('./types').DateRange,
): import('./types').DateRange {
  if (range === 'custom' && customRange) {
    return customRange;
  }

  const now = new Date();
  const from = new Date();

  switch (range) {
    case '1h':
      from.setHours(from.getHours() - 1);
      break;
    case '24h':
      from.setHours(from.getHours() - 24);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    default:
      from.setHours(from.getHours() - 24);
  }

  return { from, to: now };
}
