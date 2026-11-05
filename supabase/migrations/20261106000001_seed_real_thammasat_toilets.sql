-- ============================================================================
-- Seed Real Thammasat University (Tha Prachan) Toilets
-- Project: ปลดปล่อย (PLODPLOI)
-- ============================================================================

-- 1. Ensure RLS policies on `toilets` table are active
DROP POLICY IF EXISTS toilets_select_public_active ON public.toilets;
DROP POLICY IF EXISTS toilets_admin_all ON public.toilets;

CREATE POLICY toilets_select_public_active ON public.toilets
  FOR SELECT TO anon, authenticated
  USING (status::text = 'ใช้งานได้' OR public.is_admin_user());

CREATE POLICY toilets_admin_all ON public.toilets
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 2. Clear old toilets & dependent records cleanly
TRUNCATE TABLE public.toilet_photos, public.toilet_amenities, public.toilets RESTART IDENTITY CASCADE;

-- 3. Ensure essential Thammasat Tha Prachan buildings exist
INSERT INTO public.buildings (building_name, description)
SELECT b.b_name, b.b_desc
FROM (VALUES
  ('ตึกโดม (Dome Building)', 'อาคารประวัติศาสตร์สัญลักษณ์ มธ. ท่าพระจันทร์'),
  ('หอสมุดปรีดี พนมยงค์', 'หอสมุดกลางใต้ดิน มธ. ท่าพระจันทร์'),
  ('อาคารคณะศิลปศาสตร์', 'คณะศิลปศาสตร์ มธ. ท่าพระจันทร์ ริมแม่น้ำเจ้าพระยา'),
  ('อาคารเรียนรวม (SC / บร.)', 'อาคารเรียนรวมและบรรยายรวมหลัก มธ. ท่าพระจันทร์'),
  ('โรงอาหารกลาง ท่าพระจันทร์', 'โรงอาหารกลางริมน้ำ มธ. ท่าพระจันทร์'),
  ('คณะนิติศาสตร์', 'อาคารคณะนิติศาสตร์ มธ. ท่าพระจันทร์'),
  ('คณะพาณิชยศาสตร์และการบัญชี', 'คณะพาณิชยศาสตร์และการบัญชี (TBS) มธ. ท่าพระจันทร์'),
  ('คณะเศรษฐศาสตร์', 'อาคารคณะเศรษฐศาสตร์ มธ. ท่าพระจันทร์')
) AS b(b_name, b_desc)
WHERE NOT EXISTS (
  SELECT 1 FROM public.buildings WHERE building_name = b.b_name
);

