-- open-observability database schema
-- Migration: 00001_create_tables
--
-- Creates the core tables for storing analytics events:
--   - page_views: page view events
--   - web_vitals: Core Web Vitals metrics
--   - errors: JavaScript error events
--   - custom_events: user-defined custom events

-- ============================================================
-- Page Views
-- ============================================================

CREATE TABLE IF NOT EXISTS page_views (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       TEXT NOT NULL,
  url           TEXT NOT NULL,
  pathname      TEXT NOT NULL,
  referrer      TEXT DEFAULT '',
  title         TEXT DEFAULT '',
  screen_width  INT DEFAULT 0,
  timezone      TEXT DEFAULT 'Unknown',
  language      TEXT DEFAULT 'en',
  connection_type TEXT,
  page_view_id  TEXT NOT NULL,
  tracker_version TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_page_views_site_created
  ON page_views (site_id, created_at DESC);

CREATE INDEX idx_page_views_site_pathname
  ON page_views (site_id, pathname, created_at DESC);

-- ============================================================
-- Web Vitals
-- ============================================================

CREATE TABLE IF NOT EXISTS web_vitals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         TEXT NOT NULL,
  url             TEXT NOT NULL,
  pathname        TEXT NOT NULL,
  metric_name     TEXT NOT NULL,
  metric_value    DOUBLE PRECISION NOT NULL,
  metric_rating   TEXT NOT NULL CHECK (metric_rating IN ('good', 'needs-improvement', 'poor')),
  metric_id       TEXT NOT NULL,
  navigation_type TEXT,
  referrer        TEXT DEFAULT '',
  screen_width    INT DEFAULT 0,
  timezone        TEXT DEFAULT 'Unknown',
  language        TEXT DEFAULT 'en',
  connection_type TEXT,
  tracker_version TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_web_vitals_site_created
  ON web_vitals (site_id, created_at DESC);

CREATE INDEX idx_web_vitals_site_metric
  ON web_vitals (site_id, metric_name, created_at DESC);

-- Unique constraint to prevent duplicate metric reports
CREATE UNIQUE INDEX idx_web_vitals_dedup
  ON web_vitals (site_id, metric_id);

-- ============================================================
-- Errors
-- ============================================================

CREATE TABLE IF NOT EXISTS errors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         TEXT NOT NULL,
  url             TEXT NOT NULL,
  pathname        TEXT NOT NULL,
  message         TEXT NOT NULL,
  stack           TEXT,
  source          TEXT,
  line            INT,
  column_number   INT,
  referrer        TEXT DEFAULT '',
  screen_width    INT DEFAULT 0,
  timezone        TEXT DEFAULT 'Unknown',
  language        TEXT DEFAULT 'en',
  connection_type TEXT,
  tracker_version TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_errors_site_created
  ON errors (site_id, created_at DESC);

CREATE INDEX idx_errors_site_message
  ON errors (site_id, message, created_at DESC);

-- ============================================================
-- Custom Events
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         TEXT NOT NULL,
  url             TEXT NOT NULL,
  pathname        TEXT NOT NULL,
  event_name      TEXT NOT NULL,
  properties      JSONB,
  referrer        TEXT DEFAULT '',
  screen_width    INT DEFAULT 0,
  timezone        TEXT DEFAULT 'Unknown',
  language        TEXT DEFAULT 'en',
  connection_type TEXT,
  tracker_version TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_events_site_created
  ON custom_events (site_id, created_at DESC);

CREATE INDEX idx_custom_events_site_name
  ON custom_events (site_id, event_name, created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from authenticated and anon roles (for the tracker)
CREATE POLICY "Allow inserts" ON page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow inserts" ON web_vitals
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow inserts" ON errors
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow inserts" ON custom_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow reads from authenticated role only (for the dashboard)
CREATE POLICY "Allow authenticated reads" ON page_views
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated reads" ON web_vitals
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated reads" ON errors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated reads" ON custom_events
  FOR SELECT TO authenticated
  USING (true);

-- Also allow service_role full access (used by Edge Functions / SDK)
CREATE POLICY "Service role full access" ON page_views
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access" ON web_vitals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access" ON errors
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access" ON custom_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
