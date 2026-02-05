-- open-observability site management + membership guards
-- Migration: 00003_site_management
--
-- Adds multi-tenancy via sites/site_members tables and
-- redefines existing RPC functions with membership checks
-- so authenticated users can only query their own sites.

-- ============================================================
-- Create tables first (policies added after both exist)
-- ============================================================

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS site_members (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, site_id)
);

ALTER TABLE site_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS policies (both tables exist now)
-- ============================================================

-- Sites: authenticated users can see sites they are a member of
CREATE POLICY "Users can view their own sites"
  ON sites FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT sm.site_id FROM site_members sm
      WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to sites"
  ON sites FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Site members: users can see their own memberships
CREATE POLICY "Users can view their own memberships"
  ON site_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Owners can add members to their sites
CREATE POLICY "Owners can add members"
  ON site_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'owner'
    )
  );

CREATE POLICY "Service role full access to site_members"
  ON site_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Helper: check_site_membership
-- ============================================================

CREATE OR REPLACE FUNCTION check_site_membership(p_site_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM site_members sm
    JOIN sites s ON s.id = sm.site_id
    WHERE s.site_id = p_site_id
      AND sm.user_id = auth.uid()
  );
END;
$$;

-- ============================================================
-- create_site: atomically creates a site + owner membership
-- ============================================================

