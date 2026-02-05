# open-observability

Open-source web application metrics collection platform. A lightweight, privacy-respecting alternative to proprietary analytics services.

**Think Vercel Analytics, but open-source and backed by your own Supabase database.**

---

## Features

- **Lightweight tracker** -- under 5 KB minified. Non-blocking. Respects Do Not Track.
- **Core Web Vitals** -- LCP, FCP, CLS, INP, TTFB collected automatically.
- **Page view tracking** -- traditional navigation and SPA route changes.
- **Error tracking** -- JavaScript errors and unhandled promise rejections.
- **Custom events** -- track any user action with arbitrary properties.
- **Privacy-first** -- no cookies, no fingerprinting, DNT respected by default.
- **Real-time dashboard** -- visualize metrics with auto-refreshing charts.
- **Your data, your database** -- all data stored in your Supabase project.
- **Extensible architecture** -- backend interface designed for future providers (ClickHouse, Postgres, etc.).

## Architecture

```
Browser                     Supabase
  |                            |
  |  @open-observability/      |
  |  tracker (< 5 KB)         |
  |  - page views              |
  |  - web vitals       POST   |
  |  - errors          ------> | Edge Function: /ingest
  |  - custom events           |     |
  |                            |     v
  |                            | page_views table
  |                            | web_vitals table
  |                            | errors table
  |                            | custom_events table
  |                            |
Dashboard (Next.js)            |
  |                            |
  |  @open-observability/sdk   |
  |  (queries via RPC)  <----> | PostgreSQL functions
  |                            |
```

## Quick Start

### 1. Set Up Supabase

