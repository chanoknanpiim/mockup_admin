'use client';

import React from 'react';
import Link from 'next/link';
import { useAdminData } from '@/context/AdminDataContext';

export default function DashboardPage() {
  const { toilets, reports, getToiletLabel } = useAdminData();

  const total = toilets.length;
  const normal = toilets.filter((t) => t.status === 'ใช้งานได้' || t.status === 'ปกติ').length;
  const cleaning = toilets.filter((t) => t.status === 'ทำความสะอาด').length;
  const broken = toilets.filter((t) => t.status === 'ปิดปรับปรุง' || t.status === 'ชำรุด').length;

  const pNormal = total ? Math.round((normal / total) * 100) : 0;
  const pCleaning = total ? Math.round((cleaning / total) * 100) : 0;
  const pBroken = total ? Math.max(0, 100 - pNormal - pCleaning) : 0;

  const deg1 = pNormal;
  const deg2 = pNormal + pCleaning;

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>ยินดีต้อนรับสู่ระบบจัดการ &ldquo;ปลดปล่อย&rdquo;</strong>
          <p>
            คุณสามารถดูสรุปสถานะห้องน้ำทั้งหมดในมหาวิทยาลัย และกดที่เมนูด้านซ้ายเพื่อเพิ่ม ลบ
            หรือแก้ไขข้อมูลอาคารและห้องน้ำได้ทันที
          </p>
        </div>
        <Link href="/toilets" className="btn btn-primary">
          + ไปหน้าเพิ่ม/แก้ไขห้องน้ำ
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">ห้องน้ำทั้งหมดในระบบ</div>
          <div className="stat-value">{total}</div>
          <div className="stat-desc">จุดบริการที่ลงทะเบียนแล้ว</div>
        </div>
        <div className="stat-card success">
          <div className="stat-title">ใช้งานได้ปกติ</div>
          <div className="stat-value">{normal}</div>
          <div className="stat-desc">พร้อมให้นักศึกษาและบุคลากรใช้งาน</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-title">กำลังทำความสะอาด</div>
          <div className="stat-value">{cleaning}</div>
          <div className="stat-desc">งดใช้ชั่วคราว</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-title">ชำรุด / ปิดซ่อม</div>
          <div className="stat-value">{broken}</div>
          <div className="stat-desc">ต้องได้รับการซ่อมแซม</div>
        </div>
      </div>

      <div className="dashboard-panels">
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

        <div className="panel">
          <div className="panel-header">
            <h3>รายการแจ้งปัญหาล่าสุดจากผู้ใช้งาน</h3>
            <Link href="/reports" className="btn btn-sm btn-outline-primary">
              จัดการปัญหาทั้งหมด →
            </Link>
          </div>
          <div className="panel-body table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>วันที่แจ้ง</th>
                  <th>สถานที่ห้องน้ำ</th>
                  <th>ปัญหาที่พบ</th>
                  <th>รูปภาพ</th>
                  <th>สถานะห้องน้ำ</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>
                      ไม่มีรายการแจ้งซ่อมค้างในระบบ
                    </td>
                  </tr>
                ) : (
                  reports.slice(0, 4).map((r) => {
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

                    return (
                      <tr key={r.report_id}>
                        <td>{(r.created_at || '').slice(0, 16)}</td>
                        <td>
                          <b>{getToiletLabel(r.toilet_id)}</b>
                        </td>
                        <td>
                          <span className="text-danger">
                            <b>{r.status_type}</b>
                          </span>
                          : {r.status_detail || '-'}
                        </td>
                        <td>
                          {r.photo_url ? (
                            <Link href="/reports">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={r.photo_url}
                                alt="รูปแจ้งปัญหา"
                                className="thumb-img"
                              />
                            </Link>
                          ) : (
                            <span className="text-muted text-sm">ไม่มีรูป</span>
                          )}
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
