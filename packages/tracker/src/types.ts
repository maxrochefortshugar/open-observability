/**
 * Configuration options for the open-observability tracker.
 */
export interface TrackerConfig {
  /**
   * The endpoint URL where events are sent.
   * For Supabase, this is typically your Edge Function URL.
   * Example: "https://<project>.supabase.co/functions/v1/ingest"
   */
  endpoint: string;

  /**
   * Your site identifier. Used to associate events with a specific site
   * when multiple sites report to the same backend.
   */
  siteId: string;

  /**
   * Optional API key for authenticating requests.
   * For Supabase, this is typically your anon key.
   */
  apiKey?: string;

  /**
   * Whether to automatically track page views. Defaults to true.
   * Handles both traditional navigation and SPA route changes.
   */
  autoPageViews?: boolean;

  /**
   * Whether to automatically collect Web Vitals (LCP, FID, CLS, etc.).
   * Defaults to true.
   */
  autoWebVitals?: boolean;

  /**
   * Whether to automatically track JavaScript errors. Defaults to true.
   */
  autoErrors?: boolean;

  /**
   * Whether to respect Do Not Track browser setting. Defaults to true.
   */
  respectDNT?: boolean;

  /**
   * Custom headers to include with every request.
   */
  headers?: Record<string, string>;

  /**
   * Enable debug logging to console. Defaults to false.
   */
  debug?: boolean;

  /**
   * Maximum number of events to batch before sending. Defaults to 10.
   */
  batchSize?: number;

  /**
   * Maximum time in milliseconds to wait before flushing the batch.
   * Defaults to 5000 (5 seconds).
   */
  flushInterval?: number;
}

/**
 * Common fields present on every event.
 */
export interface BaseEvent {
  /** Event type identifier */
  type: EventType;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Site identifier from config */
  site_id: string;
  /** Current page URL (without query params or hash by default) */
  url: string;
  /** Current page path */
  pathname: string;
  /** Referrer URL */
  referrer: string;
  /** Screen width */
  screen_width: number;
  /** User's timezone */
  timezone: string;
  /** User's preferred language */
  language: string;
  /** Connection type if available */
  connection_type?: string;
  /** Tracker version */
  tracker_version: string;
}

export type EventType = 'pageview' | 'webvital' | 'error' | 'custom';

/**
 * Page view event.
 */
export interface PageViewEvent extends BaseEvent {
  type: 'pageview';
  /** Document title */
  title: string;
  /** Unique page view identifier for session tracking */
  page_view_id: string;
}

/**
 * Web Vital metric event.
 */
export interface WebVitalEvent extends BaseEvent {
  type: 'webvital';
  /** Metric name: LCP, FID, CLS, FCP, TTFB, INP */
  metric_name: string;
  /** Metric value */
  metric_value: number;
  /** Rating: good, needs-improvement, poor */
  metric_rating: 'good' | 'needs-improvement' | 'poor';
  /** Unique metric ID for deduplication */
  metric_id: string;
  /** Navigation type */
  navigation_type?: string;
}

/**
 * Error event.
 */
export interface ErrorEvent extends BaseEvent {
  type: 'error';
  /** Error message */
  message: string;
  /** Error stack trace (truncated) */
  stack?: string;
  /** Source file */
  source?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
}

/**
 * Custom event for tracking arbitrary user actions.
 */
export interface CustomEvent extends BaseEvent {
  type: 'custom';
  /** Custom event name */
  event_name: string;
  /** Arbitrary properties */
  properties?: Record<string, string | number | boolean>;
}

export type TrackerEvent = PageViewEvent | WebVitalEvent | ErrorEvent | CustomEvent;
