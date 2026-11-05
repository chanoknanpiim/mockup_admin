'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useLiff } from '@/context/LiffContext';
import { createSupabaseClientInstance, getSupabaseConfig } from '@/lib/supabase';

interface MyReviewItem {
  review_id: string;
  toilet_id: number;
  rating: number;
  review_text: string;
  created_at: string;
}

interface MyReportItem {
  report_id: number;
  toilet_id: number;
  status_type: string;
  status_detail: string;
  resolution_status: string;
  created_at: string;
}

interface ToiletSummary {
  toilet_id: number;
  name?: string | null;
  description?: string | null;
  location_text?: string | null;
  floor?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;
}

const FAVORITES_STORAGE_KEY = 'plodploi_favorite_toilet_ids';

export default function LiffProfilePage() {
  const { profile, idToken, isDarkMode } = useLiff();
  const [activeTab, setActiveTab] = useState<'favorites' | 'reviews' | 'history'>('favorites');

  const [favoriteToilets, setFavoriteToilets] = useState<ToiletSummary[]>([]);
  const [toiletMap, setToiletMap] = useState<Record<number, string>>({});
  const [reviews, setReviews] = useState<MyReviewItem[]>([]);
  const [reports, setReports] = useState<MyReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = useMemo(() => {
    const cfg = getSupabaseConfig();
    return createSupabaseClientInstance(cfg.url, cfg.key);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: allToilets } = await supabase
        .from('toilets')
        .select('toilet_id, name, description, location_text, floor, location_lat, location_lng');

      const rows = (allToilets || []) as ToiletSummary[];
      const mapObj: Record<number, string> = {};
      rows.forEach((r) => {
        const clean = String(r.name || r.description || r.location_text || 'จุดบริการห้องน้ำ').trim();
        mapObj[r.toilet_id] = clean;
      });
      setToiletMap(mapObj);

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
          const favIds: number[] = raw ? JSON.parse(raw) : [];
          setFavoriteToilets(rows.filter((r) => favIds.includes(Number(r.toilet_id))));
        } catch {
          setFavoriteToilets([]);
        }
      }
    })();
  }, [supabase]);

  useEffect(() => {
    if (!idToken) {
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/liff/action', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setReports(data.reports || []);
        }
      } catch {
        // ignore network error
      } finally {
        setIsLoading(false);
      }
    })();
  }, [idToken]);

  const removeFavorite = (toiletId: number) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const favIds: number[] = raw ? JSON.parse(raw) : [];
      const next = favIds.filter((id) => id !== toiletId);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      setFavoriteToilets((prev) => prev.filter((t) => t.toilet_id !== toiletId));
    } catch {
      // ignore
    }
  };

  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#E2E8F0';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';

  const statusBadge = (status: string) => {
    if (status === 'approved' || status === 'resolved') {
      return { bg: '#DCFCE7', text: '#166534', label: 'แก้ไขแล้ว' };
    }
    if (status === 'rejected') {
      return { bg: '#FEE2E2', text: '#991B1B', label: 'ยกเลิก' };
    }
    return { bg: '#FEF3C7', text: '#92400E', label: 'รอแอดมินตรวจสอบ' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '14px' }}>
      {/* Fashion-Member Style Profile Header (#000066) */}
      <div
        style={{
          backgroundColor: '#000066',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 102, 0.16)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '3px', color: '#C7D2FE' }}>
            PLODPLOI MEMBER
          </span>
          <span style={{ fontSize: '11px', color: '#C7D2FE' }}>
            {profile?.userId === 'U_LOCAL_PREVIEW' ? 'LOCAL DEV MODE' : 'VERIFIED LINE USER'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              color: '#000066',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            {(profile?.displayName || 'U').replace('[LOCAL] ', '').charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>
              {profile?.displayName || 'ผู้ใช้งาน LINE'}
            </div>
            <div style={{ fontSize: '12px', color: '#C7D2FE' }}>
              บันทึกไว้ {favoriteToilets.length} แห่ง • รีวิว {reviews.length} ครั้ง • แจ้งซ่อม{' '}
              {reports.length} รายการ
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px',
          backgroundColor: cardBg,
          padding: '6px',
          borderRadius: '12px',
          border: `1px solid ${cardBorder}`,
        }}
      >
        {[
          { key: 'favorites', label: `ที่บันทึก (${favoriteToilets.length})` },
          { key: 'reviews', label: `รีวิว (${reviews.length})` },
          { key: 'history', label: `แจ้งซ่อม (${reports.length})` },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'favorites' | 'reviews' | 'history')}
              style={{
                padding: '9px 6px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: active ? '#000066' : 'transparent',
                color: active ? '#FFFFFF' : subText,
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: subText, fontSize: '13px' }}>
          กำลังโหลดข้อมูลของคุณ...
        </div>
      ) : activeTab === 'favorites' ? (
        favoriteToilets.length === 0 ? (
          <div
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '14px',
              padding: '24px 16px',
              textAlign: 'center',
              fontSize: '13px',
              color: subText,
            }}
          >
            ยังไม่มีห้องน้ำที่บันทึกไว้ สามารถกดปุ่ม &ldquo;บันทึกห้องน้ำนี้&rdquo; ในหน้ารายละเอียดห้องน้ำได้เลย
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {favoriteToilets.map((t) => {
              const title = toiletMap[t.toilet_id] || 'จุดบริการห้องน้ำ';
              return (
                <div
                  key={t.toilet_id}
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>
                    {title} (ชั้น {t.floor || 1})
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/liff/toilet/${t.toilet_id}`}
                      style={{
                        flex: 1,
                        backgroundColor: '#000066',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        textAlign: 'center',
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      ดูรายละเอียด
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFavorite(t.toilet_id)}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ลบออก
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'reviews' ? (
        reviews.length === 0 ? (
          <div
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '14px',
              padding: '24px 16px',
              textAlign: 'center',
              fontSize: '13px',
              color: subText,
            }}
          >
            คุณยังไม่ได้เขียนรีวิวห้องน้ำ
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reviews.map((rev) => (
              <div
                key={rev.review_id}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <Link
                    href={`/liff/toilet/${rev.toilet_id}`}
                    style={{ fontWeight: 700, color: '#000066', textDecoration: 'none' }}
                  >
                    {toiletMap[rev.toilet_id] || 'จุดบริการห้องน้ำ'}
                  </Link>
                  <span style={{ color: '#FBBC04', fontWeight: 700 }}>★ {rev.rating}/5</span>
                </div>
                <div style={{ fontSize: '13px' }}>{rev.review_text}</div>
                <div style={{ fontSize: '11px', color: subText }}>
                  {new Date(rev.created_at).toLocaleString('th-TH')}
                </div>
              </div>
            ))}
          </div>
        )
      ) : reports.length === 0 ? (
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '14px',
            padding: '24px 16px',
            textAlign: 'center',
            fontSize: '13px',
            color: subText,
          }}
        >
          ยังไม่มีประวัติการแจ้งปัญหาห้องน้ำ
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reports.map((rep) => {
            const b = statusBadge(rep.resolution_status);
            return (
              <div
                key={`rep-${rep.report_id}`}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>
                    แจ้งซ่อม: {rep.status_type}
                  </span>
                  <span
                    style={{
                      backgroundColor: b.bg,
                      color: b.text,
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {b.label}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                  {toiletMap[rep.toilet_id] || 'จุดบริการห้องน้ำ'}
                </div>
                <div style={{ fontSize: '13px', color: subText }}>{rep.status_detail}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
