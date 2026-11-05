'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Building,
  LocationItem,
  Amenity,
  Toilet,
  ToiletAmenity,
  UserItem,
  AdminItem,
  ReportItem,
  ReviewItem,
  ToiletPhoto,
} from '@/lib/types';
import {
  createSupabaseClientInstance,
  getSupabaseConfig,
  ENV_SUPABASE_URL,
  ENV_SUPABASE_KEY,
  ENV_STORAGE_BUCKET,
} from '@/lib/supabase';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface SaveToiletInput {
  id?: number | null;
  building_id: number;
  floor: number;
  location_text: string;
  location_lat: number;
  location_lng: number;
  toilet_type: string;
  status: string;
  selectedAmenityIds: number[];
  photoFile?: File | null;
}

interface SaveBuildingInput {
  id?: number | null;
  building_name: string;
  description: string;
}

interface SaveLocationInput {
  id?: number | null;
  building_id: number;
  floor: number;
  room_name: string;
  description: string;
}

interface SaveAmenityInput {
  id?: number | null;
  amenity_name: string;
}

interface SubmitReportInput {
  toilet_id: number;
  status_type: string;
  status_detail: string;
  file?: File | null;
  photoDataUrl?: string;
}

interface SaveUserInput {
  display_name: string;
  role: string;
  phone: string;
  isAdmin: boolean;
}

interface AdminDataContextType {
  buildings: Building[];
  locations: LocationItem[];
  amenities: Amenity[];
  toilets: Toilet[];
  toiletAmenities: ToiletAmenity[];
  toiletPhotos: ToiletPhoto[];
  users: UserItem[];
  admins: AdminItem[];
  reports: ReportItem[];
  reviews: ReviewItem[];
  isConnected: boolean;
  isLoading: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  storageBucket: string;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  syncFromSupabase: (silent?: boolean) => Promise<void>;
  getBuildingName: (buildingId: number) => string;
  getToiletLabel: (toiletId: number) => string;
  saveToilet: (input: SaveToiletInput) => Promise<boolean>;
  deleteToilet: (toiletId: number) => Promise<boolean>;
  saveBuilding: (input: SaveBuildingInput) => Promise<boolean>;
  deleteBuilding: (buildingId: number) => Promise<boolean>;
  saveLocation: (input: SaveLocationInput) => Promise<boolean>;
  deleteLocation: (locationId: number) => Promise<boolean>;
  saveAmenity: (input: SaveAmenityInput) => Promise<boolean>;
  deleteAmenity: (amenityId: number) => Promise<boolean>;
  submitNewReport: (input: SubmitReportInput) => Promise<boolean>;
  updateToiletStatus: (toiletId: number, newStatus: string) => Promise<boolean>;
  updateReportResolution: (reportId: number, resolutionStatus: string, newToiletStatus?: string, toiletId?: number) => Promise<boolean>;
  deleteReport: (reportId: number) => Promise<boolean>;
  deleteReview: (reviewId: string | number) => Promise<boolean>;
  saveUser: (input: SaveUserInput) => Promise<boolean>;
  deleteUser: (userId: number) => Promise<boolean>;
  saveSupabaseSettings: (url: string, key: string, bucket: string) => Promise<void>;
  clearSupabaseSettings: () => void;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [supabaseUrl, setSupabaseUrl] = useState<string>(ENV_SUPABASE_URL);
  const [supabaseKey, setSupabaseKey] = useState<string>(ENV_SUPABASE_KEY);
  const [storageBucket, setStorageBucket] = useState<string>(ENV_STORAGE_BUCKET);

