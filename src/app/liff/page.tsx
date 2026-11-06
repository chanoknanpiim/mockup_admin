'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/context/LiffContext';
import { createSupabaseClientInstance, getSupabaseConfig } from '@/lib/supabase';
import LeafletMap, { MapToiletItem } from '@/components/LeafletMap';
import { formatToiletStatus } from '@/lib/openingHours';

type NearbyToiletItem = MapToiletItem & {
  description?: string | null;
  building_id?: number | null;
  address?: string | null;
  has_bidet?: boolean | null;
  has_disabled_access?: boolean | null;
};

type FilterKey =
  | 'all'
  | 'has_disabled_access'
  | 'has_bidet'
  | 'sanitary';

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'has_disabled_access', label: 'ห้องน้ำผู้พิการ' },
  { key: 'has_bidet', label: 'สายฉีดชำระ' },
  { key: 'sanitary', label: 'ผ้าอนามัย' },
];

const FALLBACK_CAMPUS_TOILETS: NearbyToiletItem[] = [
  {
    toilet_id: 1,
    name: 'ห้องน้ำ วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2',
    description: 'วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2 ชั้น 1 โถงลิฟต์หลัก',
    building_id: 8,
    building_name: 'วิทยาลัยนวัตกรรม',
    floor: 1,
    location_lat: 13.7570,
    location_lng: 100.4912,
    location_text: 'วิทยาลัยนวัตกรรม (CITU) / ตึกอเนกประสงค์ 2 ชั้น 1 โถงลิฟต์หลัก',
    toilet_type: 'ห้องน้ำรวม',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'สบู่เหลว', 'กระจกบานใหญ่'],
    avg_rating: 4.9,
    review_count: 5,
    distance_m: 120,
  },
  {
    toilet_id: 2,
    name: 'ห้องน้ำ อาคารเรียนรวม วพ. (SC) ชั้น 1',
    description: 'อาคารเรียนรวม วพ. (SC) ทางเดินชั้น 1 ใกล้ห้อง SC 101',
    building_id: 17,
    building_name: 'อาคารเรียนรวม (SC / บร.)',
    floor: 1,
    location_lat: 13.7562,
    location_lng: 100.4905,
    location_text: 'อาคารเรียนรวม วพ. (SC) ทางเดินชั้น 1 ใกล้ห้อง SC 101',
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'พัดลมระบายอากาศ'],
    avg_rating: 4.8,
    review_count: 4,
    distance_m: 150,
  },
  {
    toilet_id: 3,
    name: 'ห้องน้ำ หอสมุดปรีดี พนมยงค์ ชั้น U1',
    description: 'หอสมุดปรีดี พนมยงค์ ชั้นใต้ดิน U1 โซนอ่านหนังสือ',
    building_id: 16,
    building_name: 'หอสมุดปรีดี พนมยงค์',
    floor: 1,
    location_lat: 13.7558,
    location_lng: 100.4922,
    location_text: 'หอสมุดปรีดี พนมยงค์ ชั้นใต้ดิน U1 โซนอ่านหนังสือ',
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'กระดาษชำระ', 'สบู่เหลว'],
    avg_rating: 5.0,
    review_count: 8,
    distance_m: 180,
  },
  {
    toilet_id: 4,
    name: 'ห้องน้ำ คณะพาณิชยศาสตร์และการบัญชี (TBS) ชั้น 2',
    description: 'คณะพาณิชยศาสตร์และการบัญชี โถงบันไดกลางชั้น 2',
    building_id: 2,
    building_name: 'คณะพาณิชยศาสตร์และการบัญชี',
    floor: 2,
    location_lat: 13.7550,
    location_lng: 100.4925,
    location_text: 'คณะพาณิชยศาสตร์และการบัญชี โถงบันไดกลางชั้น 2',
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: false,
    facilities: ['สายฉีดชำระ', 'ผ้าอนามัย', 'สบู่เหลว', 'กระจกแต่งหน้า'],
    avg_rating: 4.9,
    review_count: 6,
    distance_m: 210,
  },
  {
    toilet_id: 5,
    name: 'ห้องน้ำ คณะเศรษฐศาสตร์ ชั้น 1',
    description: 'คณะเศรษฐศาสตร์ ชั้น 1 ฝั่งลานจอดรถ',
    building_id: 4,
    building_name: 'คณะเศรษฐศาสตร์',
    floor: 1,
    location_lat: 13.7548,
    location_lng: 100.4915,
    location_text: 'คณะเศรษฐศาสตร์ ชั้น 1 ฝั่งลานจอดรถ',
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'สบู่เหลว'],
    avg_rating: 4.7,
    review_count: 3,
    distance_m: 230,
  },
  {
    toilet_id: 6,
    name: 'ห้องน้ำ คณะศิลปศาสตร์ ชั้น 1 (ริมน้ำ)',
    description: 'คณะศิลปศาสตร์ ชั้น 1 ระเบียงริมแม่น้ำเจ้าพระยา',
    building_id: 5,
    building_name: 'คณะศิลปศาสตร์',
    floor: 1,
    location_lat: 13.7555,
    location_lng: 100.4908,
    location_text: 'คณะศิลปศาสตร์ ชั้น 1 ระเบียงริมแม่น้ำเจ้าพระยา',
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'วิวริมน้ำ'],
    avg_rating: 4.9,
    review_count: 7,
    distance_m: 250,
  },
  {
    toilet_id: 7,
    name: 'ห้องน้ำ คณะนิติศาสตร์ ชั้น 1',
    description: 'คณะนิติศาสตร์ ชั้น 1 ติดห้องพยาบาล',
    building_id: 1,
    building_name: 'คณะนิติศาสตร์',
    floor: 1,
    location_lat: 13.7565,
    location_lng: 100.4930,
    location_text: 'คณะนิติศาสตร์ ชั้น 1 ติดห้องพยาบาล',
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'สบู่เหลว'],
    avg_rating: 4.8,
    review_count: 4,
    distance_m: 270,
  },
  {
    toilet_id: 8,
    name: 'ห้องน้ำ โรงอาหารกลาง / อาคารกิจกรรมนักศึกษา',
    description: 'โรงอาหารกลาง ท่าพระจันทร์ ชั้น 1 ด้านหลังร้านค้า',
    building_id: 15,
    building_name: 'โรงอาหารกลาง ท่าพระจันทร์',
    floor: 1,
    location_lat: 13.7568,
    location_lng: 100.4918,
    location_text: 'โรงอาหารกลาง ท่าพระจันทร์ ชั้น 1 ด้านหลังร้านค้า',
    toilet_type: 'ห้องน้ำรวม',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'สบู่ล้างมือ'],
    avg_rating: 4.6,
    review_count: 5,
    distance_m: 290,
  },
  {
    toilet_id: 9,
    name: 'ห้องน้ำ ท่าพระจันทร์ / ริมแม่น้ำเจ้าพระยา',
    description: 'จุดบริการห้องน้ำริมแม่น้ำเจ้าพระยา ท่าพระจันทร์',
    building_id: 19,
    building_name: 'ตึกโดม (ริมน้ำเจ้าพระยา)',
    floor: 1,
    location_lat: 13.7552,
    location_lng: 100.4898,
    location_text: 'จุดบริการห้องน้ำริมแม่น้ำเจ้าพระยา ท่าพระจันทร์',
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: false,
    facilities: ['สายฉีดชำระ', 'สบู่ล้างมือ'],
    avg_rating: 4.5,
    review_count: 3,
    distance_m: 320,
  },
  {
    toilet_id: 10,
    name: 'ห้องน้ำ อาคารธรรมศาสตร์ 60 ปี ชั้น 1',
    description: 'อาคารธรรมศาสตร์ 60 ปี ชั้น 1 โถงประชุม',
    building_id: 3,
    building_name: 'อาคารธรรมศาสตร์ 60 ปี',
    floor: 1,
    location_lat: 13.7540,
    location_lng: 100.4910,
    location_text: 'อาคารธรรมศาสตร์ 60 ปี ชั้น 1 โถงประชุม',
    toilet_type: 'แยกเพศ',
    status: 'ใช้งานได้',
    has_bidet: true,
    has_disabled_access: true,
    facilities: ['สายฉีดชำระ', 'ห้องน้ำผู้พิการ', 'ผ้าอนามัย', 'กระจกบานใหญ่'],
    avg_rating: 4.9,
    review_count: 6,
    distance_m: 350,
  },
];

