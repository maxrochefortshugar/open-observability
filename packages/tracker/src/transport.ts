/**
 * Transport layer for sending events to the backend.
 *
 * Uses a batching strategy to minimize network requests.
 * Falls back to navigator.sendBeacon on page unload for reliability.
 */

import type { TrackerConfig, TrackerEvent } from './types';

export class Transport {
  private queue: TrackerEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly config: TrackerConfig;
  private readonly debug: boolean;

  constructor(config: TrackerConfig) {
    this.config = config;
    this.debug = config.debug ?? false;

    // Flush on page hide / unload for reliability
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => {
        this.flush();
      });
    }
  }

  /**
   * Add an event to the send queue.
   * Triggers a flush if the batch size threshold is reached.
   */
  enqueue(event: TrackerEvent): void {
    this.queue.push(event);

    if (this.debug) {
      console.log('[open-observability]', event.type, event);
    }

    const batchSize = this.config.batchSize ?? 10;
    if (this.queue.length >= batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Schedule a flush after the configured interval.
   */
  private scheduleFlush(): void {
    if (this.timer !== null) return;

    const interval = this.config.flushInterval ?? 5000;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, interval);
  }

  /**
   * Immediately send all queued events.
   * Uses sendBeacon when the page is being unloaded, fetch otherwise.
   */
  flush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const events = this.queue.splice(0);
    const payload = JSON.stringify({ events });

    // Determine if we should use sendBeacon (page is hiding)
    const useBeacon =
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden' &&
      typeof navigator.sendBeacon === 'function';

    if (useBeacon) {
      this.sendViaBeacon(payload);
    } else {
      this.sendViaFetch(payload);
    }
  }

  private sendViaBeacon(payload: string): void {
    try {
      const blob = new Blob([payload], { type: 'application/json' });

      // sendBeacon does not support custom headers, so we encode
      // essential auth info in the URL when needed.
      const url = this.buildUrl();
      const success = navigator.sendBeacon(url, blob);

      if (!success && this.debug) {
        console.warn('[open-observability] sendBeacon failed, events may be lost');
      }
    } catch (err) {
      if (this.debug) {
        console.error('[open-observability] sendBeacon error:', err);
      }
    }
  }

  private async sendViaFetch(payload: string): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.headers,
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        headers['apikey'] = this.config.apiKey;
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: payload,
        keepalive: true,
      });

      if (!response.ok && this.debug) {
        console.warn(
          `[open-observability] ingestion failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (err) {
      if (this.debug) {
        console.error('[open-observability] fetch error:', err);
      }
      // Silently fail - we never want to break the host page
    }
  }

  private buildUrl(): string {
    const url = new URL(this.config.endpoint);
    if (this.config.apiKey) {
      url.searchParams.set('apikey', this.config.apiKey);
    }
    return url.toString();
  }

  /**
   * Get the current queue length (for testing).
   */
  get queueLength(): number {
    return this.queue.length;
  }
}
