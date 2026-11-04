'use client';

import React, { useState } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { LocationItem } from '@/lib/types';

export default function LocationsPage() {
  const { locations, buildings, getBuildingName, saveLocation, deleteLocation } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [buildingId, setBuildingId] = useState<number>(buildings[0]?.building_id || 1);
  const [floor, setFloor] = useState<number>(1);
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');

  const openModal = (loc?: LocationItem) => {
    if (loc) {
      setEditingId(loc.location_id);
      setBuildingId(Number(loc.building_id));
      setFloor(Number(loc.floor));
      setRoomName(loc.room_name);
      setDescription(loc.description || '');
    } else {
      setEditingId(null);
      setBuildingId(buildings[0]?.building_id || 1);
      setFloor(1);
      setRoomName('');
      setDescription('');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    const ok = await saveLocation({
      id: editingId,
      building_id: Number(buildingId),
      floor: Number(floor),
      room_name: roomName,
      description,
    });
    if (ok) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (locationId: number) => {
    if (!confirm('ต้องการลบจุดอ้างอิงนี้ใช่หรือไม่?')) return;
    await deleteLocation(locationId);
  };

  return (
    <div className="page-section">
      <div className="helper-banner">
        <div>
          <strong>การจัดการจุดอ้างอิง/ห้องสำคัญในอาคาร (ตาราง locations)</strong>
          <p>
            ใช้ระบุห้องเรียน ห้องสมุด หรือจุดสำคัญในแต่ละชั้น
            เพื่อช่วยให้ผู้ใช้งานเทียบตำแหน่งเดินไปห้องน้ำได้ง่ายขึ้น
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => openModal()}>
          + เพิ่มจุดอ้างอิงใหม่
        </button>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>รหัส (ID)</th>
                <th>อาคาร</th>
                <th>ชั้น</th>
                <th>ชื่อห้อง / จุดอ้างอิง</th>
                <th>คำอธิบายเส้นทาง</th>
                <th>ปุ่มจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.location_id}>
                  <td>
                    <b>#{loc.location_id}</b>
                  </td>
                  <td>
                    <b>{getBuildingName(loc.building_id)}</b>
                  </td>
                  <td>ชั้น {loc.floor}</td>
                  <td>
                    <b>{loc.room_name}</b>
                  </td>
                  <td>{loc.description || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openModal(loc)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(loc.location_id)}
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
              <h3>{editingId ? `แก้ไขจุดอ้างอิง #${editingId}` : 'เพิ่มจุดอ้างอิงในอาคาร'}</h3>
              <button className="icon-btn close-modal-btn" onClick={() => setModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  เลือกอาคาร <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control"
                  value={buildingId}
                  onChange={(e) => setBuildingId(Number(e.target.value))}
                >
                  {buildings.map((b) => (
                    <option key={b.building_id} value={b.building_id}>
                      {b.building_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  ชั้น (ใส่เป็นตัวเลข) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>
                  ชื่อห้อง หรือ จุดอ้างอิงสำคัญ <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น ห้องบรรยาย 101 หรือ โถงลิฟต์กลาง"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>รายละเอียดการเดินไปห้องน้ำจากจุดนี้</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="เช่น เดินออกจากห้องเลี้ยวซ้าย 20 เมตร"
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
                บันทึกจุดอ้างอิง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
