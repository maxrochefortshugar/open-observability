/**
 * Analytics client singleton for the dashboard.
 *
 * Creates and caches a single instance of the analytics SDK client
 * using environment variables for configuration.
 */

import { createAnalyticsClient, type AnalyticsBackend } from '@open-observability/sdk';

let client: AnalyticsBackend | null = null;

export function getAnalyticsClient(): AnalyticsBackend {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }

  client = createAnalyticsClient({
    backend: 'supabase',
    supabaseUrl,
    supabaseKey,
  });

  return client;
}

export function getSiteId(): string {
  return process.env.NEXT_PUBLIC_SITE_ID || 'default';
}
