-- ============================================================================
-- Phase 1 (Step 1.3 - Part 1):
-- 1. Trigger `update_toilet_avg_rating` + Backfill `avg_rating` & `facilities`
-- 2. RPC `nearby_toilets(lat, lng, radius_m, limit_n, filters)`
-- 3. Storage Bucket `toilet-photos`
-- 4. Helper Function `is_admin_user()`
-- 5. `GRANT EXECUTE` on `nearby_toilets` and `is_admin_user`
-- (Note: REVOKE, ENABLE RLS, and RLS Policies are separated into
--  `20261105000004_phase4_rls_and_grants_PENDING.sql` to be applied with Admin Auth in Phase 4)
-- ============================================================================

-- 1. Trigger Function to automatically calculate `avg_rating` on `public.toilets`
CREATE OR REPLACE FUNCTION public.update_toilet_avg_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_toilet_id bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_toilet_id := OLD.toilet_id;
  ELSE
    target_toilet_id := NEW.toilet_id;
  END IF;

  UPDATE public.toilets
  SET
    avg_rating = COALESCE(
      (SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.toilet_id = target_toilet_id),
      0.00
    ),
    updated_at = now()
  WHERE toilet_id = target_toilet_id;

  IF TG_OP = 'UPDATE' AND OLD.toilet_id IS DISTINCT FROM NEW.toilet_id THEN
    UPDATE public.toilets
    SET
      avg_rating = COALESCE(
        (SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.toilet_id = OLD.toilet_id),
        0.00
      ),
      updated_at = now()
    WHERE toilet_id = OLD.toilet_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_update_toilet_avg_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_toilet_avg_rating();

-- Backfill `avg_rating` for all toilets
UPDATE public.toilets t
SET
  avg_rating = COALESCE(
    (SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.toilet_id = t.toilet_id),
    0.00
  );

-- Backfill `facilities` ONLY for rows where `facilities` is currently NULL or empty (`{}`)
UPDATE public.toilets t
SET
  facilities = COALESCE(
    ARRAY(
      SELECT a.amenity_name
      FROM public.toilet_amenities ta
      JOIN public.amenities a ON a.amenity_id = ta.amenity_id
      WHERE ta.toilet_id = t.toilet_id
      ORDER BY a.amenity_id
    ),
    '{}'::text[]
  )
WHERE t.facilities IS NULL OR cardinality(t.facilities) = 0;

-- 2. RPC Function: `nearby_toilets(lat, lng, radius_m, limit_n, filters)`
CREATE OR REPLACE FUNCTION public.nearby_toilets(
  lat double precision,
  lng double precision,
  radius_m integer DEFAULT 500,
  limit_n integer DEFAULT 12,
  filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  toilet_id bigint,
  name text,
  description text,
  building_id bigint,
  building_name text,
  floor smallint,
  location_lat double precision,
  location_lng double precision,
  location_text text,
  address text,
  toilet_type text,
  status text,
  is_free boolean,
  price numeric,
  open_hours jsonb,
  is_24h boolean,
  has_bidet boolean,
  has_disabled_access boolean,
  facilities text[],
  cover_image_url text,
  avg_rating numeric,
  review_count bigint,
  distance_m double precision
)
LANGUAGE sql
STABLE
AS $$
  WITH user_point AS (
    SELECT ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography AS pt
  )
  SELECT
    t.toilet_id,
    COALESCE(t.name, t.location_text, 'ห้องน้ำ #' || t.toilet_id::text) AS name,
    t.description,
    t.building_id,
    COALESCE(b.building_name, 'ไม่ระบุอาคาร') AS building_name,
    t.floor,
    t.location_lat,
    t.location_lng,
    t.location_text,
    t.address,
    t.toilet_type::text AS toilet_type,
    t.status::text AS status,
    t.is_free,
    t.price,
    t.open_hours,
    t.is_24h,
    COALESCE(t.has_bidet, false) AS has_bidet,
    COALESCE(t.has_disabled_access, false) AS has_disabled_access,
    COALESCE(t.facilities, '{}'::text[]) AS facilities,
    t.cover_image_url,
    COALESCE(t.avg_rating, 0.00) AS avg_rating,
    (SELECT COUNT(*) FROM public.reviews r WHERE r.toilet_id = t.toilet_id) AS review_count,
    ROUND(ST_Distance(t.location, up.pt)::numeric, 1)::double precision AS distance_m
  FROM public.toilets t
  CROSS JOIN user_point up
  LEFT JOIN public.buildings b ON b.building_id = t.building_id
  WHERE t.location IS NOT NULL
    AND t.status::text = 'ใช้งานได้'
    AND ST_DWithin(t.location, up.pt, radius_m)
    AND (
      NOT (filters ? 'is_free')
      OR (filters->>'is_free')::boolean IS FALSE
      OR t.is_free = true
    )
    AND (
      NOT (filters ? 'is_24h')
      OR (filters->>'is_24h')::boolean IS FALSE
      OR t.is_24h = true
    )
    AND (
      NOT (filters ? 'has_disabled_access')
      OR (filters->>'has_disabled_access')::boolean IS FALSE
      OR t.has_disabled_access = true
    )
    AND (
      NOT (filters ? 'has_bidet')
      OR (filters->>'has_bidet')::boolean IS FALSE
      OR t.has_bidet = true
    )
    AND (
      NOT (filters ? 'building_id')
      OR t.building_id = (filters->>'building_id')::bigint
    )
    AND (
      NOT (filters ? 'facility')
      OR (filters->>'facility') = ANY(t.facilities)
    )
  ORDER BY ST_Distance(t.location, up.pt) ASC
  LIMIT limit_n;
$$;

-- 3. Create Storage Bucket `toilet-photos`
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'toilet-photos',
  'toilet-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Helper function to check admin role from `admin_profiles`
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.is_active = true
      AND (
        (auth.jwt() ->> 'email' IS NOT NULL AND ap.email = (auth.jwt() ->> 'email'))
        OR (auth.jwt() ->> 'line_user_id' IS NOT NULL AND ap.line_user_id = (auth.jwt() ->> 'line_user_id'))
      )
  );
$$;

-- 5. Grant EXECUTE on the 2 functions
GRANT EXECUTE ON FUNCTION public.nearby_toilets(double precision, double precision, integer, integer, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated, service_role;
