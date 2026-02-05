-- Seed data for development and testing
-- Generates sample analytics data for the past 7 days.
--
-- Usage: Run this in the Supabase SQL Editor after applying migrations.

DO $$
DECLARE
  i INT;
  ts TIMESTAMPTZ;
  paths TEXT[] := ARRAY['/', '/about', '/blog', '/pricing', '/docs', '/docs/getting-started', '/blog/hello-world', '/contact'];
  referrers TEXT[] := ARRAY['', 'https://google.com', 'https://twitter.com', 'https://github.com', 'https://reddit.com/r/webdev', 'https://news.ycombinator.com', ''];
  vitals TEXT[] := ARRAY['LCP', 'FCP', 'CLS', 'INP', 'TTFB'];
  screen_widths INT[] := ARRAY[375, 390, 414, 768, 1024, 1280, 1440, 1920, 2560];
  timezones TEXT[] := ARRAY['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo'];
  languages TEXT[] := ARRAY['en', 'en-US', 'en-GB', 'de', 'ja', 'fr', 'es'];
BEGIN
  -- Generate page views
  FOR i IN 1..500 LOOP
    ts := NOW() - (random() * interval '7 days');
    INSERT INTO page_views (site_id, url, pathname, referrer, title, screen_width, timezone, language, page_view_id, tracker_version, created_at)
    VALUES (
      'demo-site',
      'https://example.com' || paths[1 + floor(random() * array_length(paths, 1))::int],
      paths[1 + floor(random() * array_length(paths, 1))::int],
      referrers[1 + floor(random() * array_length(referrers, 1))::int],
      'Example Site',
      screen_widths[1 + floor(random() * array_length(screen_widths, 1))::int],
      timezones[1 + floor(random() * array_length(timezones, 1))::int],
      languages[1 + floor(random() * array_length(languages, 1))::int],
      uuid_generate_v4()::text,
      '0.1.0',
      ts
    );
  END LOOP;

  -- Generate web vitals
  FOR i IN 1..200 LOOP
    ts := NOW() - (random() * interval '7 days');
    DECLARE
      vital TEXT := vitals[1 + floor(random() * array_length(vitals, 1))::int];
      val DOUBLE PRECISION;
      rating TEXT;
    BEGIN
      -- Generate realistic values per metric
      CASE vital
        WHEN 'LCP' THEN
          val := 800 + random() * 4000;
          IF val <= 2500 THEN rating := 'good';
          ELSIF val <= 4000 THEN rating := 'needs-improvement';
          ELSE rating := 'poor'; END IF;
        WHEN 'FCP' THEN
          val := 500 + random() * 3500;
          IF val <= 1800 THEN rating := 'good';
          ELSIF val <= 3000 THEN rating := 'needs-improvement';
          ELSE rating := 'poor'; END IF;
        WHEN 'CLS' THEN
          val := random() * 0.4;
          IF val <= 0.1 THEN rating := 'good';
          ELSIF val <= 0.25 THEN rating := 'needs-improvement';
          ELSE rating := 'poor'; END IF;
        WHEN 'INP' THEN
          val := 50 + random() * 600;
          IF val <= 200 THEN rating := 'good';
          ELSIF val <= 500 THEN rating := 'needs-improvement';
          ELSE rating := 'poor'; END IF;
        WHEN 'TTFB' THEN
          val := 100 + random() * 2000;
          IF val <= 800 THEN rating := 'good';
          ELSIF val <= 1800 THEN rating := 'needs-improvement';
          ELSE rating := 'poor'; END IF;
      END CASE;

      INSERT INTO web_vitals (site_id, url, pathname, metric_name, metric_value, metric_rating, metric_id, navigation_type, tracker_version, created_at)
      VALUES (
        'demo-site',
        'https://example.com' || paths[1 + floor(random() * array_length(paths, 1))::int],
        paths[1 + floor(random() * array_length(paths, 1))::int],
        vital,
        val,
        rating,
        uuid_generate_v4()::text,
        'navigate',
        '0.1.0',
        ts
      );
    END;
  END LOOP;

  -- Generate some errors
  FOR i IN 1..30 LOOP
    ts := NOW() - (random() * interval '7 days');
    INSERT INTO errors (site_id, url, pathname, message, source, line, column_number, tracker_version, created_at)
    VALUES (
      'demo-site',
      'https://example.com' || paths[1 + floor(random() * array_length(paths, 1))::int],
      paths[1 + floor(random() * array_length(paths, 1))::int],
      (ARRAY[
        'TypeError: Cannot read properties of undefined',
        'ReferenceError: x is not defined',
        'SyntaxError: Unexpected token',
        'NetworkError: Failed to fetch',
        'ChunkLoadError: Loading chunk failed'
      ])[1 + floor(random() * 5)::int],
      '/assets/main.js',
      floor(random() * 1000)::int,
      floor(random() * 100)::int,
      '0.1.0',
      ts
    );
  END LOOP;

  -- Generate custom events
  FOR i IN 1..100 LOOP
    ts := NOW() - (random() * interval '7 days');
    INSERT INTO custom_events (site_id, url, pathname, event_name, properties, tracker_version, created_at)
    VALUES (
      'demo-site',
      'https://example.com' || paths[1 + floor(random() * array_length(paths, 1))::int],
      paths[1 + floor(random() * array_length(paths, 1))::int],
      (ARRAY['button_click', 'form_submit', 'signup', 'download', 'share'])[1 + floor(random() * 5)::int],
      jsonb_build_object('variant', (ARRAY['a', 'b', 'control'])[1 + floor(random() * 3)::int]),
      '0.1.0',
      ts
    );
  END LOOP;
END $$;
