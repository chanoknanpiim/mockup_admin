'use client';

import React, { useState, useRef } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { ReportItem } from '@/lib/types';

const STATUS_TYPES = [
  'น้ำไม่ไหล',
  'ประตูชำรุด',
  'สายชำระชำรุด',
  'ความสะอาด',
  'กระดาษทิชชู่หมด',
  'สบู่หมด',
  'อื่น ๆ',
];

export default function ReportsPage() {
  const {
    reports,
    toilets,
    getToiletLabel,
    submitNewReport,
    updateReportResolution,
    deleteReport,
  } = useAdminData();

  const [filterType, setFilterType] = useState('');
  const [filterResolution, setFilterResolution] = useState('');

  // New Report Modal State
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedToiletId, setSelectedToiletId] = useState<number>(toilets[0]?.toilet_id || 1);
  const [statusType, setStatusType] = useState('น้ำไม่ไหล');
  const [statusDetail, setStatusDetail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report Detail Modal State
  const [detailReport, setDetailReport] = useState<ReportItem | null>(null);
  const [detailResolutionStatus, setDetailResolutionStatus] = useState<string>('pending');
  const [detailToiletStatus, setDetailToiletStatus] = useState('ใช้งานได้');

  const openNewReportModal = () => {
    setSelectedToiletId(toilets[0]?.toilet_id || 1);
    setStatusType('น้ำไม่ไหล');
    setStatusDetail('');
    setPhotoFile(null);
    setPhotoPreview('');
    setNewModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoPreview(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitNewReport = async () => {
    if (!statusDetail.trim()) {
      alert('กรุณากรอกรายละเอียดปัญหาเพิ่มเติม');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await submitNewReport({
        toilet_id: Number(selectedToiletId),
        status_type: statusType,
        status_detail: statusDetail.trim(),
        file: photoFile,
        photoDataUrl: photoPreview,
      });
      if (ok) {
        setNewModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReportDetail = (report: ReportItem) => {
    setDetailReport(report);
    setDetailResolutionStatus(report.resolution_status || 'pending');
    const t = toilets.find((x) => Number(x.toilet_id) === Number(report.toilet_id));
    setDetailToiletStatus(t ? t.status : 'ใช้งานได้');
  };

  const handleSaveResolution = async () => {
    if (!detailReport) return;
    setIsSubmitting(true);
    try {
      const ok = await updateReportResolution(
        Number(detailReport.report_id),
        detailResolutionStatus,
        detailToiletStatus,
        Number(detailReport.toilet_id)
      );
      if (ok) {
        setDetailReport(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!detailReport) return;
    if (!confirm(`ต้องการลบใบแจ้งปัญหารหัส #${detailReport.report_id} ใช่หรือไม่?`)) return;
    const ok = await deleteReport(Number(detailReport.report_id));
    if (ok) {
      setDetailReport(null);
    }
  };

  const filtered = reports.filter((r) => {
    const matchType = !filterType || r.status_type === filterType;
    const currentRes = r.resolution_status || 'pending';
    const matchRes = !filterResolution || currentRes === filterResolution;
    return matchType && matchRes;
  });

  const getResolutionBadge = (status?: string | null) => {
    switch (status) {
      case 'in_progress':
        return <span className="badge" style={{ backgroundColor: '#2563EB', color: '#FFF' }}>กำลังดำเนินการซ่อม</span>;
      case 'resolved':
        return <span className="badge success">แก้ไขแล้ว</span>;
      case 'rejected':
        return <span className="badge" style={{ backgroundColor: '#94A3B8', color: '#FFF' }}>ปฏิเสธ / ยกเลิก</span>;
      case 'pending':
      default:
        return <span className="badge warning">รอดำเนินการ</span>;
    }
  };

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: '#000066', textTransform: 'uppercase', marginBottom: '4px' }}>
            PLODPLOI MAINTENANCE
          </div>
          <strong style={{ fontSize: '16px', color: '#000066' }}>
            รายการแจ้งปัญหาห้องน้ำชำรุดและติดตามงานซ่อมบำรุง
          </strong>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '13px' }}>
            ตรวจสอบเรื่องที่นักศึกษาและบุคลากรแจ้งเข้ามา อัปเดตสถานะการซ่อมบำรุง และเปลี่ยนสถานะห้องน้ำเป็นปกติหรือปิดปรับปรุง
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openNewReportModal}>
          + บันทึกแจ้งปัญหาใหม่
        </button>
      </div>

      <div className="action-bar">
        <div className="search-filter-group">
          <select
            className="form-control"
            value={filterResolution}
            onChange={(e) => setFilterResolution(e.target.value)}
          >
            <option value="">แสดงทุกสถานะงานซ่อม</option>
            <option value="pending">รอดำเนินการ (Pending)</option>
            <option value="in_progress">กำลังดำเนินการซ่อม (In Progress)</option>
            <option value="resolved">แก้ไขเสร็จสิ้น (Resolved)</option>
            <option value="rejected">ปฏิเสธ / ยกเลิก (Rejected)</option>
          </select>

          <select
            className="form-control"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">แสดงทุกประเภทปัญหา</option>
            {STATUS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>รหัส</th>
                <th style={{ width: '130px' }}>วัน-เวลาที่แจ้ง</th>
                <th>ห้องน้ำที่เกิดปัญหา</th>
                <th>ประเภทปัญหา</th>
                <th>รายละเอียด</th>
                <th style={{ width: '80px' }}>รูปถ่าย</th>
                <th>สถานะการซ่อม</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    ไม่มีรายการแจ้งปัญหาในหมวดที่เลือก
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.report_id}>
                    <td>
                      <strong style={{ color: '#000066' }}>#{r.report_id}</strong>
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748B' }}>
                      {(r.created_at || '').slice(0, 16).replace('T', ' ')}
                    </td>
                    <td>
                      <strong style={{ color: '#1E293B' }}>{getToiletLabel(r.toilet_id)}</strong>
                    </td>
                    <td>
                      <span className="badge danger">{r.status_type}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#334155' }}>
                      {r.status_detail || '-'}
                    </td>
                    <td>
                      {r.photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.photo_url}
                          alt="รูปประกอบ"
                          className="thumb-img"
                          title="คลิกเพื่อดูรูปใหญ่"
                          onClick={() => openReportDetail(r)}
                          style={{ cursor: 'pointer', borderRadius: '4px' }}
                        />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>ไม่มีรูป</span>
                      )}
                    </td>
                    <td>
                      {getResolutionBadge(r.resolution_status)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openReportDetail(r)}
                      >
                        จัดการงานซ่อม
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal บันทึกแจ้งปัญหาใหม่ */}
      {newModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: '#000066', textTransform: 'uppercase' }}>
                  PLODPLOI
                </div>
                <h3 style={{ margin: '2px 0 0', color: '#000066' }}>บันทึกแจ้งปัญหา / ชำรุด</h3>
              </div>
              <button className="icon-btn close-modal-btn" onClick={() => setNewModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-row">
                <div className="form-group half">
                  <label>
                    เลือกห้องน้ำที่เกิดปัญหา <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={selectedToiletId}
                    onChange={(e) => setSelectedToiletId(Number(e.target.value))}
                  >
                    {toilets.map((t) => (
                      <option key={t.toilet_id} value={t.toilet_id}>
                        {getToiletLabel(t.toilet_id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group half">
                  <label>
                    ประเภทปัญหาที่พบ <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={statusType}
                    onChange={(e) => setStatusType(e.target.value)}
                  >
                    {STATUS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  รายละเอียดปัญหาเพิ่มเติม <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="อธิบายอาการ เช่น สายฉีดชำระห้อง 2 น้ำรั่วแรงมาก"
                  value={statusDetail}
                  onChange={(e) => setStatusDetail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>แนบรูปถ่ายจุดที่เกิดปัญหา</label>
                <div
                  style={{
                    border: '1px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#F8FAFC',
                    textAlign: 'center',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                    id="report-photo-upload"
                  />
                  {!photoPreview ? (
                    <div>
                      <label htmlFor="report-photo-upload" className="btn btn-sm btn-outline-primary" style={{ cursor: 'pointer' }}>
                        เลือกไฟล์ภาพ
                      </label>
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                        รองรับไฟล์ JPG, PNG
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="รูปตัวอย่าง"
                        style={{ maxHeight: '140px', borderRadius: '6px', objectFit: 'cover', marginBottom: '8px' }}
                      />
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={clearPhoto}
                        >
                          ยกเลิกรูปภาพ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" disabled={isSubmitting} onClick={() => setNewModalOpen(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary btn-lg" disabled={isSubmitting} onClick={handleSubmitNewReport}>
                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'บันทึกรายงานปัญหา'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ดูรายละเอียดและอัปเดตสถานะงานซ่อม */}
      {detailReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: '#000066', textTransform: 'uppercase' }}>
                  PLODPLOI
                </div>
                <h3 style={{ margin: '2px 0 0', color: '#000066' }}>
                  จัดการงานซ่อมบำรุง #{detailReport.report_id}
                </h3>
              </div>
              <button
                className="icon-btn close-modal-btn"
                onClick={() => setDetailReport(null)}
              >
                X
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>สถานที่ห้องน้ำ</div>
                <strong style={{ fontSize: '14px', color: '#1E293B' }}>{getToiletLabel(detailReport.toilet_id)}</strong>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>ประเภทปัญหาที่พบ</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="badge danger">{detailReport.status_type}</span>
                  <span style={{ fontSize: '13px', color: '#334155' }}>{detailReport.status_detail || '-'}</span>
                </div>
              </div>

              {detailReport.photo_url && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>รูปถ่ายประกอบ</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detailReport.photo_url}
                    alt="รูปปัญหา"
                    style={{
                      width: '100%',
                      maxHeight: '220px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                    }}
                  />
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />

              <div className="form-group">
                <label>สถานะการดำเนินงาน (Resolution Status)</label>
                <select
                  className="form-control"
                  value={detailResolutionStatus}
                  onChange={(e) => setDetailResolutionStatus(e.target.value)}
                >
                  <option value="pending">รอดำเนินการ (Pending)</option>
                  <option value="in_progress">กำลังดำเนินการซ่อม (In Progress)</option>
                  <option value="resolved">แก้ไขเสร็จสิ้นแล้ว (Resolved)</option>
                  <option value="rejected">ปฏิเสธ / ยกเลิก (Rejected)</option>
                </select>
              </div>

              <div className="form-group">
                <label>ปรับสถานะของห้องน้ำจุดนี้</label>
                <select
                  className="form-control"
                  value={detailToiletStatus}
                  onChange={(e) => setDetailToiletStatus(e.target.value)}
                >
                  <option value="ใช้งานได้">ใช้งานได้ปกติ</option>
                  <option value="ปิดปรับปรุง">ชำรุด / ปิดปรับปรุง</option>
                  <option value="ทำความสะอาด">กำลังทำความสะอาด</option>
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline-danger" disabled={isSubmitting} onClick={handleDeleteReport}>
                ลบใบแจ้งงาน
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" disabled={isSubmitting} onClick={() => setDetailReport(null)}>
                  ยกเลิก
                </button>
                <button className="btn btn-primary" disabled={isSubmitting} onClick={handleSaveResolution}>
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการดำเนินการ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
