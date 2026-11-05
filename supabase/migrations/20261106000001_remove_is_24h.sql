-- Migration: Remove is_24h and update nearby_toilets
-- Drop existing nearby_toilets function to alter return type
DROP FUNCTION IF EXISTS public.nearby_toilets(double precision, double precision, integer, integer, jsonb);

-- Drop is_24h column from toilets
ALTER TABLE public.toilets DROP COLUMN IF EXISTS is_24h;

-- Recreate nearby_toilets without is_24h
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
  open_hours jsonb,
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
    t.open_hours,
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
