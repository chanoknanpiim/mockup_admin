'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/AdminDataContext';

export default function ReviewsPage() {
  const { reviews, users, getToiletLabel, deleteReview } = useAdminData();
  const [filterRating, setFilterRating] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleDelete = async (reviewId: string | number) => {
    if (!confirm('ยืนยันการลบข้อความรีวิวนี้ใช่หรือไม่? ข้อมูลคะแนนจะถูกคำนวณใหม่ทันที')) return;
    await deleteReview(reviewId);
  };

  const filtered = reviews.filter((rev) => {
    const rating = Number(rev.rating) || 0;
    const matchRating = !filterRating || rating === Number(filterRating);
    const text = (rev.review_text || '').toLowerCase();
    const loc = getToiletLabel(rev.toilet_id).toLowerCase();
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q || text.includes(q) || loc.includes(q);
    return matchRating && matchSearch;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: '#000066', textTransform: 'uppercase', marginBottom: '4px' }}>
            PLODPLOI REVIEWS & RATINGS
          </div>
          <strong style={{ fontSize: '16px', color: '#000066' }}>
            ความคิดเห็นและคะแนนความสะอาดจากผู้ใช้งานจริง
          </strong>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '13px' }}>
            รวบรวมคะแนนรีวิว (1-5 ดาว) จากนักศึกษาและบุคลากรผ่านเว็บ LIFF สำหรับตรวจสอบความพึงพอใจและดูแลความเหมาะสมของข้อความ
          </p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>คะแนนเฉลี่ยรวม</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#000066', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#FBBC04' }}>★</span> {avgRating}
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>/ 5.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <div className="search-filter-group">
          <input
            type="text"
            className="form-control"
            placeholder="ค้นหาข้อความรีวิว หรือชื่อห้องน้ำ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-control"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="">แสดงทุกระดับคะแนน ({reviews.length} รีวิว)</option>
            <option value="5">5 ดาว (ดีเยี่ยม)</option>
            <option value="4">4 ดาว (ดี)</option>
            <option value="3">3 ดาว (ปานกลาง)</option>
            <option value="2">2 ดาว (ควรปรับปรุง)</option>
            <option value="1">1 ดาว (ต้องปรับปรุงเร่งด่วน)</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>รหัส</th>
                <th style={{ width: '120px' }}>วันที่รีวิว</th>
                <th>สถานที่ห้องน้ำ</th>
                <th style={{ width: '130px' }}>ผู้รีวิว</th>
                <th style={{ width: '160px' }}>คะแนน</th>
                <th>ความคิดเห็น</th>
                <th style={{ width: '80px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    ยังไม่มีรายการรีวิวในระบบ
                  </td>
                </tr>
              ) : (
                filtered.map((rev) => {
                  const u = users.find((x) => Number(x.user_id) === Number(rev.user_id));
                  const rating = Math.min(5, Math.max(1, Number(rev.rating) || 5));
                  return (
                    <tr key={String(rev.review_id)}>
                      <td>
                        <strong style={{ color: '#000066' }}>#{rev.review_id}</strong>
                      </td>
                      <td style={{ fontSize: '13px', color: '#64748B' }}>
                        {(rev.created_at || '').slice(0, 10)}
                      </td>
                      <td>
                        <strong style={{ color: '#1E293B' }}>{getToiletLabel(rev.toilet_id)}</strong>
                      </td>
                      <td style={{ fontSize: '13px', color: '#475569' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>
                            {rev.line_display_name || u?.display_name || 'ผู้ใช้งาน LINE'}
                          </span>
                          {rev.is_anonymous && (
                            <span
                              style={{
                                display: 'inline-block',
                                width: 'fit-content',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#D97706',
                                backgroundColor: '#FEF3C7',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: '1px solid #FCD34D',
                              }}
                            >
                              (ซ่อนชื่อจากสาธารณะ)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#FBBC04', fontSize: '16px', letterSpacing: '1px' }}>
                            {'★'.repeat(rating)}
                          </span>
                          <span style={{ color: '#E2E8F0', fontSize: '16px', letterSpacing: '1px' }}>
                            {'★'.repeat(5 - rating)}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginLeft: '4px' }}>
                            ({rating}.0)
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#334155' }}>
                        {rev.review_text ? (
                          <span>&ldquo;{rev.review_text}&rdquo;</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>ไม่ได้ระบุข้อความ</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(rev.review_id)}
                          title="ลบรีวิวนี้"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
