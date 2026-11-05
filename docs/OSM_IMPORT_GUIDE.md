# แนวทางการนำเข้าข้อมูลห้องน้ำจาก OpenStreetMap (OSM) และเงื่อนไขลิขสิทธิ์ ODbL

เอกสารนี้อธิบายวิธีการดึงข้อมูลห้องน้ำสาธารณะ (`amenity=toilets`) จาก **OpenStreetMap (OSM)** ด้วย Overpass API เพื่อนำมาใช้ในระบบ **ปลดปล่อย (Plod-Ploi)** รวมถึงข้อกำหนดทางกฎหมายตามสัญญาอนุญาต **ODbL v1.0**

---

## 1. เงื่อนไขลิขสิทธิ์ Open Database License (ODbL v1.0) ที่ต้องปฏิบัติตาม

ข้อมูลจาก OpenStreetMap อยู่ภายใต้สัญญาอนุญาต **Open Database License (ODbL) 1.0** ของ OpenStreetMap Foundation (OSMF) หากนำข้อมูลพิกัดหรือรายละเอียดจาก OSM มาใช้ในฐานข้อมูล ต้องปฏิบัติตาม 3 ข้อหลักดังนี้:

1. **การแสดงที่มา (Attribution Requirement):**
   - ในหน้าแผนที่ LIFF (`/liff`) และในหน้าเกี่ยวกับระบบ ต้องแสดงข้อความระบุแหล่งที่มาอย่างชัดเจนว่า:
     > `© OpenStreetMap contributors (ODbL)` พร้อมลิงก์ไปยัง `https://www.openstreetmap.org/copyright`
2. **การอนุญาตแบบเดียวกัน (Share-Alike / Produced Work vs Derivative Database):**
   - หากนำข้อมูล OSM มารวมกับข้อมูลที่ผู้ใช้ส่งเอง (`submissions`), เพื่อหลีกเลี่ยงให้ฐานข้อมูลรีวิว/รายงานภายในทั้งหมดกลายเป็น Derivative Database ที่ต้องเปิดเผยทั้งหมด แนะนำให้ **เก็บคอลัมน์ระบุแหล่งที่มา (`data_source = 'osm'` vs `'user_submitted'`)** และเก็บ `osm_id` แยกชัดเจน
   - เฉพาะชุดข้อมูลพิกัดห้องน้ำที่ดัดแปลง/ปรับปรุงต่อจาก OSM หากมีการเผยแพร่ต่อสาธารณะ ต้องอยู่ภายใต้สัญญาอนุญาต ODbL เช่นกัน
3. **ห้ามใช้ API หลักของ OSM สำหรับ Production Traffic โดยตรง:**
   - ให้ดึงข้อมูลผ่าน **Overpass API** เป็นคราวๆ (Batch Import) เข้าสู่ตาราง `toilets` ของ Supabase เท่านั้น ห้ามให้ฝั่งผู้ใช้ยิง Overpass API ทุกครั้งที่กดค้นหา

---

## 2. ตัวอย่างคำสั่ง Overpass QL สำหรับดึงห้องน้ำรอบ มธ. ท่าพระจันทร์ และสนามหลวง

สามารถทดสอบรันได้ที่ [Overpass Turbo](https://overpass-turbo.eu/) โดยใช้พิกัด Bounding Box รอบท่าพระจันทร์/สนามหลวง (`13.7500, 100.4850, 13.7650, 100.5000`):

```overpass
[out:json][timeout:25];
(
  node["amenity"="toilets"](13.7500,100.4850,13.7650,100.5000);
  way["amenity"="toilets"](13.7500,100.4850,13.7650,100.5000);
);
out center tags;
```

---

## 3. การแปลง Tag ของ OSM เข้าสู่คอลัมน์ตาราง `toilets` ใน Supabase

| OSM Tag | คอลัมน์ใน `public.toilets` | การแปลงค่า (Mapping) |
| :--- | :--- | :--- |
| `id` | `google_place_id` (หรือ `osm_id`) | เก็บเป็น `'osm:' + element.id` เพื่อใช้ตรวจสอบซ้ำ (Upsert) |
| `lat`, `lon` (หรือ `center`) | `location_lat`, `location_lng`, `location` | แปลงเป็น `ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography` |
| `tags.name` / `tags["name:th"]` | `name`, `location_text` | หากไม่มีชื่อใน OSM ให้ตั้งเป็น `'ห้องน้ำสาธารณะ (OSM #' + id + ')'` |
| `tags.fee` (`no` / `yes`) | `is_free`, `price` | `fee=no` → `is_free = true`, `fee=yes` → `is_free = false` |
| `tags.wheelchair` (`yes`) | `has_disabled_access` | `wheelchair=yes` → `true` |
| `tags.opening_hours` (`24/7`) | `is_24h`, `open_hours` | `24/7` → `is_24h = true` |
| `tags.changing_table` (`yes`) | `facilities` | เพิ่ม `'ที่เปลี่ยนผ้าอ้อม'` ลงใน Array `facilities` |
