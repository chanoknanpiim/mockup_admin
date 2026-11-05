# Project Progress: Plod-Ploi (ปลดปล่อย) — LINE LIFF & Admin Portal

## Overview
- **Brand:** ปลดปล่อย (Plod-Ploi) / LINE OA: `plodploi.official`
- **Target Area:** Thammasat University (Tha Prachan Campus) and surrounding areas
- **Architecture:** Single Next.js App Router repository (`/admin` routes at root & `/liff/...` routes for LINE LIFF) + Supabase (PostgreSQL + PostGIS + Storage + Edge Functions)

---

## Phase Status

### Phase 0: Discovery & Architecture Alignment
- [x] Inspect existing Next.js Admin Web and 9 Supabase tables
- [x] Gather and confirm all 7 product/technical requirements with the project owner
- [x] Establish secret handling and approval workflow rules

### Phase 1: Database & PostGIS Foundation (Completed ✅)
- [x] **Step 1.1 (Completed):** Create `docs/PROGRESS.md`, `docs/DECISIONS.md`, `.env.example`, and remove hardcoded fallback URL/key from `src/lib/supabase.ts`
- [x] **Step 1.2 (Completed):** Run Migration 1 (`20261105000001_phase1_schema_and_postgis.sql`) — Enable PostGIS, upgrade `toilets`, `Users`, `reviews`, `reports` backward-compatibly, create `toilet_photos`, `submissions`, `search_logs`, `admin_profiles`, GIST index, and coordinate sync trigger
- [x] **Step 1.3 (Part 1 - Completed):** Run `20261105000002_phase1_rpc_triggers_and_rls.sql` (`update_toilet_avg_rating` trigger + backfill, `nearby_toilets` RPC, `toilet-photos` storage bucket, `is_admin_user()`, and `GRANT EXECUTE` on both functions)
  - ⚠️ **สถานะความปลอดภัยปัจจุบัน:** ฐานข้อมูล**ยังไม่ได้เปิด RLS (`rowsecurity = false`)** เพื่อให้หน้า Admin Web ทั้งหมดทำงานได้ปกติระหว่างพัฒนา โดย**ต้องรันไฟล์ [`supabase/migrations/20261105000004_phase4_rls_and_grants_PENDING.sql`](file:///Users/carbo/Desktop/ปี2เทอม1/DX212/mock%20up/admin/supabase/migrations/20261105000004_phase4_rls_and_grants_PENDING.sql) พร้อมกับระบบ Admin Login (Phase 4) ก่อน Deploy ขึ้น Production จริงเท่านั้น**
- [x] **Step 1.4 (Completed):** Seed 21 additional test toilets (`[ข้อมูลทดสอบ]`, `toilet_id` 12–32, total 32 toilets) around Thammasat Tha Prachan without modifying `toilet_id` 1–11 + document OpenStreetMap (ODbL) import guide (`docs/OSM_IMPORT_GUIDE.md`)
- [x] **Step 1.5 (Completed):** Sync `facilities` and conditional `name` (only when empty) in `saveToilet` (`src/context/AdminDataContext.tsx`), verify `npm run build` & test add/edit/cleanup flow on `/toilets`

### Phase 2: LINE Webhook & Flex Message (In Progress — Code Ready, Not Deployed)
- [x] **Step 2.1 (Completed):** Create circular PNG brand logo (`public/logo-plodploi-circle.png`, 3.6 KB < 1 MB) + logo processing script (`scripts/process-logo.py`)
- [x] **Step 2.2 (Completed):** Build Flex Message Carousel & Filter card (`supabase/functions/line-webhook/flex.ts`) with `#1976D2`/`#123B66`/`#EAF3FF` theme, max 12 bubbles, Google Maps navigation & LIFF detail buttons
- [x] **Step 2.3 (Completed):** Build `supabase/functions/line-webhook/index.ts` with HMAC-SHA256 `x-line-signature` verification, expanding search radius (`300m -> 500m -> 1000m -> 3000m`), HMAC-SHA256 hashed `line_user_id`, and 3-decimal coordinate rounding in `search_logs`
- [ ] **Step 2.4 (Pending approval):** Inspect & confirm Rich Menu actions (3 buttons) before updating + deploy `line-webhook` when approved

### Phase 3: User Web on LINE LIFF (`/liff/...`) (Completed ✅)
- [x] **Step 3.1 (Completed):** Build `src/context/LiffContext.tsx` and mobile-first shell `src/app/liff/layout.tsx` (with Dark Mode, GPS + Tha Prachan preset coordinates, and AdminShell bypass for `/liff`)
- [x] **Step 3.2 (Completed):** Build `/liff` (`src/app/liff/page.tsx` + `src/components/LeafletMap.tsx`) — Interactive **Leaflet + OpenStreetMap** map (configurable via `NEXT_PUBLIC_MAP_TILE_URL`, `© OpenStreetMap contributors` attribution, toilet markers + popups, user pin, search radius circle) + filter chips + bottom sheet sorted by distance (`300m -> 500m -> 1000m -> 3000m`) + Google Maps URL navigation links
- [x] **Step 3.3 (Completed):** Build `/liff/toilet/[id]` (`src/app/liff/toilet/[id]/page.tsx`) — Minimalist `#000066` fashion-card detail view, approved photos only (`is_approved`), reviews list, Leaflet map, favorite button, and Google Maps URL navigation
- [x] **Step 3.4 (Completed):** Build `/liff/report` (`src/app/liff/report/page.tsx`) — Report issue & write review tabs (max 1,000 chars, magic-byte photo check, pending approval) via `/api/liff/action`
- [x] **Step 3.5 (Completed):** Build `/liff/add` (`src/app/liff/add/page.tsx` with Leaflet pin clicker) & `/liff/me` (`src/app/liff/me/page.tsx`) + Server API Route `src/app/api/liff/action/route.ts` (verifies LIFF ID Token against `LINE_LOGIN_CHANNEL_ID`, 10 actions/hr rate limit, magic-byte image validation, `[LOCAL]` dev-only safeguard)

### Phase 4: Admin Web Enhancements & RLS Enforcement (Pending)
- [ ] **CRITICAL (Must run with Admin Login & BEFORE Production Deploy):** Build Admin Login (Supabase Auth) + Apply Part 2 migration `supabase/migrations/20261105000004_phase4_rls_and_grants_PENDING.sql` (`REVOKE ALL` from `anon/authenticated`, least-privilege `GRANT`s, `ENABLE ROW LEVEL SECURITY`, and all RLS policies)
- [ ] Dashboard analytics (search logs, zero-result areas, heatmap)
- [ ] Submissions & Reports approval queue
- [ ] CSV Import/Export & Settings (default search radius, welcome message)

### Phase 5: Testing & Performance Verification (Pending)
- [ ] Unit tests (signature verification, Flex builder, RPC distance)
- [ ] RLS verification & 10,000+ rows benchmark (`< 300 ms`)

### Phase 6: Production Deployment & Legal Docs (Pending)
- [ ] Privacy Policy & Terms of Service (PDPA compliance, 90-day search log retention)
- [ ] Production deployment checklist & monitoring
