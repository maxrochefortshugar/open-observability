/**
 * open-observability tracker
 *
 * Lightweight, privacy-respecting web analytics tracker.
 *
 * Usage (script tag):
 *
 *   <script
 *     src="https://unpkg.com/@open-observability/tracker"
 *     data-endpoint="https://<project>.supabase.co/functions/v1/ingest"
 *     data-site-id="my-site"
 *     data-api-key="your-anon-key"
 *     defer
 *   ></script>
 *
 * Usage (npm):
 *
 *   import { createTracker } from '@open-observability/tracker';
 *
 *   const tracker = createTracker({
 *     endpoint: 'https://<project>.supabase.co/functions/v1/ingest',
 *     siteId: 'my-site',
 *     apiKey: 'your-anon-key',
 *   });
 *
 *   tracker.init();
 *   tracker.trackEvent('signup', { plan: 'pro' });
 */

import { Tracker } from './tracker';
import type { TrackerConfig } from './types';

export { Tracker } from './tracker';
export type {
  TrackerConfig,
  TrackerEvent,
  PageViewEvent,
  WebVitalEvent,
  ErrorEvent,
  CustomEvent,
  BaseEvent,
  EventType,
} from './types';

/**
 * Create and return a new Tracker instance.
 * Does NOT auto-initialize - call `.init()` to start tracking.
 */
export function createTracker(config: TrackerConfig): Tracker {
  return new Tracker(config);
}

// --- Auto-initialization from script tag data attributes ---

function autoInit(): void {
  if (typeof document === 'undefined') return;

  // Find the script tag that loaded us
  const script =
    document.currentScript ||
    document.querySelector('script[data-endpoint][data-site-id]');

  if (!script) return;

  const endpoint = script.getAttribute('data-endpoint');
  const siteId = script.getAttribute('data-site-id');

  if (!endpoint || !siteId) return;

  const config: TrackerConfig = {
    endpoint,
    siteId,
    apiKey: script.getAttribute('data-api-key') || undefined,
    autoPageViews: script.getAttribute('data-no-pageviews') === null,
    autoWebVitals: script.getAttribute('data-no-vitals') === null,
    autoErrors: script.getAttribute('data-no-errors') === null,
    respectDNT: script.getAttribute('data-ignore-dnt') === null,
    debug: script.getAttribute('data-debug') !== null,
  };

  const tracker = new Tracker(config);
  tracker.init();

  // Expose globally for manual event tracking
  (window as unknown as Record<string, unknown>).__oo = tracker;
}

// Auto-init when loaded via script tag
autoInit();