Create a new [Supabase](https://supabase.com) project (the free tier works).

Apply the database migrations:

```bash
# Option A: Using the Supabase CLI
supabase link --project-ref <your-project-ref>
supabase db push

# Option B: Run the SQL manually
# Copy the contents of supabase/migrations/00001_create_tables.sql
# and supabase/migrations/00002_create_functions.sql
# into the Supabase SQL Editor and execute them.
```

Deploy the ingestion Edge Function:

```bash
supabase functions deploy ingest
```

### 2. Add the Tracker to Your Website

**Script tag (simplest)**:

```html
<script
  src="https://unpkg.com/@open-observability/tracker"
  data-endpoint="https://<your-project>.supabase.co/functions/v1/ingest"
  data-site-id="my-site"
  data-api-key="<your-supabase-anon-key>"
  defer
></script>
```

That is it. Page views, Web Vitals, and errors will be tracked automatically.

**npm (for bundler-based projects)**:

```bash
npm install @open-observability/tracker
```

```typescript
import { createTracker } from '@open-observability/tracker';

const tracker = createTracker({
  endpoint: 'https://<your-project>.supabase.co/functions/v1/ingest',
  siteId: 'my-site',
  apiKey: '<your-supabase-anon-key>',
});

tracker.init();

// Track custom events
tracker.trackEvent('signup', { plan: 'pro' });
```

### 3. Launch the Dashboard

```bash
git clone https://github.com/open-observability/open-observability.git
cd open-observability
npm install
```

Create your environment file:

```bash
cp packages/dashboard/.env.example packages/dashboard/.env.local
```

Edit `packages/dashboard/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SITE_ID=my-site
```

Start the dashboard:

```bash
npm run dev:dashboard
```

Open [http://localhost:3000](http://localhost:3000).

## Packages

### `@open-observability/tracker`

The browser-side tracking script. Designed to be as small and non-intrusive as possible.

| Feature | Details |
|---|---|
| Bundle size | < 5 KB minified |
| Auto page views | Traditional nav + SPA (History API) |
| Web Vitals | LCP, FCP, CLS, INP, TTFB |
| Error tracking | window.onerror + unhandledrejection |
| Custom events | `tracker.trackEvent(name, props)` |
| Batching | Configurable batch size and flush interval |
| Delivery | fetch with keepalive, sendBeacon fallback |
| Privacy | Respects Do Not Track, no cookies |

**Configuration via data attributes**:

| Attribute | Description |
|---|---|
| `data-endpoint` | Ingestion endpoint URL (required) |
| `data-site-id` | Site identifier (required) |
| `data-api-key` | Supabase anon key |
| `data-no-pageviews` | Disable auto page view tracking |
| `data-no-vitals` | Disable Web Vitals collection |
| `data-no-errors` | Disable error tracking |
| `data-ignore-dnt` | Ignore Do Not Track setting |
| `data-debug` | Enable debug logging |

### `@open-observability/sdk`

Server-side SDK for querying analytics data. Used by the dashboard, also available for custom integrations.

```typescript
import { createAnalyticsClient, getDateRange } from '@open-observability/sdk';

const client = createAnalyticsClient({
  backend: 'supabase',
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});

const range = getDateRange('7d');
const stats = await client.getStats('my-site', range);
const vitals = await client.getVitalsSummary('my-site', range);
const topPages = await client.getTopPages('my-site', range, 10);
```

### `@open-observability/dashboard`

Next.js application for visualizing analytics data. Features:

- Real-time page view charts
- Top pages and referrer rankings
- Device category breakdown
- Core Web Vitals scores with distribution bars
- Time range filtering (1h, 24h, 7d, 30d, 90d)
- Dark mode support
- Auto-refresh every 60 seconds

## Database Schema

Four tables store all analytics data:

- **page_views** -- page view events with URL, referrer, device info
- **web_vitals** -- Core Web Vitals measurements with metric name, value, and rating
- **errors** -- JavaScript errors with message, stack trace, source location
- **custom_events** -- user-defined events with arbitrary JSON properties

Six PostgreSQL functions provide efficient aggregation:

- `get_pageview_timeseries` -- time-bucketed page view counts
- `get_top_pages` -- most visited pages
- `get_top_referrers` -- top traffic sources
- `get_device_breakdown` -- mobile/tablet/desktop split
- `get_vitals_summary` -- p50/p75/p95 percentiles per metric
- `get_page_view_stats` -- overall view and visitor counts

## Project Structure

```
open-observability/
  packages/
    tracker/              # Browser tracking script
      src/
        index.ts          # Entry point + auto-init from script tag
        tracker.ts        # Core tracker class
        transport.ts      # Event batching and delivery
        web-vitals.ts     # Web Vitals collection
        types.ts          # Type definitions
        utils.ts          # Browser utilities
      build.mjs           # esbuild configuration
    sdk/                  # Server-side query SDK
      src/
        index.ts          # Entry point + factory function
        types.ts          # Shared types + backend interface
        backends/
          supabase.ts     # Supabase backend implementation
    dashboard/            # Next.js dashboard
      src/
        app/              # Next.js app router pages
        components/       # React components
          charts/         # Visualization components
          common/         # Shared UI components
          layout/         # Layout components
          pages/          # Page-level components
        hooks/            # React hooks
        lib/              # Utilities and client setup
        types/            # Dashboard-specific types
        styles/           # CSS
  supabase/
    migrations/           # SQL migrations
    functions/
      ingest/             # Edge Function for event ingestion
  .github/
    workflows/            # CI/CD
    ISSUE_TEMPLATE/       # Issue templates
```

## Extending to Other Backends

The SDK defines an `AnalyticsBackend` interface. To add a new backend:

1. Create a new file in `packages/sdk/src/backends/`
2. Implement the `AnalyticsBackend` interface
3. Add the backend to the factory function in `packages/sdk/src/index.ts`
4. Create corresponding ingestion logic (API endpoint or function)

```typescript
// Example: packages/sdk/src/backends/clickhouse.ts
import type { AnalyticsBackend } from '../types';

export class ClickHouseBackend implements AnalyticsBackend {
  // Implement all methods from the interface
}
```

## Self-Hosting

The dashboard is a standard Next.js application. Deploy it anywhere:

- **Vercel**: `cd packages/dashboard && vercel`
- **Docker**: Build with the included Next.js Dockerfile support
- **Node.js**: `npm run build:dashboard && npm run start -w packages/dashboard`

The tracker script can be served from any CDN or your own infrastructure.

## Security Considerations

- The **ingestion endpoint** accepts writes from the anon key (public). This is by design -- the tracker runs in users' browsers.
- The **dashboard** should use the service role key (private, server-side only) for read access.
- Row Level Security (RLS) is enabled on all tables. The anon role can only insert; reading requires the authenticated or service_role.
- All input is sanitized and length-limited in the Edge Function.
- The tracker never collects PII by default. No cookies, no IP logging, no fingerprinting.

## Development

```bash
# Install everything
npm install

# Build all packages
npm run build

# Build just the tracker (with size output)
npm run build:tracker

# Start dashboard development server
npm run dev:dashboard

# Type check all packages
npm run typecheck

# Run tests
npm test
```

## License

MIT
