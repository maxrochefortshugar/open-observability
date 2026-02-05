/**
 * Generate a short random identifier.
 * Uses crypto.randomUUID where available, falls back to Math.random.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get the current URL pathname, stripping query params and hash
 * for privacy reasons.
 */
export function getPathname(): string {
  return window.location.pathname;
}

/**
 * Get the full URL without hash for the current page.
 */
export function getUrl(): string {
  return window.location.origin + window.location.pathname + window.location.search;
}

/**
 * Get the referrer, or empty string if not available.
 */
export function getReferrer(): string {
  return document.referrer || '';
}

/**
 * Get the effective connection type if available.
 */
export function getConnectionType(): string | undefined {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };
  return nav.connection?.effectiveType;
}

/**
 * Get screen width.
 */
export function getScreenWidth(): number {
  return window.screen.width;
}

/**
 * Get user timezone.
 */
export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
}

/**
 * Get user preferred language.
 */
export function getLanguage(): string {
  return navigator.language || 'en';
}

/**
 * Check if Do Not Track is enabled.
 */
export function isDNTEnabled(): boolean {
  const nav = navigator as Navigator & { doNotTrack?: string };
  return nav.doNotTrack === '1' || nav.doNotTrack === 'yes';
}

/**
 * Check if we are in a browser environment.
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Truncate a string to a maximum length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
