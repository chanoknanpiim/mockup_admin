-- ============================================================================
-- Phase 4 (Step 4.2): Production Row Level Security (RLS) & Least-Privilege Grants
-- Project: ปลดปล่อย (PLODPLOI) - Thammasat University Tha Prachan
-- ============================================================================

-- 1. Ensure Admin Profile exists and is active for plodploith@gmail.com
INSERT INTO public.admin_profiles (email, role, is_active)
VALUES ('plodploith@gmail.com', 'super_admin', true)
ON CONFLICT (email) DO UPDATE 
SET is_active = true, role = 'super_admin', updated_at = now();

-- 2. Define is_admin_user() function (Case-Insensitive & Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.is_active = true
      AND (
        (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(ap.email) = LOWER(auth.jwt() ->> 'email'))
        OR (auth.jwt() ->> 'line_user_id' IS NOT NULL AND ap.line_user_id = (auth.jwt() ->> 'line_user_id'))
      )
  );
$function$;

-- 3. Least-Privilege GRANTs
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- service_role has full access (used by server APIs and Edge Functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- anon (Public LIFF users) can read public catalog
GRANT SELECT ON
  public.toilets,
  public.buildings,
  public.locations,
  public.amenities,
  public.toilet_amenities,
  public.toilet_photos,
  public.reviews
TO anon;

-- anon can insert issue reports and reviews directly or via API
GRANT INSERT ON
  public.reports,
  public.reviews
TO anon;

-- authenticated users have table-level privileges strictly gated by RLS policies below
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.toilets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toilet_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toilet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing old policies to prevent duplicates
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END;
$$;

-- 6. Define Strict RLS Policies

-- 6.1 `toilets`: Public can only view active ('ใช้งานได้'); Admin has full CRUD
CREATE POLICY toilets_select_public_active ON public.toilets
  FOR SELECT TO anon, authenticated
  USING (status::text = 'ใช้งานได้' OR public.is_admin_user());

CREATE POLICY toilets_admin_all ON public.toilets
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.2 `buildings`: Public can read; Admin has full CRUD
CREATE POLICY buildings_select_public ON public.buildings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY buildings_admin_all ON public.buildings
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.3 `locations`: Public can read; Admin has full CRUD
CREATE POLICY locations_select_public ON public.locations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY locations_admin_all ON public.locations
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.4 `amenities`: Public can read; Admin has full CRUD
CREATE POLICY amenities_select_public ON public.amenities
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY amenities_admin_all ON public.amenities
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.5 `toilet_amenities`: Public can read; Admin has full CRUD
CREATE POLICY toilet_amenities_select_public ON public.toilet_amenities
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY toilet_amenities_admin_all ON public.toilet_amenities
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.6 `toilet_photos`: Public can read; Admin has full CRUD
CREATE POLICY toilet_photos_select_public ON public.toilet_photos
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY toilet_photos_admin_all ON public.toilet_photos
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.7 `reviews`: Public can read; anyone can insert; Admin can manage/delete
CREATE POLICY reviews_select_public ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY reviews_insert_public ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (rating >= 1 AND rating <= 5);

CREATE POLICY reviews_admin_modify ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY reviews_admin_delete ON public.reviews
  FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- 6.8 `reports`: Anyone can submit; only Admin can view and manage
CREATE POLICY reports_insert_public ON public.reports
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY reports_admin_all ON public.reports
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.9 `Users`: Users can read/update own row; Admin has full access
CREATE POLICY users_select_own_or_admin ON public."Users"
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(email) = LOWER(auth.jwt() ->> 'email'))
  );

CREATE POLICY users_admin_write ON public."Users"
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.10 `admin` & `admin_profiles`: Strictly Admin-only (Direct JWT check to prevent recursion)
CREATE POLICY admin_profiles_select_self ON public.admin_profiles
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(email) = LOWER(auth.jwt() ->> 'email'))
  );

CREATE POLICY admin_profiles_manage ON public.admin_profiles
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' IS NOT NULL 
    AND LOWER(email) = LOWER(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IS NOT NULL 
    AND LOWER(email) = LOWER(auth.jwt() ->> 'email')
  );

CREATE POLICY admin_table_admin_only ON public.admin
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6.11 `search_logs`: Admin-only
CREATE POLICY search_logs_admin_only ON public.search_logs
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 7. Storage Bucket `toilet-photos` Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'toilet_photos_public_read'
  ) THEN
    CREATE POLICY toilet_photos_public_read ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'toilet-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'toilet_photos_admin_write'
  ) THEN
    CREATE POLICY toilet_photos_admin_write ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id = 'toilet-photos' AND public.is_admin_user())
      WITH CHECK (bucket_id = 'toilet-photos' AND public.is_admin_user());
  END IF;
END;
$$;
