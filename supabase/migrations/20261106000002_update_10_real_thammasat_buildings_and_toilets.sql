-- ============================================================================
-- Migration: Update 10 Real Thammasat Tha Prachan Buildings and Toilets
-- Project: ปลดปล่อย (PLODPLOI)
-- ============================================================================

-- 1. Ensure real Thammasat buildings exist
INSERT INTO public.buildings (building_name, description)
VALUES 
  ('วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2', 'อาคารอเนกประสงค์ 2 มธ. ท่าพระจันทร์'),
  ('อาคารเรียนรวม วพ. (SC)', 'อาคารเรียนรวมและบรรยายรวม วพ. มธ. ท่าพระจันทร์'),
  ('หอสมุดปรีดี พนมยงค์', 'หอสมุดกลางใต้ดิน มธ. ท่าพระจันทร์'),
  ('คณะพาณิชยศาสตร์และการบัญชี', 'อาคารคณะพาณิชยศาสตร์และการบัญชี (TBS)'),
  ('คณะเศรษฐศาสตร์', 'อาคารคณะเศรษฐศาสตร์ มธ. ท่าพระจันทร์'),
  ('คณะศิลปศาสตร์', 'อาคารคณะศิลปศาสตร์ มธ. ท่าพระจันทร์'),
  ('คณะนิติศาสตร์', 'อาคารคณะนิติศาสตร์ มธ. ท่าพระจันทร์'),
  ('โรงอาหารกลาง / อาคารกิจกรรมนักศึกษา', 'โรงอาหารกลางและอาคารกิจกรรมนักศึกษา มธ. ท่าพระจันทร์'),
  ('ท่าพระจันทร์ / ริมแม่น้ำเจ้าพระยา', 'จุดบริการริมแม่น้ำเจ้าพระยา ท่าเรือท่าพระจันทร์'),
  ('อาคารธรรมศาสตร์ 60 ปี', 'อาคารอเนกประสงค์ ธรรมศาสตร์ 60 ปี')
ON CONFLICT DO NOTHING;

-- 2. Clear & insert exactly the 10 real Thammasat toilets with exact Google Maps coordinates
TRUNCATE TABLE public.toilet_photos, public.toilet_amenities, public.toilets RESTART IDENTITY CASCADE;

