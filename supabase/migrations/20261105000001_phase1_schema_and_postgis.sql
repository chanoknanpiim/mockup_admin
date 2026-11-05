-- ============================================================================
-- Phase 1 (Step 1.2): PostGIS Extension, Backward-Compatible Schema Upgrade,
-- New Tables, GIST Index, and Coordinate Synchronization Trigger
-- ============================================================================

-- 1. Enable PostGIS extension for geographic point & distance queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Upgrade existing `toilets` table (Backward-Compatible with Admin Web)
-- Existing columns preserved: toilet_id, building_id, floor, location_lat,
-- location_lng, location_text, toilet_type, has_bidet, has_disabled_access, status, created_at
ALTER TABLE public.toilets
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS price numeric(8, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_hours jsonb DEFAULT '{"mon_fri": "06:00-20:00", "sat_sun": "08:00-18:00"}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_24h boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS facilities text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS avg_rating numeric(3, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Create GIST spatial index on `toilets.location` for fast proximity search
CREATE INDEX IF NOT EXISTS idx_toilets_location_gist
  ON public.toilets
  USING GIST (location);

-- 4. Create Trigger Function to automatically sync `location_lat`/`location_lng` <-> `location`
-- and auto-fill `name` from `location_text` if `name` is null (so Admin Web edits stay in sync)
CREATE OR REPLACE FUNCTION public.sync_toilet_geography_and_meta()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If lat/lng are provided (e.g. from Admin Web), compute PostGIS geography point
  IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.location_lng, NEW.location_lat), 4326)::geography;
  ELSIF NEW.location IS NOT NULL AND (NEW.location_lat IS NULL OR NEW.location_lng IS NULL) THEN
    NEW.location_lat := ST_Y(NEW.location::geometry);
    NEW.location_lng := ST_X(NEW.location::geometry);
  END IF;

  -- Keep `name` and `location_text` synchronized if one is missing
  IF NEW.name IS NULL AND NEW.location_text IS NOT NULL THEN
    NEW.name := NEW.location_text;
  ELSIF NEW.location_text IS NULL AND NEW.name IS NOT NULL THEN
    NEW.location_text := NEW.name;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_toilet_geography
  BEFORE INSERT OR UPDATE ON public.toilets
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_toilet_geography_and_meta();

-- Backfill existing rows in `toilets` so `location` (geography) and `name` are populated
UPDATE public.toilets
SET
  location = ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)::geography,
  name = COALESCE(name, location_text, 'ห้องน้ำ #' || toilet_id::text),
  updated_at = now()
WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- 5. Upgrade existing `"Users"` table (Backward-Compatible with Admin Web `/users`)
ALTER TABLE public."Users"
  ADD COLUMN IF NOT EXISTS line_user_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS picture_url text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 6. Create `admin_profiles` table linked to `"Users"` and `admin`
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  admin_profile_id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public."Users"(user_id) ON DELETE CASCADE,
  line_user_id text UNIQUE,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'admin',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sync existing records from `admin` into `admin_profiles`
INSERT INTO public.admin_profiles (user_id, role, is_active)
SELECT a.user_id, 'admin', COALESCE(a.is_active, true)
FROM public.admin a
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = a.user_id
);

-- 7. Create `toilet_photos` table
CREATE TABLE IF NOT EXISTS public.toilet_photos (
  photo_id bigserial PRIMARY KEY,
  toilet_id bigint NOT NULL REFERENCES public.toilets(toilet_id) ON DELETE CASCADE,
  user_id bigint REFERENCES public."Users"(user_id) ON DELETE SET NULL,
  photo_url text NOT NULL,
  caption text,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_toilet_photos_toilet_id ON public.toilet_photos(toilet_id);

-- 8. Create `submissions` table (for user-submitted new toilets from LIFF `/liff/add`)
CREATE TABLE IF NOT EXISTS public.submissions (
  submission_id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public."Users"(user_id) ON DELETE SET NULL,
  line_user_id text,
  name text NOT NULL,
  description text,
  building_id bigint REFERENCES public.buildings(building_id) ON DELETE SET NULL,
  floor integer DEFAULT 1,
  location_lat double precision NOT NULL,
  location_lng double precision NOT NULL,
  location geography(Point, 4326),
  address text,
  toilet_type text DEFAULT 'แยกเพศ',
  is_free boolean NOT NULL DEFAULT true,
  price numeric(8, 2) NOT NULL DEFAULT 0,
  is_24h boolean NOT NULL DEFAULT false,
  open_hours jsonb,
  facilities text[] DEFAULT '{}'::text[],
  photo_urls text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by bigint REFERENCES public."Users"(user_id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Upgrade existing `reports` and `reviews` tables with LIFF / moderation fields
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS line_user_id text,
  ADD COLUMN IF NOT EXISTS resolution_status text NOT NULL DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS line_user_id text,
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 10. Create `search_logs` table (for LINE Webhook & LIFF proximity search analytics)
CREATE TABLE IF NOT EXISTS public.search_logs (
  log_id bigserial PRIMARY KEY,
  line_user_id text,
  source text NOT NULL DEFAULT 'line_webhook' CHECK (source IN ('line_webhook', 'liff', 'admin')),
  search_lat double precision NOT NULL,
  search_lng double precision NOT NULL,
  search_location geography(Point, 4326),
  radius_m integer NOT NULL DEFAULT 500,
  filters jsonb DEFAULT '{}'::jsonb,
  results_count integer NOT NULL DEFAULT 0,
  response_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_location_gist ON public.search_logs USING GIST (search_location);
