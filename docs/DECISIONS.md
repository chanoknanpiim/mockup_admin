# Architectural & Product Decisions (`DECISIONS.md`)

เอกสารนี้บันทึกการตัดสินใจสำคัญของโปรเจกต์ **ปลดปล่อย (Plod-Ploi)** เพื่อให้ทีมพัฒนาและระบบสามารถอ้างอิงได้อย่างต่อเนื่อง

---

## ADR-001: โครงสร้างโปรเจกต์ (Single Next.js App for Admin + LIFF)
- **การตัดสินใจ:** รวม User Web (LIFF) ไว้ในโปรเจกต์ Next.js เดียวกับ Admin Web โดยเข้าถึง LIFF ผ่านเส้นทาง `/liff/...` (เช่น `/liff`, `/liff/toilet/[id]`, `/liff/report`, `/liff/add`, `/liff/me`)
- **เหตุผล:** ลดความซับซ้อนในการดูแลรักษา ใช้ TypeScript Types และ Supabase Client ร่วมกันได้ และสามารถ Deploy ขึ้น Vercel ในโปรเจกต์เดียวจบ

## ADR-002: ขอบเขตข้อมูลห้องน้ำตัวอย่าง (Seed Data & ODbL)
- **การตัดสินใจ:** ข้อมูลห้องน้ำตัวอย่าง 30+ แห่ง ให้จำกัดอยู่ในบริเวณ **มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์ และพื้นที่โดยรอบ** โดยต้องระบุคำว่า `[ข้อมูลทดสอบ]` ในชื่อหรือคำอธิบายให้ชัดเจนทุกแห่ง ห้ามแต่งข้อมูลให้เข้าใจผิดว่าเป็นข้อมูลจริง และใช้พิกัดโดยประมาณเพื่อให้ผู้ดูแลแก้ไขละเอียดผ่านหน้า Admin ภายหลัง

## ADR-003: อัตลักษณ์แบรนด์ โทนสี และโลโก้
- **การตัดสินใจ:**
  - **ชื่อแบรนด์:** ปลดปล่อย (Plod-Ploi) / LINE OA: `plodploi.official`
  - **โลโก้:** ใช้ไฟล์ `IMG_0705.JPG` จาก Desktop ของเครื่องผู้ใช้ (รูปชักโครกสีขาวมีหน้ายิ้มบนวงกลมสีฟ้า ตัวอักษร PLODPLOI สีเทาดำ) สำหรับแสดงใน LIFF และ Flex Message
  - **โทนสี:** สีน้ำเงินหลัก `#1976D2`, สีน้ำเงินเข้ม `#123B66`, และเพิ่มสีฟ้าอ่อนพาสเทล (`#EAF3FF` / `#DCEBFE`) ให้เข้ากับโลโก้และ Rich Menu

## ADR-004: การทำงานของ Rich Menu (3 ปุ่มแนวนอน ซ้ายไปขวา)
- **การตัดสินใจ:**
  1. **ปุ่มซ้าย ("แจ้งปัญหา & รีวิว / report & review"):** เปิดหน้า LIFF `/liff/report` เพื่อให้ผู้ใช้เลือกห้องน้ำแล้วแจ้งปัญหาหรือเขียนรีวิว
  2. **ปุ่มกลาง ("หาห้องน้ำใกล้ฉัน / find a toilet near me"):** ใช้ `location` action เพื่อขอตำแหน่ง GPS ของผู้ใช้ แล้วตอบกลับเป็น Flex Message Carousel
  3. **ปุ่มขวา ("กรองห้องน้ำ / filtering toilet"):** ส่ง Quick Reply / Postback ให้เลือกตัวกรอง (เช่น ฟรี, 24 ชม., ห้องน้ำคนพิการ, ที่เปลี่ยนผ้าอ้อม) แล้วค้นหาต่อจากตำแหน่งผู้ใช้
- **ข้อกำหนดพิเศษ:** ต้องตรวจสอบ Action ปัจจุบันของ Rich Menu และขออนุมัติก่อนแก้ไขทุกครั้ง รวมถึงขออนุมัติก่อนแจ้งปิดข้อความตอบกลับอัตโนมัติเริ่มต้นของ LINE OA ใน Phase 2

## ADR-005: การรักษาความเข้ากันได้ของตาราง `Users`, `admin` และ `toilets` (Backward Compatibility)
- **การตัดสินใจ:**
  - ขยายคอลัมน์ในตาราง `"Users"`, `admin`, `toilets`, `reviews`, `reports` เดิมแบบ `ADD COLUMN IF NOT EXISTS` โดยไม่ลบหรือเปลี่ยนชื่อคอลัมน์ที่หน้า Admin Web เดิมใช้อยู่
  - สร้างตาราง `admin_profiles` เชื่อมโยงกับตารางเดิมโดยไม่ทำให้หน้า `/users` ของ Admin Web พัง
  - ใช้ Database Trigger ซิงก์ค่า `location_lat` / `location_lng` กับคอลัมน์ `location geography(Point, 4326)` อัตโนมัติ

