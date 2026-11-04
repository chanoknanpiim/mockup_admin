export interface Building {
  building_id: number;
  building_name: string;
  description?: string | null;
}

export interface LocationItem {
  location_id: number;
  building_id: number;
  floor: number;
  room_name: string;
  description?: string | null;
}

export interface Amenity {
  amenity_id: number;
  amenity_name: string;
}

export type ToiletStatus = 'ปกติ' | 'ทำความสะอาด' | 'ชำรุด';

export interface Toilet {
  toilet_id: number;
  building_id: number;
  floor: number;
  location_lat?: number | null;
  location_lng?: number | null;
  location_text?: string | null;
  toilet_type?: string | null;
  has_bidet?: boolean | null;
  has_disabled_access?: boolean | null;
  status: ToiletStatus | string;
}

export interface ToiletAmenity {
  toilet_amenities_id?: number;
  toilet_id: number;
  amenity_id: number;
}

export interface UserItem {
  user_id: number;
  display_name: string;
  role?: string | null;
  phone?: string | null;
}

export interface AdminItem {
  admin_id?: number;
  user_id: number;
  is_active: boolean;
}

export interface ReportItem {
  report_id: number;
  created_at?: string | null;
  toilet_id: number;
  user_id?: number | null;
  status_type: string;
  status_detail?: string | null;
  photo_url?: string | null;
}

export interface ReviewItem {
  review_id: string | number;
  created_at?: string | null;
  toilet_id: number;
  user_id?: number | null;
  rating: number;
  review_text?: string | null;
}

export const INITIAL_BUILDINGS: Building[] = [
  { building_id: 1, building_name: 'คณะนิติศาสตร์', description: 'เปิดสอนทั้งท่าพระจันทร์ รังสิต และลำปาง' },
  { building_id: 2, building_name: 'คณะพาณิชยศาสตร์และการบัญชี', description: 'หลักสูตรนานาชาติ BBA และโครงการพิเศษ' },
  { building_id: 3, building_name: 'คณะรัฐศาสตร์', description: 'หลักสูตรนานาชาติ BMIR' },
  { building_id: 4, building_name: 'คณะเศรษฐศาสตร์', description: 'หลักสูตรนานาชาติ BE' },
  { building_id: 5, building_name: 'คณะศิลปศาสตร์', description: 'โครงการอังกฤษ-อเมริกันศึกษา BAS' },
  { building_id: 6, building_name: 'คณะวารสารศาสตร์และสื่อสารมวลชน', description: 'บางหลักสูตร/โครงการพิเศษ' },
  { building_id: 7, building_name: 'วิทยาลัยสหวิทยาการ', description: 'วิทยาลัยสหวิทยาการ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์' },
  { building_id: 8, building_name: 'วิทยาลัยนวัตกรรม', description: 'มีชั้น 3-5' },
  { building_id: 9, building_name: 'วิทยาลัยนานาชาติปรีดี พนมยงค์', description: '' },
];

export const INITIAL_LOCATIONS: LocationItem[] = [
  { location_id: 1, building_id: 8, floor: 3, room_name: 'ข้างห้องเรียน CITU 301', description: 'วิทยาลัยนวัตกรรม ชั้น 3' },
  { location_id: 2, building_id: 8, floor: 4, room_name: 'ข้างห้องพักอาจารย์', description: 'วิทยาลัยนวัตกรรม ชั้น 4' },
  { location_id: 3, building_id: 8, floor: 4, room_name: 'ข้างห้องคอมม่อน', description: 'วิทยาลัยนวัตกรรม ชั้น 5' },
];

export const INITIAL_AMENITIES: Amenity[] = [
  { amenity_id: 1, amenity_name: 'สายฉีดชำระ' },
  { amenity_id: 2, amenity_name: 'ห้องน้ำผู้พิการ' },
  { amenity_id: 3, amenity_name: 'กระดาษทิชชู่' },
  { amenity_id: 4, amenity_name: 'สบู่ล้างมือ' },
  { amenity_id: 5, amenity_name: 'ผ้าอนามัย' },
];

