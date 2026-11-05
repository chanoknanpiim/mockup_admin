'use client';

import React from 'react';
import Link from 'next/link';
import { useAdminData } from '@/context/AdminDataContext';

export default function DashboardPage() {
  const { toilets, reports, reviews, getToiletLabel } = useAdminData();

  const total = toilets.length;
  const normal = toilets.filter((t) => t.status === 'ใช้งานได้' || t.status === 'ปกติ').length;
  const cleaning = toilets.filter((t) => t.status === 'ทำความสะอาด').length;
  const broken = toilets.filter((t) => t.status === 'ปิดปรับปรุง' || t.status === 'ชำรุด').length;

  const pendingReports = reports.filter((r) => !r.resolution_status || r.resolution_status === 'pending');
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : '5.0';

  const pNormal = total ? Math.round((normal / total) * 100) : 0;
  const pCleaning = total ? Math.round((cleaning / total) * 100) : 0;
  const pBroken = total ? Math.max(0, 100 - pNormal - pCleaning) : 0;

  const deg1 = pNormal;
  const deg2 = pNormal + pCleaning;

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: '#000066', textTransform: 'uppercase', marginBottom: '4px' }}>
            PLODPLOI DASHBOARD
          </div>
          <strong style={{ fontSize: '16px', color: '#000066' }}>
            ระบบบริหารจัดการห้องน้ำ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์
          </strong>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '13px' }}>
            สรุปสถานะความพร้อมใช้งานของห้องน้ำ งานแจ้งซ่อมบำรุงที่รอดำเนินการ และคะแนนความพึงพอใจจากผู้ใช้งานจริง
          </p>
        </div>
        <Link href="/toilets" className="btn btn-primary btn-lg">
          + จัดการข้อมูลห้องน้ำ
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">ห้องน้ำทั้งหมดในระบบ</div>
          <div className="stat-value">{total}</div>
          <div className="stat-desc">จุดบริการใน มธ. ท่าพระจันทร์</div>
        </div>
        <div className="stat-card success">
          <div className="stat-title">พร้อมใช้งานปกติ</div>
          <div className="stat-value">{normal}</div>
          <div className="stat-desc">คิดเป็น {pNormal}% ของจุดทั้งหมด</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-title">ชำรุด / ปิดซ่อม</div>
          <div className="stat-value">{broken}</div>
          <div className="stat-desc">{cleaning > 0 ? `และกำลังทำความสะอาด ${cleaning} จุด` : 'ต้องได้รับการซ่อมแซม'}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-title">งานแจ้งซ่อมรอดำเนินการ</div>
          <div className="stat-value">{pendingReports.length}</div>
          <div className="stat-desc">เรื่องที่รอเจ้าหน้าที่เข้าตรวจสอบ</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">คะแนนความสะอาดเฉลี่ย</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#FBBC04' }}>★</span> {avgRating}
          </div>
          <div className="stat-desc">จากทั้งหมด {reviews.length} รีวิว</div>
        </div>
      </div>

      <div className="dashboard-panels">
        {/* Panel 1: Pie Chart */}
        <div className="panel">
          <div className="panel-header">
            <h3>สัดส่วนความพร้อมใช้งานของห้องน้ำ</h3>
          </div>
          <div className="panel-body flex-center">
            <div className="chart-container">
              <div
                className="pie-chart"
                style={{
                  background: `conic-gradient(var(--success) 0% ${deg1}%, var(--warning) ${deg1}% ${deg2}%, var(--danger) ${deg2}% 100%)`,
                }}
              />
              <div className="chart-legend">
                <div>
                  <span className="dot dot-success" /> ใช้งานได้ปกติ ({pNormal}%)
                </div>
                <div>
                  <span className="dot dot-warning" /> กำลังทำความสะอาด ({pCleaning}%)
                </div>
                <div>
                  <span className="dot dot-danger" /> ชำรุด/ปิดซ่อม ({pBroken}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Recent Reports Table */}
        <div className="panel">
          <div className="panel-header">
            <h3>รายการแจ้งปัญหาล่าสุดจากผู้ใช้งาน</h3>
            <Link href="/reports" className="btn btn-sm btn-outline-primary">
              จัดการงานซ่อมทั้งหมด →
            </Link>
          </div>
          <div className="panel-body table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>วันที่แจ้ง</th>
                  <th>สถานที่ห้องน้ำ</th>
                  <th>ปัญหาที่พบ</th>
                  <th style={{ width: '90px' }}>สถานะซ่อม</th>
                  <th style={{ width: '100px' }}>สถานะห้องน้ำ</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      ไม่มีรายการแจ้งซ่อมค้างในระบบ
                    </td>
                  </tr>
                ) : (
                  reports.slice(0, 5).map((r) => {
                    const toilet = toilets.find(
                      (t) => Number(t.toilet_id) === Number(r.toilet_id)
                    );
                    const tStatus = toilet ? toilet.status : 'ใช้งานได้';
                    const badgeClass =
                      tStatus === 'ใช้งานได้' || tStatus === 'ปกติ'
                        ? 'success'
                        : tStatus === 'ปิดปรับปรุง' || tStatus === 'ชำรุด'
                        ? 'danger'
                        : 'warning';

                    const resBadgeClass =
                      r.resolution_status === 'resolved'
                        ? 'success'
                        : r.resolution_status === 'in_progress'
                        ? 'primary'
                        : 'warning';

                    const resLabel =
                      r.resolution_status === 'resolved'
                        ? 'แก้ไขแล้ว'
                        : r.resolution_status === 'in_progress'
                        ? 'กำลังซ่อม'
                        : 'รอดำเนินการ';

                    return (
                      <tr key={r.report_id}>
                        <td style={{ fontSize: '13px', color: '#64748B' }}>
                          {(r.created_at || '').slice(0, 16).replace('T', ' ')}
                        </td>
                        <td>
                          <strong>{getToiletLabel(r.toilet_id)}</strong>
                        </td>
                        <td>
                          <span className="text-danger" style={{ fontWeight: 600 }}>
                            {r.status_type}
                          </span>
                          <span style={{ fontSize: '13px', color: '#475569', marginLeft: '6px' }}>
                            {r.status_detail ? `(${r.status_detail})` : ''}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${resBadgeClass}`}>{resLabel}</span>
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{tStatus}</span>
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
    </div>
  );
}
