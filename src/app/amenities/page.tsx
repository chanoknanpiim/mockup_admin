'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { Amenity } from '@/lib/types';

export default function AmenitiesPage() {
  const { amenities, saveAmenity, deleteAmenity } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [amenityName, setAmenityName] = useState('');

  const openModal = (a?: Amenity) => {
    if (a) {
      setEditingId(a.amenity_id);
      setAmenityName(a.amenity_name);
    } else {
      setEditingId(null);
      setAmenityName('');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    const ok = await saveAmenity({
      id: editingId,
      amenity_name: amenityName,
    });
    if (ok) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (amenityId: number) => {
    if (!confirm('ยืนยันการลบสิ่งอำนวยความสะดวกนี้ใช่หรือไม่?')) return;
    await deleteAmenity(amenityId);
  };

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>การจัดการสิ่งอำนวยความสะดวก (ตาราง amenities)</strong>
          <p>
            จัดการตัวเลือกสิ่งอำนวยความสะดวก เช่น สายฉีดชำระ ห้องน้ำผู้พิการ กระดาษทิชชู่
            เพื่อให้ผู้ใช้กดกรองค้นหาในแอปได้
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => openModal()}>
          + เพิ่มสิ่งอำนวยความสะดวก
        </button>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>รหัส (ID)</th>
                <th>ชื่อสิ่งอำนวยความสะดวก</th>
                <th>ปุ่มจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {amenities.map((a) => (
                <tr key={a.amenity_id}>
                  <td>
                    <b>#{a.amenity_id}</b>
                  </td>
                  <td>
                    <b>{a.amenity_name}</b>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openModal(a)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(a.amenity_id)}
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingId
                  ? `แก้ไขสิ่งอำนวยความสะดวก #${editingId}`
                  : 'เพิ่มสิ่งอำนวยความสะดวกใหม่'}
              </h3>
              <button className="icon-btn close-modal-btn" onClick={() => setModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  ชื่อสิ่งอำนวยความสะดวก <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น สายฉีดชำระ, กระดาษทิชชู่, ห้องน้ำผู้พิการ"
                  value={amenityName}
                  onChange={(e) => setAmenityName(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