INSERT INTO public.toilets (
  toilet_id,
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
-- 1. วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2 (13.7570, 100.4912)
(
  1,
  'ห้องน้ำ วิทยาลัยนวัตกรรม (CITU) ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%วิทยาลัยนวัตกรรม%' ORDER BY building_id DESC LIMIT 1),
  1,
  'โถงชั้น 1 อาคารอเนกประสงค์ 2 ฝั่งลิฟต์หลัก',
  13.7570,
  100.4912,
  'รวม',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'สบู่เหลว', 'กระจกบานใหญ่'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.90
),
-- 2. อาคารเรียนรวม วพ. (SC) (13.7562, 100.4905)
(
  2,
  'ห้องน้ำ อาคารเรียนรวม วพ. (SC) ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%อาคารเรียนรวม%' ORDER BY building_id DESC LIMIT 1),
  1,
  'ทางเดินชั้น 1 ใกล้ห้องบรรยายรวม SC 101',
  13.7562,
  100.4905,
  'แยกชายหญิง',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'พัดลมระบายอากาศ'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.80
),
-- 3. หอสมุดปรีดี พนมยงค์ (13.7558, 100.4922)
(
  3,
  'ห้องน้ำ หอสมุดปรีดี พนมยงค์ ชั้น U1',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%หอสมุดปรีดี%' ORDER BY building_id DESC LIMIT 1),
  1,
  'ชั้นใต้ดิน U1 ใกล้โซนที่นั่งอ่านหนังสือเงียบ',
  13.7558,
  100.4922,
  'แยกชายหญิง',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'กระดาษชำระ', 'สบู่เหลว'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  5.00
),
-- 4. คณะพาณิชยศาสตร์และการบัญชี (13.7550, 100.4925)
(
  4,
  'ห้องน้ำ คณะพาณิชยศาสตร์และการบัญชี (TBS) ชั้น 2',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%พาณิชยศาสตร์%' ORDER BY building_id DESC LIMIT 1),
  2,
  'โถงบันไดกลางชั้น 2 ใกล้ห้องประชุมและห้องเรียน',
  13.7550,
  100.4925,
  'แยกชายหญิง',
  'ใช้งานได้',
  true,
  false,
  ARRAY['สายฉีดชำระ', 'ผ้าอนามัย', 'สบู่เหลว', 'กระจกแต่งหน้า'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.70
),
-- 5. คณะเศรษฐศาสตร์ (13.7548, 100.4915)
(
  5,
  'ห้องน้ำ คณะเศรษฐศาสตร์ ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%เศรษฐศาสตร์%' ORDER BY building_id DESC LIMIT 1),
  1,
  'ชั้น 1 ริมทางเดินติดลานกิจกรรม คณะเศรษฐศาสตร์',
  13.7548,
  100.4915,
  'แยกชายหญิง',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'กระดาษชำระ'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.80
),
-- 6. คณะศิลปศาสตร์ (13.7555, 100.4908)
(
  6,
  'ห้องน้ำ คณะศิลปศาสตร์ ชั้น 1 (ริมน้ำ)',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%ศิลปศาสตร์%' ORDER BY building_id DESC LIMIT 1),
  1,
  'โถงชั้น 1 ปีกทิศเหนือ ใกล้ทางออกริมน้ำเจ้าพระยา',
  13.7555,
  100.4908,
  'แยกชายหญิง',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'สบู่เหลว'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.90
),
-- 7. คณะนิติศาสตร์ (13.7565, 100.4930)
(
  7,
  'ห้องน้ำ คณะนิติศาสตร์ ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%นิติศาสตร์%' ORDER BY building_id DESC LIMIT 1),
  1,
  'ข้างบันไดหลักชั้น 1 อาคารคณะนิติศาสตร์',
  13.7565,
  100.4930,
  'แยกชายหญิง',
  'ใช้งานได้',
  true,
  false,
  ARRAY['สายฉีดชำระ', 'ผ้าอนามัย', 'สบู่เหลว'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.70
),
-- 8. โรงอาหารกลาง / อาคารกิจกรรมนักศึกษา (13.7568, 100.4918)
(
  8,
  'ห้องน้ำ โรงอาหารกลาง ท่าพระจันทร์ ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%โรงอาหารกลาง%' ORDER BY building_id DESC LIMIT 1),
  1,
  'ด้านข้างโรงอาหารกลางติดริมทางเดิน ใกล้จุดคืนจาน',
  13.7568,
  100.4918,
  'รวม',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'สบู่เหลว', 'อ่างล้างมือภายนอก'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.60
),
-- 9. ท่าพระจันทร์ / ริมแม่น้ำเจ้าพระยา (13.7552, 100.4898)
(
  9,
  'ห้องน้ำ ท่าเรือท่าพระจันทร์ / ริมแม่น้ำ',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%ท่าพระจันทร์%' AND building_name ILIKE '%แม่น้ำ%' ORDER BY building_id DESC LIMIT 1),
  1,
  'จุดบริการห้องน้ำริมแม่น้ำเจ้าพระยา ใกล้ท่าเรือท่าพระจันทร์',
  13.7552,
  100.4898,
  'แยกชายหญิง',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'กระดาษชำระ'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.70
),
-- 10. อาคารธรรมศาสตร์ 60 ปี (13.7540, 100.4910)
(
  10,
  'ห้องน้ำ อาคารธรรมศาสตร์ 60 ปี ชั้น 1',
  (SELECT building_id FROM public.buildings WHERE building_name ILIKE '%ธรรมศาสตร์ 60 ปี%' ORDER BY building_id DESC LIMIT 1),
  1,
  'โถงทางเข้าชั้น 1 อาคารอเนกประสงค์ 60 ปี',
  13.7540,
  100.4910,
  'แยกชายหญิง',
  'ใช้งานได้',
  true,
  true,
  ARRAY['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'สบู่เหลว', 'กระจกแต่งหน้า'],
  '{"open": "08:30", "close": "19:00"}'::jsonb,
  4.90
);

-- 3. Synchronize PostGIS geography point for all toilets
UPDATE public.toilets
SET location = ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)::geography;