  // ดึงข้อมูลจาก Supabase 100% โดยไม่ Hardcode ข้อมูลจำลองในโค้ด
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [toiletAmenities, setToiletAmenities] = useState<ToiletAmenity[]>([]);
  const [toiletPhotos, setToiletPhotos] = useState<ToiletPhoto[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const fetchAllFromClient = useCallback(
    async (client: SupabaseClient | null, silent = false) => {
      if (!client) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [bRes, lRes, aRes, tRes, taRes, tpRes, rRes, revRes, uRes, admRes] = await Promise.all([
          client.from('buildings').select('*').order('building_id'),
          client.from('locations').select('*').order('location_id'),
          client.from('amenities').select('*').order('amenity_id'),
          client.from('toilets').select('*').order('toilet_id'),
          client.from('toilet_amenities').select('*'),
          client.from('toilet_photos').select('*').order('photo_id'),
          client.from('reports').select('*').order('created_at', { ascending: false }),
          client.from('reviews').select('*').order('created_at', { ascending: false }),
          client.from('Users').select('*').order('user_id'),
          client.from('admin').select('*'),
        ]);

        if (!bRes.error && bRes.data) setBuildings(bRes.data);
        if (!lRes.error && lRes.data) setLocations(lRes.data);
        if (!aRes.error && aRes.data) setAmenities(aRes.data);
        if (!tRes.error && tRes.data) setToilets(tRes.data);
        if (!taRes.error && taRes.data) setToiletAmenities(taRes.data);
        if (!tpRes.error && tpRes.data) setToiletPhotos(tpRes.data);
        if (!rRes.error && rRes.data) setReports(rRes.data);
        if (!revRes.error && revRes.data) setReviews(revRes.data);
        if (!uRes.error && uRes.data) setUsers(uRes.data);
        if (!admRes.error && admRes.data) setAdmins(admRes.data);

        setIsConnected(true);
        if (!silent) {
          showToast('อัปเดตข้อมูลล่าสุดจาก Supabase เรียบร้อยแล้ว', 'success');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        showToast('ไม่สามารถดึงข้อมูลจาก Supabase ได้: ' + msg, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    // If on public pages like /login or /liff, do not auto-fetch all admin data tables
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/login') || p.startsWith('/liff')) {
        setIsConnected(true);
        setIsLoading(false);
        return;
      }
    }

    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseKey(cfg.key);
    setStorageBucket(cfg.bucket);

    const client = createSupabaseClientInstance(cfg.url, cfg.key);
    setSupabaseClient(client);
    if (client) {
      fetchAllFromClient(client, true);
    } else {
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [fetchAllFromClient]);

  const syncFromSupabase = useCallback(
    async (silent = false) => {
      await fetchAllFromClient(supabaseClient, silent);
    },
    [fetchAllFromClient, supabaseClient]
  );

  const getBuildingName = useCallback(
    (buildingId: number) => {
      const b = buildings.find((x) => Number(x.building_id) === Number(buildingId));
      return b ? b.building_name : 'ไม่ระบุอาคาร';
    },
    [buildings]
  );

  const getToiletLabel = useCallback(
    (toiletId: number) => {
      const t = toilets.find((x) => Number(x.toilet_id) === Number(toiletId));
      if (!t) return `ห้องน้ำรหัส #${toiletId}`;
      return `${getBuildingName(t.building_id)} (ชั้น ${t.floor}) - ${t.location_text || ''}`;
    },
    [toilets, getBuildingName]
  );

  /* --- 1. Toilets & Toilet_Amenities CRUD --- */
  const saveToilet = async (input: SaveToiletInput): Promise<boolean> => {
    if (!supabaseClient) {
      showToast('ยังไม่ได้เชื่อมต่อฐานข้อมูล Supabase', 'error');
      return false;
    }

    const {
      id,
      building_id,
      floor,
      location_text,
      location_lat,
      location_lng,
      toilet_type,
      status,
      selectedAmenityIds,
    } = input;

    if (!building_id || !location_text.trim()) {
      showToast('กรุณาเลือกอาคารและระบุจุดสังเกตให้ครบถ้วน', 'error');
      return false;
    }

    const selectedAmenities = amenities.filter((a) =>
      selectedAmenityIds.includes(Number(a.amenity_id))
    );
    const has_bidet = selectedAmenities.some((a) => a.amenity_name.includes('สายฉีด'));
    const has_disabled_access = selectedAmenities.some((a) => a.amenity_name.includes('พิการ'));
    const facilities = selectedAmenities.map((a) => a.amenity_name);

    const existingToilet = id
      ? toilets.find((t) => Number(t.toilet_id) === Number(id))
      : undefined;
    const shouldSetName = !existingToilet?.name || !existingToilet.name.trim();

    const payload: Record<string, unknown> = {
      building_id,
      floor,
      location_text: location_text.trim(),
      location_lat,
      location_lng,
      toilet_type,
      status,
      has_bidet,
      has_disabled_access,
      facilities,
      ...(shouldSetName ? { name: location_text.trim() } : {}),
    };

    let savedToiletId = id ? Number(id) : 0;

    if (id) {
      const { error } = await supabaseClient.from('toilets').update(payload).eq('toilet_id', id);
      if (error) {
        showToast('บันทึกไม่สำเร็จ: ' + error.message, 'error');
        return false;
      }
    } else {
      const { data, error } = await supabaseClient.from('toilets').insert([payload]).select();
      if (error) {
        showToast('เพิ่มห้องน้ำไม่สำเร็จ: ' + error.message, 'error');
        return false;
      }
      if (data && data[0]) savedToiletId = data[0].toilet_id;
    }

    if (savedToiletId) {
      await supabaseClient.from('toilet_amenities').delete().eq('toilet_id', savedToiletId);
      if (selectedAmenityIds.length > 0) {
        const taRows = selectedAmenityIds.map((aid) => ({
          toilet_id: savedToiletId,
          amenity_id: aid,
        }));
        await supabaseClient.from('toilet_amenities').insert(taRows);
      }

      // Handle photo upload if a file was selected
      if (input.photoFile) {
        try {
          const file = input.photoFile;
          const ext = file.name.split('.').pop() || 'jpg';
          const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
          const filePath = `toilet_${savedToiletId}_${Date.now()}_${cleanName}.${ext}`;

          const { error: uploadError } = await supabaseClient.storage
            .from('toilet-photos')
            .upload(filePath, file, { contentType: file.type, upsert: true });

          if (!uploadError) {
            const { data: pubData } = supabaseClient.storage
              .from('toilet-photos')
              .getPublicUrl(filePath);

            if (pubData?.publicUrl) {
              await supabaseClient.from('toilet_photos').insert({
                toilet_id: savedToiletId,
                photo_url: pubData.publicUrl,
                is_cover: true,
              });
            }
          } else {
            console.error('Storage upload error:', uploadError);
            showToast('อัปโหลดรูปภาพไม่สำเร็จ: ' + uploadError.message, 'error');
          }
        } catch (uploadEx) {
          console.error('Photo upload exception:', uploadEx);
        }
      }
    }

    await syncFromSupabase(true);
    showToast('บันทึกข้อมูลห้องน้ำลง Supabase เรียบร้อยแล้ว', 'success');
    return true;
  };

  const deleteToilet = async (toiletId: number): Promise<boolean> => {
    if (!supabaseClient) return false;
    await supabaseClient.from('toilet_amenities').delete().eq('toilet_id', toiletId);
    await supabaseClient.from('toilet_photos').delete().eq('toilet_id', toiletId);
    const { error } = await supabaseClient.from('toilets').delete().eq('toilet_id', toiletId);
    if (error) {
      showToast('ลบไม่สำเร็จ: ' + error.message, 'error');
      return false;
    }
    await syncFromSupabase(true);
    showToast('ลบข้อมูลห้องน้ำสำเร็จ', 'success');
    return true;
  };

  /* --- 2. Buildings CRUD --- */
  const saveBuilding = async ({ id, building_name, description }: SaveBuildingInput): Promise<boolean> => {
    if (!supabaseClient) return false;
    if (!building_name.trim()) {
      showToast('กรุณากรอกชื่ออาคาร', 'error');
      return false;
    }

    const payload = {
      building_name: building_name.trim(),
      description: description.trim(),
    };

    if (id) {
      const { error } = await supabaseClient
        .from('buildings')
        .update(payload)
        .eq('building_id', id);
      if (error) {
        showToast(error.message, 'error');
        return false;
      }
    } else {
      const { error } = await supabaseClient.from('buildings').insert([payload]);
      if (error) {
        showToast(error.message, 'error');
        return false;
      }
    }

    await syncFromSupabase(true);
    showToast('บันทึกข้อมูลอาคารลง Supabase สำเร็จ', 'success');
    return true;
  };

  const deleteBuilding = async (buildingId: number): Promise<boolean> => {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient.from('buildings').delete().eq('building_id', buildingId);
    if (error) {
      showToast('ลบไม่ได้ (อาจมีห้องน้ำผูกกับอาคารนี้อยู่): ' + error.message, 'error');
      return false;
    }
    await syncFromSupabase(true);
    showToast('ลบอาคารเรียบร้อยแล้ว', 'success');
    return true;
  };

  /* --- 3. Locations CRUD --- */
  const saveLocation = async ({
    id,
    building_id,
    floor,
    room_name,
    description,
  }: SaveLocationInput): Promise<boolean> => {
    if (!supabaseClient) return false;
    if (!room_name.trim()) {
      showToast('กรุณาระบุชื่อห้องหรือจุดอ้างอิง', 'error');
      return false;
    }

    const payload = {
      building_id,
      floor,
      room_name: room_name.trim(),
      description: description.trim(),
    };

    if (id) {
      const { error } = await supabaseClient
        .from('locations')
        .update(payload)
        .eq('location_id', id);
      if (error) {
        showToast(error.message, 'error');
        return false;
      }
    } else {
      const { error } = await supabaseClient.from('locations').insert([payload]);
      if (error) {
        showToast(error.message, 'error');
        return false;
      }
    }

    await syncFromSupabase(true);
    showToast('บันทึกจุดอ้างอิงลง Supabase เรียบร้อยแล้ว', 'success');
    return true;
  };

  const deleteLocation = async (locationId: number): Promise<boolean> => {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient.from('locations').delete().eq('location_id', locationId);
    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    await syncFromSupabase(true);
    showToast('ลบจุดอ้างอิงเรียบร้อยแล้ว', 'success');
    return true;
  };

  /* --- 4. Amenities CRUD --- */
  const saveAmenity = async ({ id, amenity_name }: SaveAmenityInput): Promise<boolean> => {
    if (!supabaseClient) return false;
    if (!amenity_name.trim()) {
      showToast('กรุณากรอกชื่อสิ่งอำนวยความสะดวก', 'error');
      return false;
    }

    const payload = { amenity_name: amenity_name.trim() };

    if (id) {
      const { error } = await supabaseClient
        .from('amenities')
        .update(payload)
        .eq('amenity_id', id);
      if (error) {
        showToast(error.message, 'error');
        return false;
      }
    } else {
      const { error } = await supabaseClient.from('amenities').insert([payload]);
      if (error) {
        showToast(error.message, 'error');
        return false;
      }
    }

    await syncFromSupabase(true);
    showToast('บันทึกสิ่งอำนวยความสะดวกลง Supabase สำเร็จ', 'success');
    return true;
  };

  const deleteAmenity = async (amenityId: number): Promise<boolean> => {
    if (!supabaseClient) return false;
    await supabaseClient.from('toilet_amenities').delete().eq('amenity_id', amenityId);
    const { error } = await supabaseClient.from('amenities').delete().eq('amenity_id', amenityId);
    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    await syncFromSupabase(true);
    showToast('ลบสิ่งอำนวยความสะดวกเรียบร้อยแล้ว', 'success');
    return true;
  };

  /* --- 5. Reports + Image Upload --- */
  const submitNewReport = async ({
    toilet_id,
    status_type,
    status_detail,
    file,
    photoDataUrl,
  }: SubmitReportInput): Promise<boolean> => {
    if (!supabaseClient) return false;
    if (!toilet_id || !status_detail.trim()) {
      showToast('กรุณาเลือกห้องน้ำและกรอกรายละเอียดปัญหา', 'error');
      return false;
    }

    let finalPhotoUrl = photoDataUrl || '';

    if (file) {
      const bucket = storageBucket || 'report-photos';
      const fileName = `report_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { data: uploadData, error: uploadErr } = await supabaseClient.storage
        .from(bucket)
        .upload(fileName, file);

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
        if (publicUrlData && publicUrlData.publicUrl) {
          finalPhotoUrl = publicUrlData.publicUrl;
        }
      }
    }

    const firstUserId = users[0] ? users[0].user_id : 1;
    const payload = {
      toilet_id,
      user_id: firstUserId,
      status_type,
      status_detail: status_detail.trim(),
      photo_url: finalPhotoUrl,
    };

    const mappedToiletStatus = status_type === 'ปิดทำความสะอาด' ? 'ทำความสะอาด' : 'ปิดปรับปรุง';

    const { error } = await supabaseClient.from('reports').insert([payload]);
    if (error) {
      showToast('ส่งรายงานไม่สำเร็จ: ' + error.message, 'error');
      return false;
    }
    await supabaseClient
      .from('toilets')
      .update({ status: mappedToiletStatus })
      .eq('toilet_id', toilet_id);
    await syncFromSupabase(true);

    showToast('บันทึกรายงานปัญหาและรูปถ่ายลง Supabase เรียบร้อยแล้ว', 'success');
    return true;
  };

  const updateToiletStatus = async (toiletId: number, newStatus: string): Promise<boolean> => {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient
      .from('toilets')
      .update({ status: newStatus })
      .eq('toilet_id', toiletId);
    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    await syncFromSupabase(true);
    showToast('อัปเดตสถานะห้องน้ำเรียบร้อยแล้ว', 'success');
    return true;
  };

  const updateReportResolution = async (
    reportId: number,
    resolutionStatus: string,
    newToiletStatus?: string,
    toiletId?: number
  ): Promise<boolean> => {
    if (!supabaseClient) return false;
    const payload: Record<string, unknown> = {
      resolution_status: resolutionStatus,
      ...(resolutionStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
    };
    const { error: repErr } = await supabaseClient
      .from('reports')
      .update(payload)
      .eq('report_id', reportId);

    if (repErr) {
      showToast('อัปเดตสถานะแจ้งซ่อมไม่สำเร็จ: ' + repErr.message, 'error');
      return false;
    }

    if (newToiletStatus && toiletId) {
      await supabaseClient
        .from('toilets')
        .update({ status: newToiletStatus })
        .eq('toilet_id', toiletId);
    }

    await syncFromSupabase(true);
    showToast('อัปเดตสถานะการดำเนินงานเรียบร้อยแล้ว', 'success');
    return true;
  };

  const deleteReport = async (reportId: number): Promise<boolean> => {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient.from('reports').delete().eq('report_id', reportId);
    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    await syncFromSupabase(true);
    showToast('ลบรายการแจ้งปัญหาสำเร็จ', 'success');
    return true;
  };

  /* --- 6. Reviews & Users --- */
  const deleteReview = async (reviewId: string | number): Promise<boolean> => {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient.from('reviews').delete().eq('review_id', reviewId);
    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    await syncFromSupabase(true);
    showToast('ลบรีวิวเรียบร้อยแล้ว', 'success');
    return true;
  };

  const saveUser = async ({
    display_name,
    role,
    phone,
    isAdmin,
  }: SaveUserInput): Promise<boolean> => {
    if (!supabaseClient) return false;
    if (!display_name.trim()) {
      showToast('กรุณากรอกชื่อผู้ใช้', 'error');
      return false;
    }

    const payload = {
      display_name: display_name.trim(),
      role,
      phone: phone.trim(),
    };

    const { data, error } = await supabaseClient.from('Users').insert([payload]).select();
    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    if (isAdmin && data && data[0]) {
      await supabaseClient
        .from('admin')
        .insert([{ user_id: data[0].user_id, is_active: true }]);
    }
    await syncFromSupabase(true);
    showToast('เพิ่มผู้ใช้งานลง Supabase สำเร็จ', 'success');
    return true;
  };

  const deleteUser = async (userId: number): Promise<boolean> => {
    if (!supabaseClient) return false;
    await supabaseClient.from('admin').delete().eq('user_id', userId);
    const { error } = await supabaseClient.from('Users').delete().eq('user_id', userId);
    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    await syncFromSupabase(true);
    showToast('ลบผู้ใช้งานเรียบร้อยแล้ว', 'success');
    return true;
  };

  /* --- 7. Settings --- */
  const saveSupabaseSettings = async (url: string, key: string, bucket: string) => {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    const cleanBucket = bucket.trim() || 'report-photos';

    if (!cleanUrl || !cleanKey) {
      showToast('กรุณาวางทั้ง Project URL และ Publishable Key', 'error');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('plodploi_supabase_url', cleanUrl);
      localStorage.setItem('plodploi_supabase_key', cleanKey);
      localStorage.setItem('plodploi_storage_bucket', cleanBucket);
    }

    setSupabaseUrl(cleanUrl);
    setSupabaseKey(cleanKey);
    setStorageBucket(cleanBucket);

    const newClient = createSupabaseClientInstance(cleanUrl, cleanKey);
    setSupabaseClient(newClient);
    await fetchAllFromClient(newClient, true);
    showToast('เชื่อมต่อฐานข้อมูล Supabase สำเร็จ!', 'success');
  };

  const clearSupabaseSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('plodploi_supabase_url');
      localStorage.removeItem('plodploi_supabase_key');
      localStorage.removeItem('plodploi_storage_bucket');
    }
    setSupabaseUrl(ENV_SUPABASE_URL);
    setSupabaseKey(ENV_SUPABASE_KEY);
    setStorageBucket(ENV_STORAGE_BUCKET);

    const envClient = createSupabaseClientInstance(ENV_SUPABASE_URL, ENV_SUPABASE_KEY);
    setSupabaseClient(envClient);
    if (envClient) {
      fetchAllFromClient(envClient, true);
      showToast('รีเซ็ตกลับไปใช้ค่าจากไฟล์ .env.local แล้ว', 'success');
    } else {
      setIsConnected(false);
    }
  };

  return (
    <AdminDataContext.Provider
      value={{
        buildings,
        locations,
        amenities,
        toilets,
        toiletAmenities,
        toiletPhotos,
        users,
        admins,
        reports,
        reviews,
        isConnected,
        isLoading,
        supabaseUrl,
        supabaseKey,
        storageBucket,
        toasts,
        showToast,
        syncFromSupabase,
        getBuildingName,
        getToiletLabel,
        saveToilet,
        deleteToilet,
        saveBuilding,
        deleteBuilding,
        saveLocation,
        deleteLocation,
        saveAmenity,
        deleteAmenity,
        submitNewReport,
        updateToiletStatus,
        updateReportResolution,
        deleteReport,
        deleteReview,
        saveUser,
        deleteUser,
        saveSupabaseSettings,
        clearSupabaseSettings,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return ctx;
}
