'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiff } from '@/context/LiffContext';
import { createSupabaseClientInstance, getSupabaseConfig } from '@/lib/supabase';

interface ToiletOption {
  toilet_id: number;
  name?: string | null;
  description?: string | null;
  location_text?: string | null;
  building_id?: number | null;
  floor?: number | null;
}

interface BuildingOption {
  building_id: number;
  building_name: string;
}

const REPORT_TYPES = ['น้ำไม่ไหล', 'ประตูชำรุด', 'สายชำระชำรุด', 'อื่น ๆ'] as const;
const MAX_CHARS = 1000;

const RATING_LABELS: Record<number, string> = {
  1: 'แย่มาก',
  2: 'พอใช้',
  3: 'ปานกลาง',
  4: 'ดีมาก',
  5: 'ยอดเยี่ยม',
};

function cleanToiletLabel(raw: string | null | undefined): string {
  return String(raw || '').trim();
}

export default function LiffReportAndReviewPage() {
  const router = useRouter();
  const { idToken, profile, isDarkMode } = useLiff();

  const [activeTab, setActiveTab] = useState<'review' | 'report'>('review');
  const [toilets, setToilets] = useState<ToiletOption[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [selectedToiletId, setSelectedToiletId] = useState<number>(0);

  // Review state
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');

  // Report state
  const [statusType, setStatusType] = useState<string>('น้ำไม่ไหล');
  const [statusDetail, setStatusDetail] = useState<string>('');

  // Shared photo state
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const supabase = useMemo(() => {
    const cfg = getSupabaseConfig();
    return createSupabaseClientInstance(cfg.url, cfg.key);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tid = Number(params.get('toilet_id'));
      if (tid && !Number.isNaN(tid)) {
        setSelectedToiletId(tid);
      }
      const tabParam = params.get('tab');
      if (tabParam === 'report' || tabParam === 'review') {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const [tRes, bRes] = await Promise.all([
        supabase
          .from('toilets')
          .select('toilet_id, name, description, location_text, building_id, floor')
          .order('building_id', { ascending: true })
          .order('floor', { ascending: true }),
        supabase.from('buildings').select('building_id, building_name').order('building_id'),
      ]);
      const tRows = (tRes.data || []) as ToiletOption[];
      setToilets(tRows);
      setBuildings((bRes.data || []) as BuildingOption[]);
      setSelectedToiletId((prev) => (prev ? prev : tRows[0]?.toilet_id || 0));
    })();
  }, [supabase]);

  const getBuildingName = (bid?: number | null) => {
    return buildings.find((b) => Number(b.building_id) === Number(bid))?.building_name || '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl('');
      setPhotoName('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB' });
      e.target.value = '';
      return;
    }
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedToiletId) {
      setFeedback({ type: 'error', message: 'กรุณาเลือกห้องน้ำก่อนส่งข้อมูล' });
      return;
    }
    if (!idToken) {
      setFeedback({
        type: 'error',
        message: 'ไม่พบ LIFF ID Token กรุณาเปิดผ่านแอป LINE (หรือรันบน localhost ในโหมดพัฒนา)',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload =
        activeTab === 'review'
          ? {
              actionType: 'review',
              toilet_id: selectedToiletId,
              rating,
              review_text: reviewText.trim(),
              photoDataUrl: photoDataUrl || undefined,
            }
          : {
              actionType: 'report',
              toilet_id: selectedToiletId,
              status_type: statusType,
              status_detail: statusDetail.trim(),
              photoDataUrl: photoDataUrl || undefined,
            };

      const res = await fetch('/api/liff/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถบันทึกข้อมูลได้');
      }

      setFeedback({
        type: 'success',
        message:
          activeTab === 'review'
            ? 'บันทึกรีวิวและคะแนนความสะอาดเรียบร้อยแล้ว! (หากแนบรูปภาพ รูปจะแสดงเมื่อแอดมินอนุมัติ)'
            : 'ส่งแจ้งปัญหาห้องน้ำเรียบร้อยแล้ว! แอดมินจะดำเนินการตรวจสอบโดยเร็วที่สุด',
      });
      setReviewText('');
      setStatusDetail('');
      setPhotoDataUrl('');
      setPhotoName('');
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#334155' : '#E2E8F0';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const inputBg = isDarkMode ? '#0F172A' : '#F8FAFC';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>แจ้งปัญหา & รีวิวห้องน้ำ</h1>
        <span style={{ fontSize: '11px', color: subText }}>
          ผู้ส่ง: {profile?.displayName || 'ผู้ใช้งาน LINE'}
        </span>
      </div>

      {/* Mode Switch Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: cardBg,
          padding: '6px',
          borderRadius: '12px',
          border: `1px solid ${cardBorder}`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('review');
            setFeedback(null);
          }}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'review' ? '#000066' : 'transparent',
            color: activeTab === 'review' ? '#FFFFFF' : subText,
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          ให้คะแนน & รีวิว
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('report');
            setFeedback(null);
          }}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'report' ? '#000066' : 'transparent',
            color: activeTab === 'report' ? '#FFFFFF' : subText,
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          แจ้งปัญหา / แจ้งซ่อม
        </button>
      </div>

      {feedback && (
        <div
          style={{
            backgroundColor: feedback.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: feedback.type === 'success' ? '#166534' : '#991B1B',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span>{feedback.message}</span>
          {feedback.type === 'success' && selectedToiletId > 0 && (
            <div>
              <Link
                href={`/liff/toilet/${selectedToiletId}`}
                style={{
                  color: '#000066',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  fontSize: '12px',
                }}
              >
                ไปดูหน้ารายละเอียดห้องน้ำนี้ →
              </Link>
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* 1. Select Toilet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700 }}>1. เลือกห้องน้ำ</label>
          <select
            value={selectedToiletId}
            onChange={(e) => setSelectedToiletId(Number(e.target.value))}
            style={{
              backgroundColor: inputBg,
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              border: `1px solid ${cardBorder}`,
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '13px',
            }}
          >
            {toilets.map((t) => {
              const bName = getBuildingName(t.building_id);
              const label = cleanToiletLabel(
                t.description || t.location_text || t.name || 'จุดบริการห้องน้ำ'
              );
              return (
                <option key={t.toilet_id} value={t.toilet_id}>
                  {bName ? `${bName} F${t.floor || 1} — ` : ''}
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {activeTab === 'review' ? (
          <>
            {/* Google Maps-Style 5-Star Rating Selector (Mobile-First, Centered) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700 }}>
                2. คะแนนความสะอาดและความพึงพอใจ
              </label>
              <div
                style={{
                  backgroundColor: inputBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '14px',
                  padding: '18px 12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <div
                  role="radiogroup"
                  aria-label="คะแนนความพึงพอใจ 1 ถึง 5 ดาว"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} ดาว (${RATING_LABELS[star]})`}
                        onClick={() => setRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '4px 6px',
                          margin: 0,
                          fontSize: '42px',
                          lineHeight: 1,
                          color: isFilled ? '#FBBC04' : isDarkMode ? '#475569' : '#CBD5E1',
                          textShadow: isFilled ? '0 2px 6px rgba(251, 188, 4, 0.25)' : 'none',
                          transform: rating === star ? 'scale(1.12)' : 'scale(1)',
                          transition: 'color 0.15s ease, transform 0.15s ease',
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                          userSelect: 'none',
                        }}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>

                {/* Centered Rating Description Under Stars */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    minHeight: '22px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: isDarkMode ? '#FBBF24' : '#000066',
                    }}
                  >
                    {RATING_LABELS[rating] || 'ยอดเยี่ยม'}
                  </span>
                  <span style={{ fontSize: '12px', color: subText, fontWeight: 600 }}>
                    ({rating}/5 ดาว)
                  </span>
                </div>
              </div>
            </div>

            {/* Review Comment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>3. ความคิดเห็นเพิ่มเติม</label>
                <span style={{ fontSize: '11px', color: subText }}>
                  {reviewText.length}/{MAX_CHARS}
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={MAX_CHARS}
                placeholder="เช่น ห้องน้ำสะอาดมาก มีสบู่และทิชชู่ครบ..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{
                  backgroundColor: inputBg,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Issue Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700 }}>2. ประเภทปัญหาที่พบ</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {REPORT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setStatusType(type)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: statusType === type ? '2px solid #000066' : `1px solid ${cardBorder}`,
                      backgroundColor: statusType === type ? '#EAF3FF' : inputBg,
                      color: statusType === type ? '#000066' : isDarkMode ? '#F8FAFC' : '#0F172A',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Issue Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>
                  3. รายละเอียดจุดที่ชำรุด / ปัญหาที่พบ (จำเป็น)
                </label>
                <span style={{ fontSize: '11px', color: subText }}>
                  {statusDetail.length}/{MAX_CHARS}
                </span>
              </div>
              <textarea
                rows={4}
                required
                maxLength={MAX_CHARS}
                placeholder="ระบุห้องที่ชำรุด หรืออาการที่พบเพื่อให้เจ้าหน้าที่เข้าแก้ไขได้ถูกจุด..."
                value={statusDetail}
                onChange={(e) => setStatusDetail(e.target.value)}
                style={{
                  backgroundColor: inputBg,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        )}

        {/* 4. Optional Photo Upload (Magic-byte validated on server, pending admin approval) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700 }}>
            4. แนบรูปถ่ายประกอบ (ถ้ามี — JPEG/PNG/WebP ไม่เกิน 5 MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ fontSize: '12px', color: subText }}
          />
          {photoName && (
            <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>
              เลือกรูปภาพแล้ว: {photoName} (รูปจะอยู่ในสถานะรอแอดมินอนุมัติก่อนแสดงสาธารณะ)
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: '#000066',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '13px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginTop: '4px',
          }}
        >
          {isSubmitting
            ? 'กำลังตรวจสอบสิทธิ์และบันทึกข้อมูล...'
            : activeTab === 'review'
            ? 'ส่งรีวิวห้องน้ำ'
            : 'ส่งแจ้งปัญหาห้องน้ำ'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/liff')}
          style={{
            backgroundColor: 'transparent',
            color: subText,
            border: `1px solid ${cardBorder}`,
            borderRadius: '10px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          กลับหน้าแผนที่
        </button>
      </form>
    </div>
  );
}
