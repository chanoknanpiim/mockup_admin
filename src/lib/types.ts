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

export type ToiletStatus = 'ใช้งานได้' | 'ทำความสะอาด' | 'ปิดปรับปรุง';

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
