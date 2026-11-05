'use client';

import React, { useState, useRef } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { Toilet } from '@/lib/types';

export default function ToiletsPage() {
  const {
    toilets,
    buildings,
    amenities,
    toiletAmenities,
    toiletPhotos,
    getBuildingName,
    saveToilet,
    deleteToilet,
  } = useAdminData();

  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formBuildingId, setFormBuildingId] = useState<number>(buildings[0]?.building_id || 1);
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formLocationText, setFormLocationText] = useState('');
  const [formLat, setFormLat] = useState<string>('13.7563');
  const [formLng, setFormLng] = useState<string>('100.4902');
  const [formType, setFormType] = useState('แยกเพศ');
  const [formStatus, setFormStatus] = useState('ใช้งานได้');
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);

  // Photo State
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = (toilet?: Toilet) => {
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (toilet) {
      setEditingId(toilet.toilet_id);
      setFormBuildingId(Number(toilet.building_id));
      setFormFloor(Number(toilet.floor));
      setFormLocationText(toilet.location_text || '');
      setFormLat(String(toilet.location_lat ?? 13.7563));
      setFormLng(String(toilet.location_lng ?? 100.4902));
      setFormType(toilet.toilet_type || 'แยกเพศ');
      setFormStatus(toilet.status || 'ใช้งานได้');

      const linkedIds = toiletAmenities
        .filter((ta) => Number(ta.toilet_id) === Number(toilet.toilet_id))
        .map((ta) => Number(ta.amenity_id));
      setSelectedAmenities(linkedIds);

      // Find cover photo
      const cover = toiletPhotos.find(
        (p) => Number(p.toilet_id) === Number(toilet.toilet_id) && p.is_cover
      ) || toiletPhotos.find((p) => Number(p.toilet_id) === Number(toilet.toilet_id));
      setExistingPhotoUrl(cover ? cover.photo_url : '');
    } else {
      setEditingId(null);
      setFormBuildingId(buildings[0]?.building_id || 1);
      setFormFloor(1);
      setFormLocationText('');
      setFormLat('13.7563');
      setFormLng('100.4902');
      setFormType('แยกเพศ');
      setFormStatus('ใช้งานได้');
      setSelectedAmenities([]);
      setExistingPhotoUrl('');
    }
    setModalOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);
  };

  const clearSelectedPhoto = () => {
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  const handleSave = async () => {
    if (!formLocationText.trim()) {
      alert('กรุณาระบุจุดสังเกตหรือคำอธิบายห้องน้ำ');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await saveToilet({
        id: editingId,
        building_id: Number(formBuildingId),
        floor: Number(formFloor),
        location_text: formLocationText.trim(),
        location_lat: parseFloat(formLat) || 13.7563,
        location_lng: parseFloat(formLng) || 100.4902,
        toilet_type: formType,
        status: formStatus,
        selectedAmenityIds: selectedAmenities,
        photoFile: selectedPhotoFile,
      });

      if (ok) {
        setModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (toiletId: number) => {
    if (!confirm(`ยืนยันการลบห้องน้ำรหัส #${toiletId} ใช่หรือไม่? ข้อมูลพิกัดและสิ่งอำนวยความสะดวกจะถูกลบออกจากระบบทันที`)) {
      return;
    }
    await deleteToilet(toiletId);
  };

  const filtered = toilets.filter((t) => {
    const bName = getBuildingName(t.building_id).toLowerCase();
    const locText = (t.location_text || '').toLowerCase();
    const q = search.trim().toLowerCase();
    const matchSearch = !q || bName.includes(q) || locText.includes(q);
    const matchBuilding = !buildingFilter || String(t.building_id) === String(buildingFilter);
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchBuilding && matchStatus;
  });

  return (
    <div className="page-section">
      {/* Helper Banner */}
      <div className="helper-banner">
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: '#000066', textTransform: 'uppercase', marginBottom: '4px' }}>
            PLODPLOI MANAGEMENT
          </div>
          <strong style={{ fontSize: '16px', color: '#000066' }}>
            การจัดการข้อมูลห้องน้ำ มธ. ท่าพระจันทร์ (ตาราง toilets)
          </strong>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '13px' }}>
            บริหารจัดการจุดบริการห้องน้ำในมหาวิทยาลัย ปรับปรุงพิกัด GPS อัปโหลดรูปภาพจริง และอัปเดตสถานะความพร้อมใช้งาน
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => openModal()}>
          + เพิ่มห้องน้ำจุดใหม่
        </button>
      </div>

      {/* Action / Search Bar */}
      <div className="action-bar">
        <div className="search-filter-group">
          <input
            type="text"
            className="form-control"
            placeholder="ค้นหาชื่ออาคาร หรือจุดสังเกต..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-control"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="">แสดงทุกอาคาร ({buildings.length} อาคาร)</option>
            {buildings.map((b) => (
              <option key={b.building_id} value={b.building_id}>
                {b.building_name}
              </option>
            ))}
          </select>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">แสดงทุกสถานะ</option>
            <option value="ใช้งานได้">ใช้งานได้ปกติ</option>
            <option value="ทำความสะอาด">กำลังทำความสะอาด</option>
            <option value="ปิดปรับปรุง">ชำรุด / ปิดปรับปรุง</option>
          </select>
        </div>
      </div>

      {/* Toilet Data Table */}
      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>รูปภาพ</th>
                <th style={{ width: '70px' }}>รหัส</th>
                <th>อาคาร และ ชั้น</th>
                <th>จุดสังเกต / พิกัด</th>
                <th>ประเภท</th>
                <th>สิ่งอำนวยความสะดวก</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    ไม่พบข้อมูลห้องน้ำตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const statusBadge =
                    t.status === 'ใช้งานได้' || t.status === 'ปกติ'
                      ? 'success'
                      : t.status === 'ปิดปรับปรุง' || t.status === 'ชำรุด'
                      ? 'danger'
                      : 'warning';

                  const linkedIds = toiletAmenities
                    .filter((ta) => Number(ta.toilet_id) === Number(t.toilet_id))
                    .map((ta) => Number(ta.amenity_id));

                  const matchedAmenities = amenities.filter((a) =>
                    linkedIds.includes(Number(a.amenity_id))
                  );

                  const photoObj = toiletPhotos.find(
                    (p) => Number(p.toilet_id) === Number(t.toilet_id) && p.is_cover
                  ) || toiletPhotos.find((p) => Number(p.toilet_id) === Number(t.toilet_id));

                  return (
                    <tr key={t.toilet_id}>
                      <td>
                        {photoObj?.photo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={photoObj.photo_url}
                            alt="ห้องน้ำ"
                            style={{
                              width: '54px',
                              height: '42px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '54px',
                              height: '42px',
                              borderRadius: '6px',
                              backgroundColor: '#F1F5F9',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: '#94A3B8',
                              fontWeight: 600,
                            }}
                          >
                            ไม่มีรูป
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#000066' }}>#{t.toilet_id}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>
                          {getBuildingName(t.building_id)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          ชั้น {t.floor}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#334155' }}>
                          {t.location_text || '-'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          GPS: {Number(t.location_lat ?? 0).toFixed(5)}, {Number(t.location_lng ?? 0).toFixed(5)}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          {t.toilet_type || 'แยกเพศ'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {matchedAmenities.length > 0 ? (
                            matchedAmenities.map((a) => (
                              <span key={a.amenity_id} className="amenity-tag">
                                {a.amenity_name}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>ไม่มีระบุ</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge}`}>{t.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openModal(t)}
                          >
                            แก้ไข
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(t.toilet_id)}
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal เพิ่ม/แก้ไข ข้อมูลห้องน้ำ */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: '#000066', textTransform: 'uppercase' }}>
                  PLODPLOI
                </div>
                <h3 style={{ margin: '2px 0 0', color: '#000066' }}>
                  {editingId ? `แก้ไขข้อมูลห้องน้ำ #${editingId}` : 'เพิ่มห้องน้ำจุดใหม่'}
                </h3>
              </div>
              <button
                className="icon-btn close-modal-btn"
                onClick={() => setModalOpen(false)}
                aria-label="ปิดหน้าต่าง"
              >
                X
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: อาคาร และ ชั้น */}
              <div className="form-row">
                <div className="form-group half">
                  <label>
                    เลือกอาคาร <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={formBuildingId}
                    onChange={(e) => setFormBuildingId(Number(e.target.value))}
                  >
                    {buildings.map((b) => (
                      <option key={b.building_id} value={b.building_id}>
                        {b.building_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group half">
                  <label>
                    ชั้นที่ตั้ง (ใส่ตัวเลข เช่น 1, 2, 3) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formFloor}
                    onChange={(e) => setFormFloor(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Row 2: จุดสังเกต */}
              <div className="form-group">
                <label>
                  จุดสังเกต / รายละเอียดตำแหน่ง <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น ติดกับบันไดหลักฝั่งทิศเหนือ ตรงข้ามห้อง CITU 404"
                  value={formLocationText}
                  onChange={(e) => setFormLocationText(e.target.value)}
                />
              </div>

              {/* Row 3: พิกัด GPS */}
              <div className="form-row">
                <div className="form-group half">
                  <label>พิกัดละติจูด (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="13.7563"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                  />
                </div>
                <div className="form-group half">
                  <label>พิกัดลองจิจูด (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="100.4902"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4: ประเภท และ สถานะ */}
              <div className="form-row">
                <div className="form-group half">
                  <label>ประเภทห้องน้ำ</label>
                  <select
                    className="form-control"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="แยกเพศ">แยกเพศ (ชาย/หญิง)</option>
                    <option value="ห้องน้ำรวม">ห้องน้ำรวม (All Gender)</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>สถานะความพร้อมใช้งาน</label>
                  <select
                    className="form-control"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="ใช้งานได้">ใช้งานได้ปกติ</option>
                    <option value="ทำความสะอาด">กำลังทำความสะอาด</option>
                    <option value="ปิดปรับปรุง">ชำรุด / ปิดปรับปรุง</option>
                  </select>
                </div>
              </div>

              {/* Row 5: สิ่งอำนวยความสะดวก */}
              <div className="form-group">
                <label>สิ่งอำนวยความสะดวก (ติ๊กเลือกข้อที่ให้บริการ)</label>
                <div className="checkbox-grid">
                  {amenities.map((a) => (
                    <label key={a.amenity_id} className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(Number(a.amenity_id))}
                        onChange={() => toggleAmenity(Number(a.amenity_id))}
                      />
                      <span>{a.amenity_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Row 6: อัปโหลดรูปภาพห้องน้ำจริง */}
              <div className="form-group">
                <label>อัปโหลดรูปภาพห้องน้ำ (บันทึกลง Supabase Storage: toilet-photos)</label>
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
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                    id="toilet-photo-upload"
                  />

                  {photoPreviewUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreviewUrl}
                        alt="รูปตัวอย่างที่จะอัปโหลด"
                        style={{
                          maxHeight: '140px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          marginBottom: '8px',
                          border: '1px solid #E2E8F0',
                        }}
                      />
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={clearSelectedPhoto}
                        >
                          ยกเลิกรูปที่เลือก
                        </button>
                      </div>
                    </div>
                  ) : existingPhotoUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={existingPhotoUrl}
                        alt="รูปภาพปัจจุบัน"
                        style={{
                          maxHeight: '140px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          marginBottom: '8px',
                          border: '1px solid #E2E8F0',
                        }}
                      />
                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                        รูปภาพปัจจุบันในระบบ
                      </div>
                      <label htmlFor="toilet-photo-upload" className="btn btn-sm btn-outline-primary" style={{ cursor: 'pointer' }}>
                        เปลี่ยนรูปภาพใหม่
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                        ยังไม่มีรูปภาพสำหรับจุดห้องน้ำนี้
                      </div>
                      <label
                        htmlFor="toilet-photo-upload"
                        className="btn btn-sm btn-outline-primary"
                        style={{ cursor: 'pointer' }}
                      >
                        เลือกรูปภาพจากเครื่อง
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                disabled={isSubmitting}
                onClick={() => setModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary btn-lg"
                disabled={isSubmitting}
                onClick={handleSave}
              >
                {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลห้องน้ำ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
