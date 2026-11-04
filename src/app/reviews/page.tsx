'use client';

import React from 'react';
import { useAdminData } from '@/context/AdminDataContext';

export default function ReviewsPage() {
  const { reviews, users, getToiletLabel, deleteReview } = useAdminData();

  const handleDelete = async (reviewId: string | number) => {
    if (!confirm('ยืนยันการลบข้อความรีวิวนี้ใช่หรือไม่?')) return;
    await deleteReview(reviewId);
  };

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>ความคิดเห็นและคะแนนความสะอาด (ตาราง reviews)</strong>
          <p>รวบรวมคะแนนรีวิว (1-5 ดาว) จากนักศึกษาและบุคลากรหลังเข้าใช้งานจริง</p>
        </div>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>รหัสรีวิว</th>
                <th>วันที่รีวิว</th>
                <th>สถานที่ห้องน้ำ</th>
                <th>ผู้รีวิว</th>
                <th>คะแนนความสะอาด</th>
                <th>ความคิดเห็น</th>
                <th>ปุ่มจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    ยังไม่มีรายการรีวิวในระบบ
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const u = users.find((x) => Number(x.user_id) === Number(rev.user_id));
                  const rating = Math.min(5, Math.max(0, Number(rev.rating) || 0));
                  return (
                    <tr key={String(rev.review_id)}>
                      <td>
                        <b>{rev.review_id}</b>
                      </td>
                      <td>{(rev.created_at || '').slice(0, 10)}</td>
                      <td>
                        <b>{getToiletLabel(rev.toilet_id)}</b>
                      </td>
                      <td>{u ? u.display_name : 'ผู้ใช้งานทั่วไป'}</td>
                      <td style={{ color: '#F59E0B', fontSize: '16px' }}>
                        {'★'.repeat(rating)}
                        {'☆'.repeat(5 - rating)} ({rating}/5)
                      </td>
                      <td>{rev.review_text || '-'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(rev.review_id)}
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