-- 4. Insert 10 Real Campus Toilets with accurate GPS coordinates & 08:30 - 19:00 open hours
INSERT INTO public.toilets (
  name,
  building_id,
  floor,
  location_text,
  location_lat,
  location_lng,
  toilet_type,
  status,
  has_bidet,
  has_disabled_access,
  facilities,
  open_hours,
  avg_rating
) VALUES
-- 1. ตึกโดม ชั้น 1
(
  'ตึกโดม ชั้น 1 (ปีกขวา)',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%ตึกโดม%' LIMIT 1),
  1,
  'ริมทางเดินปีกขวา ใกล้บันไดทางขึ้นห้องประชุมโดม',
  13.75582,
  100.49065,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'ผ้าอนามัย', 'ห้องน้ำผู้พิการ'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 2. หอสมุดปรีดี พนมยงค์ ชั้น U1
(
  'หอสมุดปรีดี พนมยงค์ ชั้น U1',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%หอสมุดปรีดี%' LIMIT 1),
  1,
  'โซนห้องสมุดใต้ดิน ติดกับลานนิทรรศการอเนกประสงค์',
  13.75548,
  100.49089,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ', 'ผ้าอนามัย', 'ห้องน้ำผู้พิการ'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 3. คณะศิลปศาสตร์ ชั้น 1
(
  'อาคารคณะศิลปศาสตร์ ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%คณะศิลปศาสตร์%' LIMIT 1),
  1,
  'โถงกลางหน้าลิฟต์ฝั่งแม่น้ำเจ้าพระยา',
  13.75678,
  100.49035,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  false,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ', 'ผ้าอนามัย'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 4. คณะศิลปศาสตร์ ชั้น 3
(
  'อาคารคณะศิลปศาสตร์ ชั้น 3',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%คณะศิลปศาสตร์%' LIMIT 1),
  3,
  'ด้านหลังห้องบรรยาย 301 ติดกับบันไดหนีไฟ',
  13.75680,
  100.49040,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  false,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 5. อาคารเรียนรวม (SC / บร.) ชั้น 1
(
  'อาคารเรียนรวม (SC / บร.) ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%อาคารเรียนรวม%' LIMIT 1),
  1,
  'ลานกิจกรรมชั้นล่าง ติดกับศูนย์หนังสือ มธ.',
  13.75620,
  100.49165,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ', 'ผ้าอนามัย', 'ห้องน้ำผู้พิการ'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 6. อาคารเรียนรวม (SC / บร.) ชั้น 3
(
  'อาคารเรียนรวม (SC / บร.) ชั้น 3',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%อาคารเรียนรวม%' LIMIT 1),
  3,
  'ทางเชื่อมระหว่างอาคารเรียน ตรงข้ามห้องบรรยาย SC 305',
  13.75625,
  100.49170,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  false,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 7. โรงอาหารกลาง ท่าพระจันทร์ ชั้น 1
(
  'โรงอาหารกลาง ท่าพระจันทร์ ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%โรงอาหารกลาง%' LIMIT 1),
  1,
  'ฝั่งทิศตะวันตกติดแม่น้ำเจ้าพระยา ด้านหลังร้านเครื่องดื่ม',
  13.75712,
  100.49095,
  'ห้องน้ำรวม',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ', 'ห้องน้ำผู้พิการ'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 8. คณะนิติศาสตร์ ชั้น 1
(
  'คณะนิติศาสตร์ ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%คณะนิติศาสตร์%' LIMIT 1),
  1,
  'ปีกซ้ายของอาคาร ใกล้ห้องสโมสรนักศึกษา',
  13.75510,
  100.49120,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ', 'ผ้าอนามัย', 'ห้องน้ำผู้พิการ'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 9. คณะพาณิชยศาสตร์และการบัญชี (TBS) ชั้น 2
(
  'คณะพาณิชยศาสตร์ฯ (TBS) ชั้น 2',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%คณะพาณิชยศาสตร์%' LIMIT 1),
  2,
  'ข้างห้องพักอาจารย์ หน้าห้อง Smart Classroom 204',
  13.75560,
  100.49190,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  false,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ', 'ผ้าอนามัย'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
),
-- 10. คณะเศรษฐศาสตร์ ชั้น 1
(
  'คณะเศรษฐศาสตร์ ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name LIKE '%คณะเศรษฐศาสตร์%' LIMIT 1),
  1,
  'ใกล้ห้องสมุดป๋วย อึ๊งภากรณ์ โถงกลางชั้น 1',
  13.75605,
  100.49210,
  'แยกเพศ',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'กระดาษชำระ', 'สบู่ล้างมือ', 'ผ้าอนามัย', 'ห้องน้ำผู้พิการ'],
  '{"open": "08:30", "close": "19:00", "label": "08:30 - 19:00 น."}'::jsonb,
  5.0
);

-- 5. Sync toilet_amenities relational table
INSERT INTO public.toilet_amenities (toilet_id, amenity_id)
SELECT t.toilet_id, a.amenity_id
FROM public.toilets t
CROSS JOIN public.amenities a
WHERE (
  (a.amenity_name LIKE '%สายฉีด%' AND t.has_bidet = true)
  OR (a.amenity_name LIKE '%พิการ%' AND t.has_disabled_access = true)
  OR (a.amenity_name = ANY(t.facilities))
  OR (a.amenity_name LIKE '%กระดาษ%' AND 'กระดาษชำระ' = ANY(t.facilities))
  OR (a.amenity_name LIKE '%ผ้าอนามัย%' AND 'ผ้าอนามัย' = ANY(t.facilities))
  OR (a.amenity_name LIKE '%สบู่%' AND 'สบู่ล้างมือ' = ANY(t.facilities))
);
