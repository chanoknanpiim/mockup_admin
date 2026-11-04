'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { Building } from '@/lib/types';

export default function BuildingsPage() {
  const { buildings, toilets, saveBuilding, deleteBuilding } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [buildingName, setBuildingName] = useState('');
  const [description, setDescription] = useState('');

  const openModal = (b?: Building) => {
    if (b) {
      setEditingId(b.building_id);
      setBuildingName(b.building_name);
      setDescription(b.description || '');
    } else {
      setEditingId(null);
      setBuildingName('');
      setDescription('');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    const ok = await saveBuilding({
      id: editingId,
      building_name: buildingName,
      description,
    });
    if (ok) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (buildingId: number) => {
    if (!confirm('ยืนยันการลบอาคารนี้ใช่หรือไม่?')) return;
    await deleteBuilding(buildingId);
  };

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>การจัดการข้อมูลอาคาร (ตาราง buildings)</strong>
          <p>
            รายชื่อตึกและคณะต่างๆ ใน มธ. ท่าพระจันทร์ เมื่อเพิ่มตึกที่นี่แล้ว
            จะสามารถนำไปเลือกตอนสร้างห้องน้ำหรือจุดอ้างอิงได้
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => openModal()}>
          + เพิ่มอาคารใหม่
        </button>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>รหัสอาคาร (ID)</th>
                <th>ชื่ออาคาร / คณะ</th>
                <th>รายละเอียดเพิ่มเติม / จุดสังเกตตึก</th>
                <th>จำนวนห้องน้ำในตึกนี้</th>
                <th>ปุ่มจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((b) => {
                const count = toilets.filter(
                  (t) => Number(t.building_id) === Number(b.building_id)
                ).length;
                return (
                  <tr key={b.building_id}>
                    <td>
                      <b>#{b.building_id}</b>
                    </td>
                    <td>
                      <b>{b.building_name}</b>
                    </td>
                    <td>{b.description || '-'}</td>
                    <td>
                      <span className="badge success">{count} จุดห้องน้ำ</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openModal(b)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(b.building_id)}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? `แก้ไขข้อมูลอาคาร #${editingId}` : 'เพิ่มอาคารใหม่'}</h3>
              <button className="icon-btn close-modal-btn" onClick={() => setModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  ชื่ออาคาร หรือ คณะ <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น อาคารคณะศิลปศาสตร์"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>คำอธิบายอาคาร / จุดสังเกตใกล้เคียง</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="เช่น อาคารเรียนรวม ใกล้ประตูท่าพระจันทร์"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                บันทึกอาคาร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
