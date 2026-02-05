-- open-observability database functions
-- Migration: 00002_create_functions
--
-- Creates PostgreSQL functions used by the SDK to efficiently
-- query aggregated analytics data. Using server-side functions
-- keeps the heavy aggregation logic close to the data.

-- ============================================================
-- Page View Time Series
-- ============================================================

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

-- ============================================================
-- Top Pages
-- ============================================================

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

-- ============================================================
-- Top Referrers
-- ============================================================

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

-- ============================================================
-- Device Breakdown
-- ============================================================

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

-- ============================================================
-- Web Vitals Summary
-- ============================================================

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

-- ============================================================
-- Page View Stats (aggregate overview)
-- ============================================================

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pageview_timeseries TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_top_pages TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_top_referrers TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_device_breakdown TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_vitals_summary TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_page_view_stats TO authenticated, service_role;
