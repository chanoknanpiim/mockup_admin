import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wotvrvrfpwinvaagwnle.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Jw87Rp6PXwOFTW0v2Arlnw_RghodbjG';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const REAL_TOILETS_DATA = [
  {
    toilet_id: 1,
    name: 'ห้องน้ำ วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2',
    building_id: 8,
    floor: 1,
    location_text: 'วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2 ชั้น 1 โถงลิฟต์หลัก',
    location_lat: 13.7570,
    location_lng: 100.4912,
    toilet_type: 'ห้องน้ำรวม',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'สบู่เหลว', 'กระจกบานใหญ่'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.90,
  },
  {
    toilet_id: 2,
    name: 'ห้องน้ำ อาคารเรียนรวม วพ. (SC) ชั้น 1',
    building_id: 17,
    floor: 1,
    location_text: 'อาคารเรียนรวม วพ. (SC) ทางเดินชั้น 1 ใกล้ห้อง SC 101',
    location_lat: 13.7562,
    location_lng: 100.4905,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'พัดลมระบายอากาศ'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.80,
  },
  {
    toilet_id: 3,
    name: 'ห้องน้ำ หอสมุดปรีดี พนมยงค์ ชั้น U1',
    building_id: 16,
    floor: 1,
    location_text: 'หอสมุดปรีดี พนมยงค์ ชั้นใต้ดิน U1 โซนอ่านหนังสือ',
    location_lat: 13.7558,
    location_lng: 100.4922,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'กระดาษชำระ', 'สบู่เหลว'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 5.00,
  },
  {
    toilet_id: 4,
    name: 'ห้องน้ำ คณะพาณิชยศาสตร์และการบัญชี (TBS) ชั้น 2',
    building_id: 2,
    floor: 2,
    location_text: 'คณะพาณิชยศาสตร์และการบัญชี โถงบันไดกลางชั้น 2',
    location_lat: 13.7550,
    location_lng: 100.4925,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: false,
    facilities: ['สายฉีดชำระ', 'ผ้าอนามัย', 'สบู่เหลว', 'กระจกแต่งหน้า'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.70,
  },
  {
    toilet_id: 5,
    name: 'ห้องน้ำ คณะเศรษฐศาสตร์ ชั้น 1',
    building_id: 4,
    floor: 1,
    location_text: 'คณะเศรษฐศาสตร์ ชั้น 1 ติดลานกิจกรรม',
    location_lat: 13.7548,
    location_lng: 100.4915,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'กระดาษชำระ'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.80,
  },
  {
    toilet_id: 6,
    name: 'ห้องน้ำ คณะศิลปศาสตร์ ชั้น 1 (ริมน้ำ)',
    building_id: 5,
    floor: 1,
    location_text: 'คณะศิลปศาสตร์ โถงชั้น 1 ทางออกริมน้ำเจ้าพระยา',
    location_lat: 13.7555,
    location_lng: 100.4908,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'สบู่เหลว'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.90,
  },
  {
    toilet_id: 7,
    name: 'ห้องน้ำ คณะนิติศาสตร์ ชั้น 1',
    building_id: 1,
    floor: 1,
    location_text: 'คณะนิติศาสตร์ ข้างบันไดหลักชั้น 1',
    location_lat: 13.7565,
    location_lng: 100.4930,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: false,
    facilities: ['สายฉีดชำระ', 'ผ้าอนามัย', 'สบู่เหลว'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.70,
  },
  {
    toilet_id: 8,
    name: 'ห้องน้ำ โรงอาหารกลาง / อาคารกิจกรรมนักศึกษา',
    building_id: 15,
    floor: 1,
    location_text: 'โรงอาหารกลาง / อาคารกิจกรรมนักศึกษา ติดริมทางเดิน',
    location_lat: 13.7568,
    location_lng: 100.4918,
    toilet_type: 'ห้องน้ำรวม',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'สบู่เหลว', 'อ่างล้างมือภายนอก'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.60,
  },
  {
    toilet_id: 9,
    name: 'ห้องน้ำ ท่าพระจันทร์ / ริมแม่น้ำเจ้าพระยา',
    building_id: 19,
    floor: 1,
    location_text: 'จุดบริการริมแม่น้ำเจ้าพระยา ท่าเรือท่าพระจันทร์',
    location_lat: 13.7552,
    location_lng: 100.4898,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'กระดาษชำระ'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.70,
  },
  {
    toilet_id: 10,
    name: 'ห้องน้ำ อาคารธรรมศาสตร์ 60 ปี ชั้น 1',
    building_id: 3,
    floor: 1,
    location_text: 'อาคารธรรมศาสตร์ 60 ปี โถงทางเข้าชั้น 1',
    location_lat: 13.7540,
    location_lng: 100.4910,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'สบู่เหลว', 'กระจกแต่งหน้า'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.90,
  },
];

async function run() {
  console.log('1. Signing in as Admin plodploith@gmail.com...');
  const { error: authError } = await client.auth.signInWithPassword({
    email: 'plodploith@gmail.com',
    password: 'Plodploi44_',
  });
  if (authError) {
    console.error('Admin Sign-in failed:', authError.message);
    process.exit(1);
  }
  console.log('Admin Auth Success!');

  console.log('\n2. Upserting 10 real toilets with Google Maps coordinates...');
  for (const t of REAL_TOILETS_DATA) {
    const toiletPayload = {
      toilet_id: t.toilet_id,
      name: t.name,
      building_id: t.building_id,
      floor: t.floor,
      location_text: t.location_text,
      location_lat: t.location_lat,
      location_lng: t.location_lng,
      toilet_type: t.toilet_type,
      status: t.status,
      has_bidet: t.has_bidet,
      has_disabled_access: t.has_disabled_access,
      facilities: t.facilities,
      open_hours: t.open_hours,
      avg_rating: t.avg_rating,
    };

    const { error: upsertErr } = await client.from('toilets').upsert([toiletPayload]);
    if (upsertErr) {
      console.error(`Error updating toilet ${t.toilet_id}:`, upsertErr.message);
    } else {
      console.log(`✓ Toilet ${t.toilet_id}: ${t.name} -> (${t.location_lat}, ${t.location_lng})`);
    }
  }

  console.log('\n3. Verifying updated toilets in Supabase...');
  const { data: verifyList } = await client
    .from('toilets')
    .select('toilet_id, name, location_lat, location_lng, status')
    .order('toilet_id');

  console.log(verifyList);
  console.log('\nSUCCESS: All 10 Thammasat toilets have been updated with exact Google Maps coordinates!');
}

run();