const EXPANDING_RADII = [300, 500, 1000, 3000] as const;

function calculateHaversineDistanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function buildFilterPayload(filter: FilterKey): Record<string, unknown> {
  switch (filter) {
    case 'has_disabled_access':
      return { has_disabled_access: true };
    case 'has_bidet':
      return { has_bidet: true };
    case 'sanitary':
      return { facility: 'ผ้าอนามัย' };
    default:
      return {};
  }
}

function formatDistance(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} ม.`;
  return `${(distanceM / 1000).toFixed(2)} กม.`;
}

export default function LiffMapPage() {
  const router = useRouter();
  const { coords, isLocating, isDarkMode, requestGpsLocation } = useLiff();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedRadius, setSelectedRadius] = useState<number | 'auto'>('auto');
  const [usedRadiusM, setUsedRadiusM] = useState<number>(500);
  const [toilets, setToilets] = useState<NearbyToiletItem[]>(FALLBACK_CAMPUS_TOILETS);
  const [selectedToilet, setSelectedToilet] = useState<NearbyToiletItem | null>(FALLBACK_CAMPUS_TOILETS[0]);
  const [requestedToiletId, setRequestedToiletId] = useState<number | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    // 1. Deep link to report tab: tab=report or tab=review
    const tab = params.get('tab');
    if (tab === 'report' || tab === 'review') {
      const extraTid = params.get('toilet_id') || params.get('toiletId');
      router.replace(`/liff/report?tab=${tab}${extraTid ? `&toilet_id=${extraTid}` : ''}`);
      return;
    }

    // 2. Query filter (supports aliases: accessible, bidet, sanitary, has_disabled_access, has_bidet)
    const rawFilter = params.get('filter');
    if (rawFilter) {
      if (rawFilter === 'accessible' || rawFilter === 'disabled' || rawFilter === 'has_disabled_access') {
        setActiveFilter('has_disabled_access');
      } else if (rawFilter === 'bidet' || rawFilter === 'has_bidet') {
        setActiveFilter('has_bidet');
      } else if (rawFilter === 'sanitary') {
        setActiveFilter('sanitary');
      } else if (rawFilter === 'all') {
        setActiveFilter('all');
      }
    }

    // 3. Deep link to toilet: toiletId or toilet_id
    const tid = Number(params.get('toiletId') || params.get('toilet_id'));
    if (tid && !Number.isNaN(tid)) {
      setRequestedToiletId(tid);
      setIsDetailSheetOpen(true);
    }
  }, [router]);

  const supabase = useMemo(() => {
    const cfg = getSupabaseConfig();
    return createSupabaseClientInstance(cfg.url, cfg.key);
  }, []);

  const fetchNearbyToilets = useCallback(async () => {
    if (!supabase) {
      setErrorMessage('ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL / ANON_KEY ใน .env.local');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    const filtersJson = buildFilterPayload(activeFilter);

    const fetchFallback = async (): Promise<NearbyToiletItem[]> => {
      try {
        const { data: rawRows, error: fallbackError } = await supabase
          .from('toilets')
          .select(
            `
            toilet_id,
            name,
            description,
            building_id,
            floor,
            location_lat,
            location_lng,
            location_text,
            toilet_type,
            status,
            has_bidet,
            has_disabled_access,
            facilities,
            open_hours,
            avg_rating,
            buildings (building_name)
          `
          )
          .eq('status', 'ใช้งานได้');

        if (fallbackError || !Array.isArray(rawRows)) {
          console.warn('Fallback toilets query error:', fallbackError);
          return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mapped: NearbyToiletItem[] = rawRows.map((row: any) => {
          const lat = Number(row.location_lat || 13.7563);
          const lng = Number(row.location_lng || 100.4914);
          const dist = calculateHaversineDistanceM(coords.lat, coords.lng, lat, lng);
          const buildingName = row.buildings?.building_name || 'มธ. ท่าพระจันทร์';
          return {
            toilet_id: Number(row.toilet_id),
            name: row.name || row.location_text || `ห้องน้ำ #${row.toilet_id}`,
            description: row.description,
            building_id: row.building_id,
            building_name: buildingName,
            floor: row.floor,
            location_lat: lat,
            location_lng: lng,
            location_text: row.location_text,
            toilet_type: row.toilet_type,
            status: row.status || 'ใช้งานได้',
            has_bidet: row.has_bidet,
            has_disabled_access: row.has_disabled_access,
            facilities: row.facilities || [],
            avg_rating: row.avg_rating,
            review_count: 0,
            distance_m: dist,
          };
        });

        if (activeFilter === 'has_disabled_access') {
          mapped = mapped.filter((t) => t.has_disabled_access === true);
        } else if (activeFilter === 'has_bidet') {
          mapped = mapped.filter((t) => t.has_bidet === true);
        } else if (activeFilter === 'sanitary') {
          mapped = mapped.filter(
            (t) => Array.isArray(t.facilities) && t.facilities.includes('ผ้าอนามัย')
          );
        }

        mapped.sort((a, b) => a.distance_m - b.distance_m);
        return mapped;
      } catch (err) {
        console.warn('Fallback toilets execution failed:', err);
        return [];
      }
    };

    try {
      if (selectedRadius === 'auto') {
        let found: NearbyToiletItem[] = [];
        let finalRadius = 300;
        for (const r of EXPANDING_RADII) {
          const { data, error } = await supabase.rpc('nearby_toilets', {
            lat: coords.lat,
            lng: coords.lng,
            radius_m: r,
            limit_n: 30,
            filters: filtersJson,
          });
          if (!error && Array.isArray(data) && data.length > 0) {
            found = data as NearbyToiletItem[];
            finalRadius = r;
            break;
          }
          finalRadius = r;
        }

        const getSafeFallback = (fb: NearbyToiletItem[]) => {
          if (fb.length > 0) return fb;
          return FALLBACK_CAMPUS_TOILETS.map((t) => ({
            ...t,
            distance_m: calculateHaversineDistanceM(coords.lat, coords.lng, t.location_lat, t.location_lng),
          }));
        };

        // If RPC found 0 toilets (e.g. user is testing outside Thammasat > 3km), use direct table fallback
        if (found.length === 0) {
          const fallbackData = await fetchFallback();
          found = getSafeFallback(fallbackData);
        }

        setToilets(found);
        setUsedRadiusM(finalRadius);
        const matched = requestedToiletId
          ? found.find((t) => Number(t.toilet_id) === requestedToiletId)
          : null;
        setSelectedToilet(matched || found[0] || null);
        setErrorMessage(null);
      } else {
        const { data, error } = await supabase.rpc('nearby_toilets', {
          lat: coords.lat,
          lng: coords.lng,
          radius_m: selectedRadius,
          limit_n: 30,
          filters: filtersJson,
        });

        let rows = (!error && Array.isArray(data) ? data : []) as NearbyToiletItem[];
        if (rows.length === 0) {
          const fallbackData = await fetchFallback();
          const getSafeFallback = (fb: NearbyToiletItem[]) => {
            if (fb.length > 0) return fb;
            return FALLBACK_CAMPUS_TOILETS.map((t) => ({
              ...t,
              distance_m: calculateHaversineDistanceM(coords.lat, coords.lng, t.location_lat, t.location_lng),
            }));
          };
          rows = getSafeFallback(fallbackData);
        }

        setToilets(rows);
        setUsedRadiusM(selectedRadius);
        const matched = requestedToiletId
          ? rows.find((t) => Number(t.toilet_id) === requestedToiletId)
          : null;
        setSelectedToilet(matched || rows[0] || null);
        setErrorMessage(null);
      }
    } catch (err: unknown) {
      console.warn('nearby_toilets RPC failed, running fallback query:', err);
      const fallbackData = await fetchFallback();
      const rows = fallbackData.length > 0
        ? fallbackData
        : FALLBACK_CAMPUS_TOILETS.map((t) => ({
            ...t,
            distance_m: calculateHaversineDistanceM(coords.lat, coords.lng, t.location_lat, t.location_lng),
          }));
      setToilets(rows);
      const matched = requestedToiletId
        ? rows.find((t) => Number(t.toilet_id) === requestedToiletId)
        : null;
      setSelectedToilet(matched || rows[0] || null);
      setErrorMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, coords.lat, coords.lng, activeFilter, selectedRadius, requestedToiletId]);

  useEffect(() => {
    fetchNearbyToilets();
  }, [fetchNearbyToilets]);

  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#E2E8F0';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const textPrimary = isDarkMode ? '#F8FAFC' : '#0F172A';
  const badgeBg = isDarkMode ? '#0F172A' : '#F1F5F9';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
      {/* Location & GPS Control Card */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDarkMode ? '#C7D2FE' : '#000066'}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
              <circle cx="12" cy="11" r="2.2" />
            </svg>
            <span style={{ fontWeight: 700, color: textPrimary }}>{coords.label}</span>
            <span style={{ color: subText, fontSize: '11px' }}>
              ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
            </span>
          </div>

          <button
            onClick={requestGpsLocation}
            disabled={isLocating}
            style={{
              backgroundColor: '#000066',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
            </svg>
            <span>{isLocating ? 'กำลังหาพิกัด...' : 'ตำแหน่งปัจจุบัน'}</span>
          </button>
        </div>

        {/* Radius Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <span style={{ color: subText, fontWeight: 600 }}>รัศมีค้นหา:</span>
            <select
              value={selectedRadius}
              onChange={(e) =>
                setSelectedRadius(e.target.value === 'auto' ? 'auto' : Number(e.target.value))
              }
              style={{
                backgroundColor: cardBg,
                color: textPrimary,
                border: `1px solid ${cardBorder}`,
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <option value="auto">อัตโนมัติ ({usedRadiusM} ม.)</option>
              <option value={300}>300 เมตร</option>
              <option value={500}>500 เมตร</option>
              <option value={1000}>1 กิโลเมตร</option>
              <option value={3000}>3 กิโลเมตร</option>
            </select>
          </div>
        </div>
      </div>

      {/* Minimalist Capsule Filter Pills Row */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {FILTER_OPTIONS.map((item) => {
          const active = activeFilter === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveFilter(item.key)}
              style={{
                whiteSpace: 'nowrap',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: active ? '1px solid #000066' : `1px solid ${cardBorder}`,
                backgroundColor: active ? '#000066' : cardBg,
                color: active ? '#FFFFFF' : textPrimary,
                fontWeight: active ? 700 : 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Real Leaflet + OpenStreetMap Interactive Map */}
      <LeafletMap
        userLat={coords.lat}
        userLng={coords.lng}
        userLabel={coords.label}
        radiusM={usedRadiusM}
        toilets={toilets}
        selectedToiletId={selectedToilet?.toilet_id ?? null}
        isDarkMode={isDarkMode}
        onSelectToilet={(t) => {
          setSelectedToilet(t);
          setIsDetailSheetOpen(true);
        }}
      />

      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '4px',
        }}
      >
        <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: textPrimary }}>
          ห้องน้ำใกล้คุณ ({toilets.length} แห่ง • รัศมี {usedRadiusM} ม.)
        </h2>
        <span style={{ fontSize: '11px', color: subText }}>แตะการ์ดเพื่อดูตำแหน่งบนแผนที่</span>
      </div>

      {errorMessage && toilets.length === 0 && (
        <div
          style={{
            backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
            color: textPrimary,
            border: `1px solid ${cardBorder}`,
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: subText,
            fontSize: '13px',
          }}
        >
          กำลังค้นหาห้องน้ำใกล้คุณ...
        </div>
      ) : toilets.length === 0 ? (
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '16px',
            padding: '28px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '14px', color: textPrimary }}>
            ไม่พบห้องน้ำที่ตรงกับตัวกรองที่เลือก
          </div>
          <div style={{ fontSize: '12px', color: subText, marginTop: '4px' }}>
            ลองแตะตัวกรอง &ldquo;ทั้งหมด&rdquo; ด้านบนเพื่อดูห้องน้ำทั้งหมดในมหาวิทยาลัย
          </div>
        </div>
      ) : (
        /* Minimalist Toilet Cards List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {toilets.map((t, index) => {
            const isSelected = selectedToilet?.toilet_id === t.toilet_id;
            const facilities = Array.isArray(t.facilities) ? t.facilities : [];
            const numRating = Number(t.avg_rating || 0);
            const revCount = Number(t.review_count || 0);
            const effectiveRating = revCount <= 0 ? 5.0 : numRating;
            const isGoldStar =
              revCount <= 0 || Math.abs(effectiveRating - 5.0) < 0.001 || effectiveRating >= 5.0;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${t.location_lat},${t.location_lng}&travelmode=walking`;
            const buildingFloorTitle = t.floor
              ? `${t.building_name || 'มธ. ท่าพระจันทร์'} F${t.floor}`
              : t.building_name || 'มธ. ท่าพระจันทร์';

            return (
              <div
                key={t.toilet_id}
                onClick={() => {
                  setSelectedToilet(t);
                  setIsDetailSheetOpen(true);
                }}
                style={{
                  backgroundColor: cardBg,
                  border: isSelected ? '1.5px solid #000066' : `1px solid ${cardBorder}`,
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(0, 0, 102, 0.08)'
                    : '0 2px 8px rgba(15, 23, 42, 0.03)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Top row: Rank + Building/Floor + Distance */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: '#000066',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '9999px',
                      }}
                    >
                      ลำดับที่ {index + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: formatToiletStatus(t.status, true) === 'เปิด' ? '#16A34A' : '#DC2626',
                      }}
                    >
                      {formatToiletStatus(t.status, true)}
                    </span>
                  </div>

                  <span
                    style={{
                      color: isDarkMode ? '#C7D2FE' : '#000066',
                      fontSize: '15px',
                      fontWeight: 800,
                    }}
                  >
                    ห่าง {formatDistance(t.distance_m)}
                  </span>
                </div>

                {/* Building + Floor & Spot Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: isDarkMode ? '#F8FAFC' : '#000066',
                      lineHeight: 1.3,
                    }}
                  >
                    {buildingFloorTitle}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                    {t.name}
                    {(t.description || t.location_text) &&
                    (t.description || t.location_text) !== t.name
                      ? ` — ${t.description || t.location_text}`
                      : ''}
                  </div>
                </div>

                {/* Rating & Disabled Access Summary */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    paddingTop: '8px',
                    borderTop: `1px solid ${cardBorder}`,
                  }}
                >
                  <span style={{ color: subText }}>
                    ห้องน้ำผู้พิการ:{' '}
                    <strong style={{ color: textPrimary }}>
                      {t.has_disabled_access ? 'มีให้บริการ' : 'ไม่มีให้บริการ'}
                    </strong>
                  </span>
                  <span style={{ fontWeight: 700, color: textPrimary }}>
                    <span style={{ color: isGoldStar ? '#FBBC04' : '#475569' }}>★ </span>
                    {effectiveRating.toFixed(1)} ({revCount} รีวิว)
                  </span>
                </div>

                {/* Facility Capsules */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {facilities.map((fac) => (
                    <span
                      key={fac}
                      style={{
                        backgroundColor: badgeBg,
                        color: subText,
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        border: `1px solid ${cardBorder}`,
                      }}
                    >
                      {fac}
                    </span>
                  ))}
                </div>

                {/* Minimalist Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      backgroundColor: '#000066',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      textAlign: 'center',
                      padding: '10px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    นำทาง
                  </a>
                  <a
                    href={`/liff/toilet/${t.toilet_id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      backgroundColor: cardBg,
                      color: isDarkMode ? '#F8FAFC' : '#000066',
                      textDecoration: 'none',
                      textAlign: 'center',
                      padding: '10px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: `1px solid ${isDarkMode ? '#475569' : '#000066'}`,
                    }}
                  >
                    ดูรายละเอียด / รีวิว
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toilet Detail Bottom Sheet / Modal */}
      {isDetailSheetOpen && selectedToilet && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setIsDetailSheetOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: cardBg,
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '20px 20px 32px 20px',
              boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber bar */}
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: cardBorder,
                margin: '0 auto 4px auto',
              }}
            />

            {/* Header: Building + Floor & Close button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isDarkMode ? '#C7D2FE' : '#000066',
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedToilet.floor
                    ? `${selectedToilet.building_name || 'มธ. ท่าพระจันทร์'} F${selectedToilet.floor}`
                    : selectedToilet.building_name || 'มธ. ท่าพระจันทร์'}
                </div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    margin: '3px 0 0 0',
                    color: textPrimary,
                  }}
                >
                  {selectedToilet.name}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailSheetOpen(false)}
                style={{
                  background: badgeBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '9999px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: subText,
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Status & Distance & Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor:
                    formatToiletStatus(selectedToilet.status, true) === 'เปิด'
                      ? '#DCFCE7'
                      : '#FEE2E2',
                  color:
                    formatToiletStatus(selectedToilet.status, true) === 'เปิด'
                      ? '#15803D'
                      : '#B91C1C',
                }}
              >
                ● {formatToiletStatus(selectedToilet.status, true)} (08:30 - 19:00)
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>
                ห่าง {formatDistance(selectedToilet.distance_m)}
              </span>
              <span
                style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, marginLeft: 'auto' }}
              >
                <span style={{ color: '#FBBC04' }}>★ </span>
                {Number(selectedToilet.avg_rating || 5.0).toFixed(1)}
              </span>
            </div>

            {/* Description */}
            {(selectedToilet.description || selectedToilet.location_text) && (
              <div style={{ fontSize: '13px', color: subText, lineHeight: 1.45 }}>
                📍 {selectedToilet.description || selectedToilet.location_text}
              </div>
            )}

            {/* Facilities pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(selectedToilet.facilities || []).map((fac) => (
                <span
                  key={fac}
                  style={{
                    backgroundColor: badgeBg,
                    color: textPrimary,
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  {fac}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedToilet.location_lat},${selectedToilet.location_lng}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#000066',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                นำทางผ่าน Google Maps
              </a>
              <a
                href={`/liff/toilet/${selectedToilet.toilet_id}`}
                style={{
                  backgroundColor: cardBg,
                  color: '#000066',
                  textDecoration: 'none',
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: '1.5px solid #000066',
                }}
              >
                ดูรีวิวทั้งหมด / แจ้งปัญหาจุดนี้
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