CREATE OR REPLACE FUNCTION create_site(p_site_id TEXT, p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_site_id UUID;
BEGIN
  INSERT INTO sites (site_id, name)
  VALUES (p_site_id, p_name)
  RETURNING id INTO v_site_id;

  INSERT INTO site_members (user_id, site_id, role)
  VALUES (auth.uid(), v_site_id, 'owner');

  RETURN v_site_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_site TO authenticated;

-- ============================================================
-- get_user_sites: returns the current user's sites with roles
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_sites()
RETURNS TABLE (id UUID, site_id TEXT, name TEXT, role TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT s.id, s.site_id, s.name, sm.role, s.created_at
    FROM sites s
    JOIN site_members sm ON sm.site_id = s.id
    WHERE sm.user_id = auth.uid()
    ORDER BY s.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_sites TO authenticated;

-- ============================================================
-- Redefine existing RPC functions with membership guards
-- ============================================================

-- Page View Time Series (with membership guard)
CREATE OR REPLACE FUNCTION get_pageview_timeseries(
  p_site_id TEXT,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_interval TEXT DEFAULT 'hour'
)
RETURNS TABLE (bucket TIMESTAMPTZ, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_site_membership(p_site_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of site %', p_site_id;
  END IF;

  IF p_interval = 'hour' THEN
    RETURN QUERY
      SELECT
        date_trunc('hour', pv.created_at) AS bucket,
        COUNT(*)::BIGINT AS count
      FROM page_views pv
      WHERE pv.site_id = p_site_id
        AND pv.created_at >= p_from
        AND pv.created_at <= p_to
      GROUP BY bucket
      ORDER BY bucket;
  ELSIF p_interval = 'day' THEN
    RETURN QUERY
      SELECT
        date_trunc('day', pv.created_at) AS bucket,
        COUNT(*)::BIGINT AS count
      FROM page_views pv
      WHERE pv.site_id = p_site_id
        AND pv.created_at >= p_from
        AND pv.created_at <= p_to
      GROUP BY bucket
      ORDER BY bucket;
  ELSE
    RAISE EXCEPTION 'Invalid interval: %. Use "hour" or "day".', p_interval;
  END IF;
END;
$$;

-- Top Pages (with membership guard)
CREATE OR REPLACE FUNCTION get_top_pages(
  p_site_id TEXT,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (pathname TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_site_membership(p_site_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of site %', p_site_id;
  END IF;

  RETURN QUERY
    SELECT
      pv.pathname,
      COUNT(*)::BIGINT AS count
    FROM page_views pv
    WHERE pv.site_id = p_site_id
      AND pv.created_at >= p_from
      AND pv.created_at <= p_to
    GROUP BY pv.pathname
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$;

-- Top Referrers (with membership guard)
CREATE OR REPLACE FUNCTION get_top_referrers(
  p_site_id TEXT,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (referrer TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_site_membership(p_site_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of site %', p_site_id;
  END IF;

  RETURN QUERY
    SELECT
      COALESCE(NULLIF(pv.referrer, ''), '(direct)') AS referrer,
      COUNT(*)::BIGINT AS count
    FROM page_views pv
    WHERE pv.site_id = p_site_id
      AND pv.created_at >= p_from
      AND pv.created_at <= p_to
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$;

-- Device Breakdown (with membership guard)
CREATE OR REPLACE FUNCTION get_device_breakdown(
  p_site_id TEXT,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (category TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_site_membership(p_site_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of site %', p_site_id;
  END IF;

  RETURN QUERY
    SELECT
      CASE
        WHEN pv.screen_width < 768 THEN 'mobile'
        WHEN pv.screen_width < 1024 THEN 'tablet'
        ELSE 'desktop'
      END AS category,
      COUNT(*)::BIGINT AS count
    FROM page_views pv
    WHERE pv.site_id = p_site_id
      AND pv.created_at >= p_from
      AND pv.created_at <= p_to
    GROUP BY category
    ORDER BY count DESC;
END;
$$;

-- Web Vitals Summary (with membership guard)
CREATE OR REPLACE FUNCTION get_vitals_summary(
  p_site_id TEXT,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (
  metric_name TEXT,
  p50 DOUBLE PRECISION,
  p75 DOUBLE PRECISION,
  p95 DOUBLE PRECISION,
  good_count BIGINT,
  needs_improvement_count BIGINT,
  poor_count BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_site_membership(p_site_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of site %', p_site_id;
  END IF;

  RETURN QUERY
    SELECT
      wv.metric_name,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY wv.metric_value)::DOUBLE PRECISION AS p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY wv.metric_value)::DOUBLE PRECISION AS p75,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY wv.metric_value)::DOUBLE PRECISION AS p95,
      COUNT(*) FILTER (WHERE wv.metric_rating = 'good')::BIGINT AS good_count,
      COUNT(*) FILTER (WHERE wv.metric_rating = 'needs-improvement')::BIGINT AS needs_improvement_count,
      COUNT(*) FILTER (WHERE wv.metric_rating = 'poor')::BIGINT AS poor_count,
      COUNT(*)::BIGINT AS total_count
    FROM web_vitals wv
    WHERE wv.site_id = p_site_id
      AND wv.created_at >= p_from
      AND wv.created_at <= p_to
    GROUP BY wv.metric_name
    ORDER BY wv.metric_name;
END;
$$;

-- Page View Stats (with membership guard)
CREATE OR REPLACE FUNCTION get_page_view_stats(
  p_site_id TEXT,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (
  total_views BIGINT,
  unique_visitors BIGINT,
  avg_time_on_page DOUBLE PRECISION,
  bounce_rate DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_site_membership(p_site_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of site %', p_site_id;
  END IF;

  RETURN QUERY
    SELECT
      COUNT(*)::BIGINT AS total_views,
      COUNT(DISTINCT pv.page_view_id)::BIGINT AS unique_visitors,
      NULL::DOUBLE PRECISION AS avg_time_on_page,
      NULL::DOUBLE PRECISION AS bounce_rate
    FROM page_views pv
    WHERE pv.site_id = p_site_id
      AND pv.created_at >= p_from
      AND pv.created_at <= p_to;
END;
$$;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION check_site_membership TO authenticated;
GRANT EXECUTE ON FUNCTION get_pageview_timeseries TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_top_pages TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_top_referrers TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_device_breakdown TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_vitals_summary TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_page_view_stats TO authenticated, service_role;
