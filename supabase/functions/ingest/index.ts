/**
 * open-observability ingestion Edge Function
 *
 * Receives batches of analytics events from the tracker script
 * and inserts them into the appropriate Supabase tables.
 *
 * Deployed as a Supabase Edge Function.
 *
 * Endpoint: POST /functions/v1/ingest
 *
 * Request body:
 * {
 *   "events": [
 *     { "type": "pageview", ... },
 *     { "type": "webvital", ... },
 *     ...
 *   ]
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for cross-origin tracker requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Max-Age': '86400',
};

interface BaseEvent {
  type: 'pageview' | 'webvital' | 'error' | 'custom';
  timestamp: string;
  site_id: string;
  url: string;
  pathname: string;
  referrer?: string;
  screen_width?: number;
  timezone?: string;
  language?: string;
  connection_type?: string;
  tracker_version?: string;
}

interface PageViewEvent extends BaseEvent {
  type: 'pageview';
  title?: string;
  page_view_id: string;
}

interface WebVitalEvent extends BaseEvent {
  type: 'webvital';
  metric_name: string;
  metric_value: number;
  metric_rating: string;
  metric_id: string;
  navigation_type?: string;
}

interface ErrorEvent extends BaseEvent {
  type: 'error';
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
}

interface CustomEvent extends BaseEvent {
  type: 'custom';
  event_name: string;
  properties?: Record<string, unknown>;
}

type TrackerEvent = PageViewEvent | WebVitalEvent | ErrorEvent | CustomEvent;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse the request body
    const body = await req.json();
    const events: TrackerEvent[] = body.events;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ error: 'No events provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: max 100 events per request
    if (events.length > 100) {
      return new Response(JSON.stringify({ error: 'Too many events (max 100)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for inserting data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Sort events by type for batch insertion
    const pageViews: Record<string, unknown>[] = [];
    const webVitals: Record<string, unknown>[] = [];
    const errors: Record<string, unknown>[] = [];
    const customEvents: Record<string, unknown>[] = [];

    for (const event of events) {
      // Validate required fields
      if (!event.type || !event.site_id || !event.url) {
        continue; // Skip malformed events
      }

      const baseFields = {
        site_id: sanitize(event.site_id, 100),
        url: sanitize(event.url, 2000),
        pathname: sanitize(event.pathname || '/', 500),
        referrer: sanitize(event.referrer || '', 2000),
        screen_width: clamp(event.screen_width || 0, 0, 10000),
        timezone: sanitize(event.timezone || 'Unknown', 100),
        language: sanitize(event.language || 'en', 20),
        connection_type: event.connection_type
          ? sanitize(event.connection_type, 20)
          : null,
        tracker_version: sanitize(event.tracker_version || '', 20),
        created_at: event.timestamp || new Date().toISOString(),
      };

      switch (event.type) {
        case 'pageview': {
          const pv = event as PageViewEvent;
          pageViews.push({
            ...baseFields,
            title: sanitize(pv.title || '', 500),
            page_view_id: sanitize(pv.page_view_id || '', 100),
          });
          break;
        }
        case 'webvital': {
          const wv = event as WebVitalEvent;
          if (!wv.metric_name || typeof wv.metric_value !== 'number') continue;
          webVitals.push({
            ...baseFields,
            metric_name: sanitize(wv.metric_name, 20),
            metric_value: wv.metric_value,
            metric_rating: sanitize(wv.metric_rating || 'good', 30),
            metric_id: sanitize(wv.metric_id || '', 100),
            navigation_type: wv.navigation_type
              ? sanitize(wv.navigation_type, 30)
              : null,
          });
          break;
        }
        case 'error': {
          const err = event as ErrorEvent;
          if (!err.message) continue;
          errors.push({
            ...baseFields,
            message: sanitize(err.message, 1000),
            stack: err.stack ? sanitize(err.stack, 5000) : null,
            source: err.source ? sanitize(err.source, 500) : null,
            line: err.line ? clamp(err.line, 0, 1000000) : null,
            column_number: err.column ? clamp(err.column, 0, 100000) : null,
          });
          break;
        }
        case 'custom': {
          const ce = event as CustomEvent;
          if (!ce.event_name) continue;
          customEvents.push({
            ...baseFields,
            event_name: sanitize(ce.event_name, 100),
            properties: ce.properties ? sanitizeProperties(ce.properties) : null,
          });
          break;
        }
      }
    }

    // Batch insert into each table
    const results = await Promise.allSettled([
      pageViews.length > 0
        ? supabase.from('page_views').insert(pageViews)
        : Promise.resolve({ error: null }),
      webVitals.length > 0
        ? supabase
            .from('web_vitals')
            .upsert(webVitals, { onConflict: 'site_id,metric_id', ignoreDuplicates: true })
        : Promise.resolve({ error: null }),
      errors.length > 0
        ? supabase.from('errors').insert(errors)
        : Promise.resolve({ error: null }),
      customEvents.length > 0
        ? supabase.from('custom_events').insert(customEvents)
        : Promise.resolve({ error: null }),
    ]);

    // Check for insertion errors
    const insertionErrors = results
      .map((r, i) => {
        if (r.status === 'rejected') return `Table ${i}: ${r.reason}`;
        const val = r.value as { error: { message: string } | null };
        if (val.error) return `Table ${i}: ${val.error.message}`;
        return null;
      })
      .filter(Boolean);

    if (insertionErrors.length > 0) {
      console.error('Insertion errors:', insertionErrors);
      return new Response(
        JSON.stringify({
          status: 'partial',
          errors: insertionErrors,
          accepted: events.length - insertionErrors.length,
        }),
        {
          status: 207,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        status: 'ok',
        accepted: events.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Ingestion error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

// --- Helpers ---

function sanitize(value: string, maxLength: number): string {
  if (typeof value !== 'string') return '';
  // Remove null bytes and trim
  return value.replace(/\0/g, '').trim().slice(0, maxLength);
}

function clamp(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function sanitizeProperties(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const keys = Object.keys(props).slice(0, 50); // Max 50 properties

  for (const key of keys) {
    const safeKey = sanitize(key, 100);
    const value = props[key];

    if (typeof value === 'string') {
      sanitized[safeKey] = sanitize(value, 500);
    } else if (typeof value === 'number' && isFinite(value)) {
      sanitized[safeKey] = value;
    } else if (typeof value === 'boolean') {
      sanitized[safeKey] = value;
    }
    // Skip other types for safety
  }

  return sanitized;
}
