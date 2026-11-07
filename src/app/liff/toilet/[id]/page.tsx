'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiff } from '@/context/LiffContext';
import { createSupabaseClientInstance, getSupabaseConfig } from '@/lib/supabase';
import LeafletMap, { MapToiletItem } from '@/components/LeafletMap';
import { formatToiletStatus, isCurrentlyOpenInThailand, OPERATING_HOURS_LABEL } from '@/lib/openingHours';

interface ToiletDetailRow {
  toilet_id: number;
  name?: string | null;
  description?: string | null;
  building_id?: number | null;
  floor?: number | null;
  location_lat: number;
  location_lng: number;
  location_text?: string | null;
  address?: string | null;
  toilet_type?: string | null;
  status: string;
  has_bidet?: boolean | null;
  has_disabled_access?: boolean | null;
  facilities?: string[] | null;
  cover_image_url?: string | null;
  avg_rating?: number | string | null;
}

interface ReviewRow {
  review_id: string | number;
  created_at?: string | null;
  rating: number;
  review_text?: string | null;
  line_display_name?: string | null;
  is_anonymous?: boolean | null;
}

interface PhotoRow {
  photo_id: number;
  photo_url: string;
  caption?: string | null;
}

const FAVORITES_STORAGE_KEY = 'plodploi_favorite_toilet_ids';

