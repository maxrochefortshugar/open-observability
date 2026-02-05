/**
 * Core tracker implementation.
 *
 * Orchestrates page view tracking, Web Vitals collection,
 * error tracking, and custom events. Designed to be lightweight,
 * non-blocking, and safe - it must never break the host page.
 */

import type {
  TrackerConfig,
  TrackerEvent,
  BaseEvent,
  PageViewEvent,
  ErrorEvent,
  CustomEvent,
} from './types';
import { Transport } from './transport';
import { collectWebVitals } from './web-vitals';
import {
  generateId,
  getPathname,
  getUrl,
  getReferrer,
  getConnectionType,
  getScreenWidth,
  getTimezone,
  getLanguage,
  isDNTEnabled,
  isBrowser,
  truncate,
} from './utils';

declare const __VERSION__: string;

export class Tracker {
  private transport: Transport;
  private config: TrackerConfig;
  private currentPageViewId: string = '';
  private lastPathname: string = '';
  private initialized = false;

  constructor(config: TrackerConfig) {
    this.config = {
      autoPageViews: true,
      autoWebVitals: true,
      autoErrors: true,
      respectDNT: true,
      debug: false,
      batchSize: 10,
      flushInterval: 5000,
      ...config,
    };

    this.transport = new Transport(this.config);
  }

  /**
   * Initialize the tracker.
   * Sets up automatic tracking based on configuration.
   */
  init(): void {
    if (!isBrowser()) {
      this.log('Not in browser environment, skipping init');
      return;
    }

    if (this.initialized) {
      this.log('Already initialized');
      return;
    }

    // Respect Do Not Track
    if (this.config.respectDNT && isDNTEnabled()) {
      this.log('Do Not Track is enabled, skipping init');
      return;
    }

    this.initialized = true;
    this.log('Initializing tracker v' + (typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'dev'));

    if (this.config.autoPageViews) {
      this.setupPageViewTracking();
    }

    if (this.config.autoWebVitals) {
      this.setupWebVitals();
    }

    if (this.config.autoErrors) {
      this.setupErrorTracking();
    }
  }

  /**
   * Manually track a page view.
   */
  trackPageView(): void {
    if (!this.initialized) return;

    this.currentPageViewId = generateId();
    this.lastPathname = getPathname();

    const event: PageViewEvent = {
      ...this.getBaseFields(),
      type: 'pageview',
      title: document.title,
      page_view_id: this.currentPageViewId,
    };

    this.send(event);
  }

  /**
   * Track a custom event with a name and optional properties.
   *
   * @example
   * tracker.trackEvent('button_click', { button_id: 'signup', variant: 'blue' });
   */
  trackEvent(name: string, properties?: Record<string, string | number | boolean>): void {
    if (!this.initialized) return;

    const event: CustomEvent = {
      ...this.getBaseFields(),
      type: 'custom',
      event_name: name,
      properties,
    };

    this.send(event);
  }

  /**
   * Immediately flush all queued events.
   * Useful before navigation or page unload.
   */
  flush(): void {
    this.transport.flush();
  }

  // --- Private methods ---

  private getBaseFields(): BaseEvent {
    return {
      type: 'pageview', // will be overridden
      timestamp: new Date().toISOString(),
      site_id: this.config.siteId,
      url: getUrl(),
      pathname: getPathname(),
      referrer: getReferrer(),
      screen_width: getScreenWidth(),
      timezone: getTimezone(),
      language: getLanguage(),
      connection_type: getConnectionType(),
      tracker_version: typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'dev',
    };
  }

  private send(event: TrackerEvent): void {
    this.transport.enqueue(event);
  }

  private setupPageViewTracking(): void {
    // Track the initial page view
    this.trackPageView();

    // Track SPA navigation via History API
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      originalPushState(...args);
      this.onRouteChange();
    };

    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      originalReplaceState(...args);
      this.onRouteChange();
    };

    // Track back/forward navigation
    window.addEventListener('popstate', () => {
      this.onRouteChange();
    });
  }

  private onRouteChange(): void {
    // Only track if the pathname actually changed
    const newPathname = getPathname();
    if (newPathname !== this.lastPathname) {
      // Small delay to let the page update its title
      setTimeout(() => {
        this.trackPageView();
      }, 100);
    }
  }

  private setupWebVitals(): void {
    collectWebVitals((vitalData) => {
      const event = {
        ...this.getBaseFields(),
        ...vitalData,
      } as TrackerEvent;

      this.send(event);
    });
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (errorEvent) => {
      const event: ErrorEvent = {
        ...this.getBaseFields(),
        type: 'error',
        message: truncate(errorEvent.message || 'Unknown error', 1000),
        stack: errorEvent.error?.stack ? truncate(errorEvent.error.stack, 2000) : undefined,
        source: errorEvent.filename,
        line: errorEvent.lineno,
        column: errorEvent.colno,
      };

      this.send(event);
    });

    window.addEventListener('unhandledrejection', (rejectionEvent) => {
      const reason = rejectionEvent.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason || 'Unhandled promise rejection');

      const event: ErrorEvent = {
        ...this.getBaseFields(),
        type: 'error',
        message: truncate(message, 1000),
        stack: reason instanceof Error && reason.stack ? truncate(reason.stack, 2000) : undefined,
      };

      this.send(event);
    });
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[open-observability]', ...args);
    }
  }
}
