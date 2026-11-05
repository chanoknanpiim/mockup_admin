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

const CAMPUS_PRESET_POINTS = [
  { label: 'กลาง มธ. ท่าพระจันทร์', lat: 13.7563, lng: 100.4914 },
  { label: 'ลานโพธิ์ / พาณิชย์ฯ', lat: 13.7573, lng: 100.49 },
  { label: 'ริมน้ำ คณะเศรษฐศาสตร์', lat: 13.7578, lng: 100.4892 },
  { label: 'ฝั่งรัฐศาสตร์ / PBIC', lat: 13.7556, lng: 100.4914 },
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
  const { coords, isLocating, isDarkMode, requestGpsLocation, setCustomCoordinates } = useLiff();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedRadius, setSelectedRadius] = useState<number | 'auto'>('auto');
  const [usedRadiusM, setUsedRadiusM] = useState<number>(300);
  const [toilets, setToilets] = useState<NearbyToiletItem[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<NearbyToiletItem | null>(null);
  const [requestedToiletId, setRequestedToiletId] = useState<number | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    // 1. Deep link to report tab: tab=report
    const tab = params.get('tab');
    if (tab === 'report') {
      router.replace('/liff/report');
      return;
    }

    // 2. Query filter
    const f = params.get('filter') as FilterKey | null;
    if (f && ['all', 'has_disabled_access', 'has_bidet', 'sanitary'].includes(f)) {
      setActiveFilter(f);
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

        // If RPC found 0 toilets (e.g. user is testing outside Thammasat > 3km), use direct table fallback
        if (found.length === 0) {
          const fallbackData = await fetchFallback();
          if (fallbackData.length > 0) {
            found = fallbackData;
          }
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
          if (fallbackData.length > 0) {
            rows = fallbackData;
          }
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
      if (fallbackData.length > 0) {
        setToilets(fallbackData);
        const matched = requestedToiletId
          ? fallbackData.find((t) => Number(t.toilet_id) === requestedToiletId)
          : null;
        setSelectedToilet(matched || fallbackData[0] || null);
        setErrorMessage(null);
      } else {
        const msg = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลห้องน้ำใกล้ตัวได้';
        console.warn(msg);
        setErrorMessage(null);
      }
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

        {/* Preset Campus Spots + Radius Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {CAMPUS_PRESET_POINTS.map((pt) => {
              const isCurrent =
                Math.abs(coords.lat - pt.lat) < 0.0001 && Math.abs(coords.lng - pt.lng) < 0.0001;
              return (
                <button
                  key={pt.label}
                  onClick={() => setCustomCoordinates(pt.lat, pt.lng, pt.label)}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '11px',
                    padding: '5px 11px',
                    borderRadius: '9999px',
                    border: isCurrent ? '1px solid #000066' : `1px solid ${cardBorder}`,
                    backgroundColor: isCurrent ? '#000066' : cardBg,
                    color: isCurrent ? '#FFFFFF' : subText,
                    fontWeight: isCurrent ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {pt.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <span style={{ color: subText, fontWeight: 600 }}>รัศมี:</span>
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
