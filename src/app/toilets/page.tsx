'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { Toilet } from '@/lib/types';

export default function ToiletsPage() {
  const {
    toilets,
    buildings,
    amenities,
    toiletAmenities,
    getBuildingName,
    saveToilet,
    deleteToilet,
  } = useAdminData();

  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formBuildingId, setFormBuildingId] = useState<number>(buildings[0]?.building_id || 1);
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formLocationText, setFormLocationText] = useState('');
  const [formLat, setFormLat] = useState<string>('13.7563');
  const [formLng, setFormLng] = useState<string>('100.4902');
  const [formType, setFormType] = useState('แยกเพศ');
  const [formStatus, setFormStatus] = useState('ปกติ');
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);

  const openModal = (toilet?: Toilet) => {
    if (toilet) {
      setEditingId(toilet.toilet_id);
      setFormBuildingId(Number(toilet.building_id));
      setFormFloor(Number(toilet.floor));
      setFormLocationText(toilet.location_text || '');
      setFormLat(String(toilet.location_lat ?? 13.7563));
      setFormLng(String(toilet.location_lng ?? 100.4902));
      setFormType(toilet.toilet_type || 'แยกเพศ');
      setFormStatus(toilet.status || 'ปกติ');

      const linkedIds = toiletAmenities
        .filter((ta) => Number(ta.toilet_id) === Number(toilet.toilet_id))
        .map((ta) => Number(ta.amenity_id));
      setSelectedAmenities(linkedIds);
    } else {
      setEditingId(null);
      setFormBuildingId(buildings[0]?.building_id || 1);
      setFormFloor(1);
      setFormLocationText('');
      setFormLat('13.7563');
      setFormLng('100.4902');
      setFormType('แยกเพศ');
      setFormStatus('ปกติ');
      setSelectedAmenities([]);
    }
    setModalOpen(true);
  };

  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  const handleSave = async () => {
    const ok = await saveToilet({
      id: editingId,
      building_id: Number(formBuildingId),
      floor: Number(formFloor),
      location_text: formLocationText,
      location_lat: parseFloat(formLat) || 13.7563,
      location_lng: parseFloat(formLng) || 100.4902,
      toilet_type: formType,
      status: formStatus,
      selectedAmenityIds: selectedAmenities,
    });
    if (ok) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (toiletId: number) => {
    if (!confirm(`ยืนยันการลบห้องน้ำรหัส #${toiletId} ใช่หรือไม่?`)) return;
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
      <div className="helper-banner">
        <div>
          <strong>การจัดการข้อมูลห้องน้ำ (ตาราง toilets และ toilet_amenities)</strong>
          <p>
            ใช้สำหรับเพิ่มจุดห้องน้ำใหม่ เปลี่ยนสถานะ (ปกติ/ทำความสะอาด/ชำรุด)
            และติ๊กเลือกสิ่งอำนวยความสะดวกที่มีในห้องน้ำนั้นๆ
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => openModal()}>
          + เพิ่มห้องน้ำจุดใหม่
        </button>
      </div>

      <div className="action-bar">
        <div className="search-filter-group">
          <input
            type="text"
            className="form-control"
            placeholder="พิมพ์ค้นหาชื่ออาคาร หรือจุดสังเกต..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-control"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="">แสดงทุกอาคาร</option>
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
            <option value="ปกติ">ใช้งานได้ปกติ</option>
            <option value="ทำความสะอาด">กำลังทำความสะอาด</option>
            <option value="ชำรุด">ชำรุด / ปิดซ่อม</option>
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>อาคาร และ ชั้น</th>
                <th>จุดสังเกต / พิกัด</th>
                <th>ประเภท</th>
                <th>สิ่งอำนวยความสะดวก</th>
                <th>สถานะปัจจุบัน</th>
                <th>ปุ่มจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    ไม่พบข้อมูลห้องน้ำตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const statusBadge =
                    t.status === 'ปกติ'
                      ? 'success'
                      : t.status === 'ชำรุด'
                      ? 'danger'
                      : 'warning';

                  const linkedIds = toiletAmenities
                    .filter((ta) => Number(ta.toilet_id) === Number(t.toilet_id))
                    .map((ta) => Number(ta.amenity_id));

                  const matchedAmenities = amenities.filter((a) =>
                    linkedIds.includes(Number(a.amenity_id))
                  );

                  return (
                    <tr key={t.toilet_id}>
                      <td>
                        <b>#{t.toilet_id}</b>
                      </td>
                      <td>
                        <b>{getBuildingName(t.building_id)}</b>
                        <br />
                        <span className="text-muted text-sm">ชั้น {t.floor}</span>
                      </td>
                      <td>
                        {t.location_text || '-'}
                        <br />
                        <span className="text-muted text-sm">
                          พิกัด: {t.location_lat ?? '-'}, {t.location_lng ?? '-'}
                        </span>
                      </td>
                      <td>{t.toilet_type || 'แยกเพศ'}</td>
                      <td>
                        {matchedAmenities.length > 0 ? (
                          matchedAmenities.map((a) => (
                            <span key={a.amenity_id} className="amenity-tag">
                              {a.amenity_name}
                            </span>
                          ))
                        ) : t.has_bidet || t.has_disabled_access ? (
                          <>
                            {t.has_bidet && <span className="amenity-tag">สายฉีดชำระ</span>}
                            {t.has_disabled_access && <span className="amenity-tag">ผู้พิการ</span>}
                          </>
                        ) : (
                          <span className="text-muted text-sm">ไม่มีระบุ</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge}`}>{t.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
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

      {/* Modal เพิ่ม/แก้ไข ห้องน้ำ */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>{editingId ? `แก้ไขข้อมูลห้องน้ำ #${editingId}` : 'เพิ่มห้องน้ำจุดใหม่'}</h3>
              <button className="icon-btn close-modal-btn" onClick={() => setModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body">
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
                    ชั้นที่ตั้ง (ใส่เป็นตัวเลข เช่น 1, 2, 3) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formFloor}
                    onChange={(e) => setFormFloor(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  คำอธิบายจุดสังเกต (ช่วยให้หาเจอง่ายขึ้น) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น อยู่ติดกับลิฟต์ฝั่งทิศเหนือ ด้านหลังบันไดหลัก"
                  value={formLocationText}
                  onChange={(e) => setFormLocationText(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>พิกัดละติจูด (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
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
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>ประเภทห้องน้ำ</label>
                  <select
                    className="form-control"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="แยกเพศ">แยกเพศ (ชาย/หญิง)</option>
                    <option value="รวม">ห้องน้ำรวม (All Gender)</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>สถานะความพร้อมใช้งาน</label>
                  <select
                    className="form-control"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="ปกติ">ใช้งานได้ปกติ</option>
                    <option value="ทำความสะอาด">กำลังทำความสะอาด</option>
                    <option value="ชำรุด">ชำรุด / ปิดซ่อม</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>สิ่งอำนวยความสะดวกหลัก (ติ๊กเลือกได้มากกว่า 1 ข้อ)</label>
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleSave}>
                บันทึกข้อมูลห้องน้ำ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