export default function LiffToiletDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toiletId = Number(params?.id);
  const { isDarkMode } = useLiff();

  const [toilet, setToilet] = useState<ToiletDetailRow | null>(null);
  const [buildingName, setBuildingName] = useState<string>('มธ. ท่าพระจันทร์');
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<PhotoRow[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = useMemo(() => {
    const cfg = getSupabaseConfig();
    return createSupabaseClientInstance(cfg.url, cfg.key);
  }, []);

  // Load favorite state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !toiletId) return;
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];
      setIsFavorite(ids.includes(toiletId));
    } catch {
      setIsFavorite(false);
    }
  }, [toiletId]);

  const toggleFavorite = useCallback(() => {
    if (typeof window === 'undefined' || !toiletId) return;
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];
      const nextIds = ids.includes(toiletId)
        ? ids.filter((id) => id !== toiletId)
        : [...ids, toiletId];
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextIds));
      setIsFavorite(nextIds.includes(toiletId));
    } catch {
      // ignore storage errors
    }
  }, [toiletId]);

  useEffect(() => {
    if (!supabase || !toiletId || Number.isNaN(toiletId)) {
      setErrorMsg('รหัสห้องน้ำไม่ถูกต้อง');
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const { data: tRow, error: tErr } = await supabase
          .from('toilets')
          .select('*')
          .eq('toilet_id', toiletId)
          .maybeSingle();

        if (tErr) throw tErr;
        if (!tRow) {
          setErrorMsg('ไม่พบข้อมูลห้องน้ำที่คุณค้นหา');
          setIsLoading(false);
          return;
        }

        setToilet(tRow as ToiletDetailRow);

        const [bRes, revRes, photoRes] = await Promise.all([
          tRow.building_id
            ? supabase
                .from('buildings')
                .select('building_name')
                .eq('building_id', tRow.building_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          supabase
            .from('reviews')
            .select('review_id, created_at, rating, review_text, line_display_name, is_anonymous')
            .eq('toilet_id', toiletId)
            .order('created_at', { ascending: false }),
          supabase
            .from('toilet_photos')
            .select('photo_id, photo_url, caption')
            .eq('toilet_id', toiletId)
            .order('created_at', { ascending: false }),
        ]);

        if (bRes.data?.building_name) {
          setBuildingName(bRes.data.building_name);
        }
        setReviews((revRes.data || []) as ReviewRow[]);

        // Condition 4: Only show approved photos publicly (hide `[PENDING_APPROVAL]`)
        const publicPhotos = ((photoRes.data || []) as PhotoRow[]).filter(
          (p) => !String(p.caption || '').startsWith('[PENDING_APPROVAL]')
        );
        setApprovedPhotos(publicPhotos);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [supabase, toiletId]);

  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#E2E8F0';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const primaryColor = isDarkMode ? '#90CAF9' : '#000066';

  if (isLoading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: subText }}>
        กำลังโหลดรายละเอียดห้องน้ำ...
      </div>
    );
  }

  if (errorMsg || !toilet) {
    return (
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: 600,
          }}
        >
          {errorMsg || 'ไม่พบข้อมูลห้องน้ำ'}
        </div>
        <button
          onClick={() => router.push('/liff')}
          style={{
            backgroundColor: '#000066',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← กลับหน้าแผนที่ค้นหาห้องน้ำ
        </button>
      </div>
    );
  }

  const cleanSpotTitle = toilet.name || toilet.location_text || `ห้องน้ำ #${toilet.toilet_id}`;
  const spotDescription = toilet.description || toilet.location_text || '';
  const facilities = Array.isArray(toilet.facilities) ? toilet.facilities.filter(Boolean) : [];
  const avgRating = Number(toilet.avg_rating || 0);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${toilet.location_lat},${toilet.location_lng}&travelmode=walking`;

  const mapToiletItem: MapToiletItem = {
    toilet_id: toilet.toilet_id,
    name: cleanSpotTitle,
    building_name: buildingName,
    floor: toilet.floor,
    location_lat: toilet.location_lat,
    location_lng: toilet.location_lng,
    toilet_type: toilet.toilet_type,
    status: toilet.status,
    facilities,
    avg_rating: avgRating,
    review_count: reviews.length,
    distance_m: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '14px' }}>
      {/* Top Back Bar + Favorite Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href="/liff"
          style={{
            textDecoration: 'none',
            color: primaryColor,
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          ← กลับหน้าแผนที่
        </Link>

        <button
          onClick={toggleFavorite}
          style={{
            backgroundColor: isFavorite ? '#000066' : cardBg,
            color: isFavorite ? '#FFFFFF' : primaryColor,
            border: `1px solid ${isFavorite ? '#000066' : cardBorder}`,
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span>{isFavorite ? 'บันทึกไว้แล้ว' : 'บันทึกห้องน้ำนี้'}</span>
        </button>
      </div>

      {/* Minimalist Fashion-Style Detail Card (Matches Flex Message #000066) */}
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${cardBorder}`,
          boxShadow: '0 4px 16px rgba(0, 0, 102, 0.08)',
        }}
      >
        {/* Header #000066 */}
        <div
          style={{
            backgroundColor: '#000066',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '3px' }}>
            PLODPLOI
          </span>
          <span style={{ color: '#C7D2FE', fontSize: '12px', fontWeight: 700 }}>
            {formatToiletStatus(toilet.status, false)}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: subText, fontWeight: 700 }}>
            {cleanSpotTitle}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 800,
              color: primaryColor,
              lineHeight: 1.3,
            }}
          >
            {toilet.floor ? `${buildingName} F${toilet.floor}` : buildingName}
          </h1>

          {spotDescription && (
            <div style={{ fontSize: '13px', color: subText, fontWeight: 500 }}>
              {spotDescription}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: `1px solid ${cardBorder}`, margin: '6px 0' }} />

          {/* Key-Value Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            {/* Row 1: เวลาให้บริการ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: subText }}>เวลาให้บริการ</span>
              <strong style={{ color: isCurrentlyOpenInThailand() ? '#16A34A' : '#DC2626' }}>
                {OPERATING_HOURS_LABEL} ({isCurrentlyOpenInThailand() ? 'เปิดอยู่' : 'ปิดให้บริการ'})
              </strong>
            </div>
            <hr style={{ border: 'none', borderTop: `1px solid ${cardBorder}`, margin: 0 }} />

            {/* Row 2: คะแนน */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: subText }}>คะแนน</span>
              <strong>
                <span
                  style={{
                    color:
                      reviews.length === 0 || Math.abs(avgRating - 5.0) < 0.001 || avgRating >= 5.0
                        ? '#FBBC04'
                        : '#475569',
                  }}
                >
                  ★{' '}
                </span>
                <span>
                  {(reviews.length === 0 ? 5.0 : avgRating).toFixed(1)} ({reviews.length} รีวิว)
                </span>
              </strong>
            </div>
            <hr style={{ border: 'none', borderTop: `1px solid ${cardBorder}`, margin: 0 }} />

            {/* Row 3: ห้องน้ำผู้พิการ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: subText }}>ห้องน้ำผู้พิการ</span>
              <strong>{toilet.has_disabled_access ? 'มีให้บริการ' : 'ไม่มีให้บริการ'}</strong>
            </div>
            <hr style={{ border: 'none', borderTop: `1px solid ${cardBorder}`, margin: 0 }} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <span style={{ color: subText, whiteSpace: 'nowrap' }}>สิ่งอำนวยความสะดวก</span>
              <span style={{ textAlign: 'right', lineHeight: 1.45 }}>
                {facilities.length > 0 ? facilities.join(', ') : 'ห้องน้ำมาตรฐาน'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#000066',
                color: '#FFFFFF',
                textDecoration: 'none',
                textAlign: 'center',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              นำทาง
            </a>
            <Link
              href={`/liff/report?toilet_id=${toilet.toilet_id}`}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#000066',
                border: '1px solid #000066',
                textDecoration: 'none',
                textAlign: 'center',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              เขียนรีวิว / แจ้งปัญหาห้องน้ำนี้
            </Link>
          </div>
        </div>
      </div>

      {/* Mini Leaflet + OpenStreetMap Map */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
          ตำแหน่งบนแผนที่ OpenStreetMap
        </h2>
        <LeafletMap
          userLat={toilet.location_lat}
          userLng={toilet.location_lng}
          userLabel={cleanSpotTitle}
          radiusM={100}
          toilets={[mapToiletItem]}
          selectedToiletId={toilet.toilet_id}
          isDarkMode={isDarkMode}
          onSelectToilet={() => {}}
        />
      </div>

      {/* Approved Photos Section (if any) */}
      {approvedPhotos.length > 0 && (
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <h2 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0' }}>
            รูปภาพห้องน้ำ ({approvedPhotos.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {approvedPhotos.map((p) => (
              <img
                key={p.photo_id}
                src={p.photo_url}
                alt={p.caption || cleanSpotTitle}
                style={{
                  width: '160px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  border: `1px solid ${cardBorder}`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews List Section */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
            รีวิวจากผู้ใช้งาน ({reviews.length})
          </h2>
          <Link
            href={`/liff/report?toilet_id=${toilet.toilet_id}&tab=review`}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: primaryColor,
              textDecoration: 'none',
            }}
          >
            + เขียนรีวิว
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div style={{ fontSize: '13px', color: subText, padding: '12px 0' }}>
            ยังไม่มีรีวิวสำหรับห้องน้ำนี้ ร่วมเป็นคนแรกที่รีวิวความสะอาดได้เลย!
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.review_id}
              style={{
                borderTop: `1px solid ${cardBorder}`,
                paddingTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                  {'★'.repeat(Math.max(1, Math.min(5, Number(rev.rating || 5))))} (
                  {rev.rating}/5)
                </span>
                <span style={{ color: subText, fontSize: '11px' }}>
                  {rev.is_anonymous ? 'ผู้ใช้งานไม่ประสงค์ออกนาม' : (rev.line_display_name || 'ผู้ใช้งาน LINE')} •{' '}
                  {rev.created_at
                    ? new Date(rev.created_at).toLocaleDateString('th-TH')
                    : ''}
                </span>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
                {rev.review_text || 'สะอาด ใช้งานได้ดี'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