export const INITIAL_TOILETS: Toilet[] = [
  { toilet_id: 101, building_id: 8, floor: 3, location_lat: 13.7563, location_lng: 100.4902, location_text: 'ข้างห้องเรียน 301', toilet_type: 'แยกเพศ', has_bidet: true, has_disabled_access: false, status: 'ปกติ' },
  { toilet_id: 102, building_id: 8, floor: 4, location_lat: 13.7558, location_lng: 100.4910, location_text: 'ใกล้ห้องพักอาจารย์', toilet_type: 'แยกเพศ', has_bidet: true, has_disabled_access: false, status: 'ทำความสะอาด' },
  { toilet_id: 103, building_id: 8, floor: 4, location_lat: 13.7570, location_lng: 100.4895, location_text: 'ข้างห้องคอมม่อน', toilet_type: 'รวม', has_bidet: false, has_disabled_access: true, status: 'ชำรุด' },
  { toilet_id: 104, building_id: 7, floor: 1, location_lat: 13.7565, location_lng: 100.4890, location_text: 'โถงทางเข้าหลัก', toilet_type: 'แยกเพศ', has_bidet: true, has_disabled_access: true, status: 'ปกติ' },
];

export const INITIAL_TOILET_AMENITIES: ToiletAmenity[] = [
  { toilet_amenities_id: 1, toilet_id: 101, amenity_id: 1 },
  { toilet_amenities_id: 2, toilet_id: 101, amenity_id: 3 },
  { toilet_amenities_id: 3, toilet_id: 101, amenity_id: 5 },
  { toilet_amenities_id: 4, toilet_id: 102, amenity_id: 1 },
  { toilet_amenities_id: 5, toilet_id: 103, amenity_id: 2 },
  { toilet_amenities_id: 6, toilet_id: 104, amenity_id: 1 },
  { toilet_amenities_id: 7, toilet_id: 104, amenity_id: 2 },
  { toilet_amenities_id: 8, toilet_id: 104, amenity_id: 4 },
];

export const INITIAL_USERS: UserItem[] = [
  { user_id: 1, display_name: 'ชนกนันท์', role: 'นักศึกษา', phone: '081-111-2222' },
  { user_id: 2, display_name: 'อรณัฐ', role: 'นักศึกษา', phone: '089-333-4444' },
  { user_id: 3, display_name: 'สุพิชญา', role: 'นักศึกษา', phone: '086-555-6666' },
];

export const INITIAL_ADMINS: AdminItem[] = [
  { admin_id: 1, user_id: 1, is_active: true },
  { admin_id: 2, user_id: 2, is_active: true },
];

export const INITIAL_REPORTS: ReportItem[] = [
  { report_id: 1001, created_at: '2026-11-03 14:15', toilet_id: 101, user_id: 2, status_type: 'น้ำไม่ไหล', status_detail: 'ก๊อกน้ำอ่างล้างมือข้างห้องเรียน 301 น้ำไม่ไหลค่ะ', photo_url: 'https://i.ibb.co/Vp8pC7X/IMG-7913.jpg' },
  { report_id: 1002, created_at: '2026-11-03 10:15', toilet_id: 102, user_id: 3, status_type: 'ปิดทำความสะอาด', status_detail: 'แม่บ้านกำลังล้างพื้นห้องน้ำ ชั้น 4 คาดว่าเสร็จใน 30 นาที', photo_url: '' },
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  { review_id: 'REV-01', created_at: '2026-11-02', toilet_id: 101, user_id: 2, rating: 5, review_text: 'สะอาดมาก มีสายฉีดชำระ ทิชชู่ และผ้าอนามัยครบค่ะ' },
  { review_id: 'REV-02', created_at: '2026-11-01', toilet_id: 103, user_id: 3, rating: 3, review_text: 'แอร์เย็นดี แต่ก๊อกน้ำอ่างล้างมือชำรุด 1 จุด' },
  { review_id: 'REV-03', created_at: '2026-10-30', toilet_id: 104, user_id: 1, rating: 5, review_text: 'ห้องน้ำกว้างขวาง สะอาด ลมโกรกดีมาก' },
];
