'use client';

import React, { useState, useRef } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { ReportItem } from '@/lib/types';

export default function ReportsPage() {
  const {
    reports,
    toilets,
    getToiletLabel,
    submitNewReport,
    updateToiletStatus,
    deleteReport,
  } = useAdminData();

  const [filterType, setFilterType] = useState('');

  // New Report Modal State
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedToiletId, setSelectedToiletId] = useState<number>(toilets[0]?.toilet_id || 101);
  const [statusType, setStatusType] = useState('น้ำไม่ไหล');
  const [statusDetail, setStatusDetail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report Detail Modal State
  const [detailReport, setDetailReport] = useState<ReportItem | null>(null);
  const [detailToiletStatus, setDetailToiletStatus] = useState('ปกติ');

  const openNewReportModal = () => {
    setSelectedToiletId(toilets[0]?.toilet_id || 101);
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
        const maxDim = 700;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
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
    const ok = await submitNewReport({
      toilet_id: Number(selectedToiletId),
      status_type: statusType,
      status_detail: statusDetail,
      file: photoFile,
      photoDataUrl: photoPreview,
    });
    if (ok) {
      setNewModalOpen(false);
    }
  };

  const openReportDetail = (report: ReportItem) => {
    setDetailReport(report);
    const t = toilets.find((x) => Number(x.toilet_id) === Number(report.toilet_id));
    setDetailToiletStatus(t ? t.status : 'ปกติ');
  };

  const handleUpdateToiletStatus = async () => {
    if (!detailReport) return;
    const ok = await updateToiletStatus(Number(detailReport.toilet_id), detailToiletStatus);
    if (ok) {
      setDetailReport(null);
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

  const filtered = reports.filter((r) => !filterType || r.status_type === filterType);

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>รายการแจ้งปัญหาห้องน้ำชำรุด / อัปโหลดรูปภาพ (ตาราง reports)</strong>
          <p>
            ตรวจสอบรายการที่ผู้ใช้แจ้งเข้ามาพร้อมรูปถ่าย
            หรือกดปุ่มด้านขวาเพื่อบันทึกแจ้งปัญหาใหม่พร้อมแนบรูปภาพประกอบ
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openNewReportModal}>
          + แจ้งปัญหาใหม่ (พร้อมแนบรูป)
        </button>
      </div>

      <div className="action-bar">
        <div className="search-filter-group">
          <select
            className="form-control"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">แสดงทุกประเภทปัญหา</option>
            <option value="น้ำไม่ไหล">น้ำไม่ไหล</option>
            <option value="ประตูปิดซ่อม">ประตูปิดซ่อม / อุปกรณ์ชำรุด</option>
            <option value="ปิดทำความสะอาด">ปิดทำความสะอาด</option>
            <option value="อื่นๆ">อื่นๆ (เช่น ทิชชู่หมด, พื้นเปียก)</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>วัน-เวลาที่แจ้ง</th>
                <th>ห้องน้ำที่เกิดปัญหา</th>
                <th>ประเภทปัญหา</th>
                <th>รายละเอียด</th>
                <th>รูปถ่ายประกอบ</th>
                <th>ปุ่มจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    ยังไม่มีรายการแจ้งปัญหาในหมวดนี้
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.report_id}>
                    <td>
                      <b>#{r.report_id}</b>
                    </td>
                    <td>{(r.created_at || '').slice(0, 16)}</td>
                    <td>
                      <b>{getToiletLabel(r.toilet_id)}</b>
                    </td>
                    <td>
                      <span className="badge danger">{r.status_type}</span>
                    </td>
                    <td>{r.status_detail || '-'}</td>
                    <td>
                      {r.photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.photo_url}
                          alt="รูปประกอบ"
                          className="thumb-img"
                          title="คลิกเพื่อดูรูปใหญ่"
                          onClick={() => openReportDetail(r)}
                        />
                      ) : (
                        <span className="text-muted text-sm">ไม่มีรูปแนบ</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openReportDetail(r)}
                      >
                        ดูรูป / อัปเดตสถานะ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal แจ้งปัญหาใหม่ */}
      {newModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>แจ้งปัญหาห้องน้ำ / อัปโหลดรูปภาพประกอบ</h3>
              <button className="icon-btn close-modal-btn" onClick={() => setNewModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body">
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
                    <option value="น้ำไม่ไหล">น้ำไม่ไหล</option>
                    <option value="ประตูปิดซ่อม">ประตูปิดซ่อม / อุปกรณ์ชำรุด</option>
                    <option value="ปิดทำความสะอาด">ปิดทำความสะอาด</option>
                    <option value="อื่นๆ">อื่นๆ (เช่น ทิชชู่หมด, พื้นเปียก)</option>
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
                  placeholder="อธิบายอาการที่พบ เช่น สายฉีดชำระห้องที่ 2 น้ำรั่วแรงมาก"
                  value={statusDetail}
                  onChange={(e) => setStatusDetail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>แนบรูปถ่ายจุดที่เกิดปัญหา (กดเลือกรูปจากมือถือหรือคอมพิวเตอร์)</label>
                <div className="upload-box">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="file-input"
                    onChange={handlePhotoChange}
                  />
                  {!photoPreview ? (
                    <div>
                      <div style={{ fontSize: '16px', marginBottom: '8px' }}>อัปโหลดรูปภาพ</div>
                      <strong>คลิกที่นี่เพื่อเลือกรูปภาพ หรือถ่ายภาพ</strong>
                      <p className="text-muted text-sm">
                        รองรับไฟล์ภาพ JPG, PNG (ระบบจะย่อขนาดอัตโนมัติเพื่อให้โหลดเร็ว)
                      </p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="ตัวอย่างรูปภาพ"
                        className="upload-preview-img"
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger mt-1"
                        onClick={clearPhoto}
                      >
                        X เปลี่ยนรูปภาพ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setNewModalOpen(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleSubmitNewReport}>
                ส่งรายงานและอัปโหลดรูป
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ดูรายละเอียดและอัปเดตสถานะห้องน้ำ */}
      {detailReport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                จัดการปัญหาที่แจ้ง{' '}
                <span className="text-muted text-sm">(#{detailReport.report_id})</span>
              </h3>
              <button
                className="icon-btn close-modal-btn"
                onClick={() => setDetailReport(null)}
              >
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="report-detail-group">
                <p className="text-muted text-sm">สถานที่ห้องน้ำ</p>
                <h4>{getToiletLabel(detailReport.toilet_id)}</h4>
              </div>
              <div className="report-detail-group mt-2">
                <p className="text-muted text-sm">ประเภทปัญหาและรายละเอียด</p>
                <h4 className="text-danger">{detailReport.status_type}</h4>
                <p className="mt-1">{detailReport.status_detail || '-'}</p>
              </div>
              {detailReport.photo_url && (
                <div className="report-detail-group mt-2">
                  <p className="text-muted text-sm">รูปถ่ายที่แนบมา</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detailReport.photo_url}
                    alt="รูปปัญหา"
                    className="report-full-img"
                  />
                </div>
              )}
              <div className="form-group mt-2">
                <label>ปรับสถานะของห้องน้ำจุดนี้ทันที</label>
                <select
                  className="form-control"
                  value={detailToiletStatus}
                  onChange={(e) => setDetailToiletStatus(e.target.value)}
                >
                  <option value="ปกติ">ซ่อมเสร็จแล้ว (เปิดใช้งานปกติ)</option>
                  <option value="ทำความสะอาด">กำลังทำความสะอาด</option>
                  <option value="ชำรุด">ชำรุด / ปิดซ่อมชั่วคราว</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-danger" onClick={handleDeleteReport}>
                ลบใบแจ้งงานนี้
              </button>
              <button className="btn btn-primary" onClick={handleUpdateToiletStatus}>
                อัปเดตสถานะห้องน้ำ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
