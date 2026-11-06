import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wotvrvrfpwinvaagwnle.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Jw87Rp6PXwOFTW0v2Arlnw_RghodbjG';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

export const EXACT_10_TOILETS = [
  {
    toilet_id: 1,
    name: 'ห้องน้ำ วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2',
    building_id: 8,
    floor: 1,
    location_text: 'วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2 ชั้น 1 โถงลิฟต์หลัก',
    location_lat: 13.75705,
    location_lng: 100.49120,
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
    location_lat: 13.75620,
    location_lng: 100.49050,
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
    name: 'ห้องน้ำ หอสมุดปรีดี พนมยงค์ (ใต้ลานโพธิ์)',
    building_id: 16,
    floor: 1,
    location_text: 'หอสมุดปรีดี พนมยงค์ ชั้นใต้ดิน U1 โซนอ่านหนังสือ (ใต้ลานโพธิ์)',
    location_lat: 13.75585,
    location_lng: 100.49180,
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
    name: 'ห้องน้ำ คณะพาณิชยศาสตร์และการบัญชี (TBS)',
    building_id: 2,
    floor: 2,
    location_text: 'คณะพาณิชยศาสตร์และการบัญชี โถงบันไดกลางชั้น 2',
    location_lat: 13.75510,
    location_lng: 100.49190,
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
    name: 'ห้องน้ำ คณะเศรษฐศาสตร์ (อาคารริมน้ำ)',
    building_id: 4,
    floor: 1,
    location_text: 'คณะเศรษฐศาสตร์ ชั้น 1 อาคารริมน้ำ ติดลานกิจกรรม',
    location_lat: 13.75480,
    location_lng: 100.49080,
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
    name: 'ห้องน้ำ คณะศิลปศาสตร์ (อาคารริมแม่น้ำเจ้าพระยา)',
    building_id: 5,
    floor: 1,
    location_text: 'คณะศิลปศาสตร์ โถงชั้น 1 ทางออกริมน้ำเจ้าพระยา',
    location_lat: 13.75550,
    location_lng: 100.49050,
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
    name: 'ห้องน้ำ คณะนิติศาสตร์ (ตึกติดกำแพงด้านหน้าพระธาตุ)',
    building_id: 1,
    floor: 1,
    location_text: 'คณะนิติศาสตร์ ตึกติดกำแพงด้านหน้าพระธาตุ ข้างบันไดหลักชั้น 1',
    location_lat: 13.75660,
    location_lng: 100.49250,
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
    location_lat: 13.75685,
    location_lng: 100.49160,
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
    name: 'ห้องน้ำ อาคารอเนกประสงค์ 1 (ตรงข้ามหอประชุมใหญ่)',
    building_id: 19,
    floor: 1,
    location_text: 'อาคารอเนกประสงค์ 1 (ตรงข้ามหอประชุมใหญ่) โถงชั้น 1',
    location_lat: 13.75630,
    location_lng: 100.49220,
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'กระดาษชำระ', 'สบู่เหลว'],
    open_hours: { open: '08:30', close: '19:00' },
    avg_rating: 4.70,
  },
  {
    toilet_id: 10,
    name: 'ห้องน้ำ อาคารธรรมศาสตร์ 60 ปี (ริมแม่น้ำเจ้าพระยาฝั่งใต้)',
    building_id: 3,
    floor: 1,
    location_text: 'อาคารธรรมศาสตร์ 60 ปี (ริมแม่น้ำเจ้าพระยาฝั่งใต้) โถงทางเข้าชั้น 1',
    location_lat: 13.75420,
    location_lng: 100.49080,
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

  console.log('\n2. Updating 10 Thammasat toilets with exact campus coordinates...');
  for (const t of EXACT_10_TOILETS) {
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
  const { data: verifyList, error: listErr } = await client
    .from('toilets')
    .select('toilet_id, name, location_lat, location_lng, status')
    .order('toilet_id');

  if (listErr) {
    console.error('Verify error:', listErr.message);
  } else {
    console.log(verifyList);
  }
  console.log('\nSUCCESS: All 10 Thammasat toilets updated with exact coordinates!');
}

run();
