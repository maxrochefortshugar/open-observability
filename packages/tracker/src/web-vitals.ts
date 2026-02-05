/**
 * Lightweight Web Vitals collection.
 *
 * Collects Core Web Vitals (LCP, CLS, INP) and additional metrics
 * (FCP, TTFB) using the browser's Performance Observer API.
 *
 * This is a minimal implementation that avoids the weight of the
 * full `web-vitals` library while still capturing the key metrics.
 */

import type { WebVitalEvent } from './types';
import { generateId } from './utils';

type MetricCallback = (metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType: string;
}) => void;

interface PerformanceEntryWithProcessingStart extends PerformanceEntry {
  processingStart?: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput?: boolean;
  value: number;
}

/**
 * Thresholds for rating metrics as good/needs-improvement/poor.
 * Based on https://web.dev/vitals/
 */
const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  FID: [100, 300],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
  INP: [200, 500],
};

function rate(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = THRESHOLDS[name];
  if (!thresholds) return 'good';
  if (value <= thresholds[0]) return 'good';
  if (value <= thresholds[1]) return 'needs-improvement';
  return 'poor';
}

function getNavigationType(): string {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      return navEntries[0].type;
    }
  }
  return 'navigate';
}

function observe(
  type: string,
  callback: (entries: PerformanceEntryList) => void,
  options?: { buffered?: boolean },
): PerformanceObserver | undefined {
  try {
    if (typeof PerformanceObserver === 'undefined') return undefined;

    const supported = PerformanceObserver.supportedEntryTypes;
    if (!supported || !supported.includes(type)) return undefined;

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });

    observer.observe({
      type,
      buffered: options?.buffered ?? true,
    });

    return observer;
  } catch {
    return undefined;
  }
}

/**
 * Collect Largest Contentful Paint.
 */
function collectLCP(onMetric: MetricCallback): void {
  let lastValue = 0;
  const id = generateId();

  observe('largest-contentful-paint', (entries) => {
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      lastValue = lastEntry.startTime;
    }
  });

  // LCP is finalized on page hide / visibility change
  const report = () => {
    if (lastValue > 0) {
      onMetric({
        name: 'LCP',
        value: lastValue,
        rating: rate('LCP', lastValue),
        id,
        navigationType: getNavigationType(),
      });
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      report();
    }
  });

  // Also fire on pagehide for reliability
  window.addEventListener('pagehide', report);
}

/**
 * Collect First Contentful Paint.
 */
function collectFCP(onMetric: MetricCallback): void {
  const id = generateId();

  observe('paint', (entries) => {
    for (const entry of entries) {
      if (entry.name === 'first-contentful-paint') {
        onMetric({
          name: 'FCP',
          value: entry.startTime,
          rating: rate('FCP', entry.startTime),
          id,
          navigationType: getNavigationType(),
        });
      }
    }
  });
}

/**
 * Collect Cumulative Layout Shift.
 */
function collectCLS(onMetric: MetricCallback): void {
  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: LayoutShiftEntry[] = [];
  const id = generateId();

  observe('layout-shift', (entries) => {
    for (const rawEntry of entries) {
      const entry = rawEntry as LayoutShiftEntry;
      // Only count shifts without recent user input
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

        // Start a new session window if gap > 1s or window > 5s
        if (
          sessionEntries.length > 0 &&
          (entry.startTime - lastSessionEntry!.startTime > 1000 ||
            entry.startTime - firstSessionEntry!.startTime > 5000)
        ) {
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
          }
          sessionValue = 0;
          sessionEntries = [];
        }

        sessionEntries.push(entry);
        sessionValue += entry.value;
      }
    }
  });

  const report = () => {
    if (sessionValue > clsValue) {
      clsValue = sessionValue;
    }
    if (clsValue > 0) {
      onMetric({
        name: 'CLS',
        value: clsValue,
        rating: rate('CLS', clsValue),
        id,
        navigationType: getNavigationType(),
      });
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      report();
    }
  });

  window.addEventListener('pagehide', report);
}

/**
 * Collect Interaction to Next Paint.
 */
function collectINP(onMetric: MetricCallback): void {
  let maxDuration = 0;
  const id = generateId();

  observe('event', (entries) => {
    for (const rawEntry of entries) {
      const entry = rawEntry as PerformanceEntryWithProcessingStart;
      if (entry.processingStart) {
        const duration = entry.duration;
        if (duration > maxDuration) {
          maxDuration = duration;
        }
      }
    }
  });

  const report = () => {
    if (maxDuration > 0) {
      onMetric({
        name: 'INP',
        value: maxDuration,
        rating: rate('INP', maxDuration),
        id,
        navigationType: getNavigationType(),
      });
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      report();
    }
  });

  window.addEventListener('pagehide', report);
}

/**
 * Collect Time to First Byte.
 */
function collectTTFB(onMetric: MetricCallback): void {
  const id = generateId();

  observe(
    'navigation',
    (entries) => {
      const navEntry = entries[0] as PerformanceNavigationTiming | undefined;
      if (navEntry) {
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        if (ttfb >= 0) {
          onMetric({
            name: 'TTFB',
            value: ttfb,
            rating: rate('TTFB', ttfb),
            id,
            navigationType: getNavigationType(),
          });
        }
      }
    },
    { buffered: true },
  );
}

/**
 * Start collecting all Web Vitals metrics.
 * Calls the provided callback for each metric as it becomes available.
 */
export function collectWebVitals(
  onVital: (event: Pick<WebVitalEvent, 'type' | 'metric_name' | 'metric_value' | 'metric_rating' | 'metric_id' | 'navigation_type'>) => void,
): void {
  const handler: MetricCallback = (metric) => {
    onVital({
      type: 'webvital',
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_id: metric.id,
      navigation_type: metric.navigationType,
    });
  };

  collectLCP(handler);
  collectFCP(handler);
  collectCLS(handler);
  collectINP(handler);
  collectTTFB(handler);
}