## ADR-006: ค่าสถานะห้องน้ำ (`toilet_status` ENUM)
- **การตัดสินใจ:** คงค่า ENUM ภาษาไทยเดิมไว้ (`'ใช้งานได้'`, `'ทำความสะอาด'`, `'ปิดปรับปรุง'`) โดยใช้ค่า `'ใช้งานได้'` เป็นสถานะที่อนุญาตให้ผู้ใช้ทั่วไปมองเห็นผ่าน RLS และ RPC `nearby_toilets` (แทนคำว่า `'active'`)

## ADR-007: การจัดการ Secrets และ API Keys
- **การตัดสินใจ:** ห้ามฝัง Key หรือ Secret ใดๆ ลงในโค้ดหรือ Git Commit เด็ดขาด ใช้ไฟล์ `.env.local` (ที่ไม่ถูก Commit) และ Supabase Secrets เท่านั้น โดยจะมีไฟล์ `.env.example` เป็นแม่แบบ

## ADR-008: การแยก Migration ส่วน RLS & Least-Privilege Grants (ทางเลือก B)
- **การตัดสินใจ:** แยกไฟล์ Migration ขั้นที่ 1.3 ออกเป็น 2 ส่วน:
  1. **ส่วนที่ 1 (`20261105000002_phase1_rpc_triggers_and_rls.sql`):** รันใน Phase 1 ประกอบด้วย Trigger `update_toilet_avg_rating` + Backfill, ฟังก์ชัน RPC `nearby_toilets`, Storage Bucket `toilet-photos`, ฟังก์ชัน `is_admin_user()`, และ `GRANT EXECUTE` ของทั้ง 2 ฟังก์ชัน เพื่อให้หน้า Admin Web ทั้งหมดที่ปัจจุบันยังเชื่อมต่อด้วย `anon` key ทำงานได้ปกติไม่สะดุดระหว่างพัฒนา Phase 1–3
  2. **ส่วนที่ 2 (`20261105000004_phase4_rls_and_grants_PENDING.sql`):** เก็บคำสั่ง `REVOKE ALL`, `GRANT` แบบจำกัดสิทธิ์ (`anon` อ่านได้อย่างเดียวเฉพาะตารางสาธารณะ), `ENABLE ROW LEVEL SECURITY` และ RLS Policies ทั้งหมดไว้รัน**พร้อมกับการทำหน้า Admin Login (Supabase Auth) ใน Phase 4** และ**ต้องดำเนินการให้เสร็จสมบูรณ์ก่อน Deploy ขึ้น Production จริง**

## ADR-009: การซิงก์ฟิลด์ `name` และ `facilities` ระหว่าง Admin Web กับตาราง `toilet_amenities`
- **การตัดสินใจ:**
  - ใน Phase 1 (Step 1.5) ให้ฟังก์ชัน `saveToilet` ใน `src/context/AdminDataContext.tsx` ส่งค่า `facilities` (`text[]`) ตามรายการสิ่งอำนวยความสะดวกที่เลือก และกำหนดค่า `name` จาก `location_text` **เฉพาะกรณีที่ `name` ยังว่างอยู่เท่านั้น** (เพื่อไม่ให้เขียนทับ `name` ที่มีอยู่แล้ว)
  - **แผนสำหรับ Phase 4:** อาจพิจารณาย้ายการซิงก์คอลัมน์ `toilets.facilities` ไปทำเป็น **Database Trigger บนตาราง `public.toilet_amenities`** เพื่อให้ข้อมูล `facilities` กับ `toilet_amenities` ซิงก์กันอัตโนมัติในระดับฐานข้อมูลไม่ว่าจะถูกแก้ไขจากช่องทางใด

## ADR-010: การใช้ Leaflet + OpenStreetMap แทน Google Maps JavaScript API
- **การตัดสินใจ:**
  - เปลี่ยนระบบแผนที่ในหน้า `/liff` (และหน้าปักหมุดอื่นๆ) มาใช้ **Leaflet 1.9.4 (โหลดผ่าน CDN) + OpenStreetMap Tile Server** แทน Google Maps JS API เนื่องจากไม่ต้องผูกบัตรเครดิตกับ Google Cloud และไม่มีปัญหา Peer Dependency กับ React 19 / Next.js 15 SSR
  - กำหนด URL ของ Tile Server ผ่านตัวแปรสภาพแวดล้อม `NEXT_PUBLIC_MAP_TILE_URL` (ค่าเริ่มต้น `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) เพื่อให้สลับผู้ให้บริการแผนที่ในอนาคตได้โดยไม่ต้องแก้โค้ด
  - แสดงข้อความลิขสิทธิ์ `© OpenStreetMap contributors` บนแผนที่ตามเงื่อนไขการใช้งานของ OpenStreetMap
  - คงปุ่ม **"นำทาง (Google Maps)"** ที่เปิดด้วยลิงก์มาตรฐาน `https://www.google.com/maps/dir/?api=1&destination=lat,lng&travelmode=walking` (ซึ่งใช้งานได้ฟรีโดยไม่ต้องใช้ API Key) ไว้เหมือนเดิมทั้งใน Flex Message, Popup บนแผนที่ และการ์ดรายการห้องน้ำ
