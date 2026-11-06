// ============================================================================
// Plod-Ploi (ปลดปล่อย) — Supabase Edge Function: `line-webhook`
// Deploy command (when approved in Phase 2 Step 2.4):
//   supabase functions deploy line-webhook --no-verify-jwt
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';
import {
  buildFilterSelectionFlexMessage,
  buildNearbyToiletsCarouselMessage,
  buildQuickReplyFilterItems,
  NearbyToiletRow,
} from './flex.ts';

const SEARCH_RADII_M = [300, 500] as const;
const MAX_CAROUSEL_CARDS = 12;

export const THA_PRACHAN_CENTER = {
  lat: 13.7563,
  lng: 100.4914,
  label: 'มธ. ท่าพระจันทร์',
};

export function calculateHaversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify LINE `x-line-signature` header using HMAC-SHA256 (Base64) over raw request body.
 */
export async function verifyLineSignature(
  rawBody: string,
  signatureHeader: string | null,
  channelSecret: string
): Promise<boolean> {
  if (!signatureHeader || !channelSecret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computedBase64 = toBase64(new Uint8Array(sigBuffer));

  // Constant-time comparison
  if (computedBase64.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < computedBase64.length; i++) {
    diff |= computedBase64.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Hash `line_user_id` with HMAC-SHA256 using secret (PDPA compliance — not plain SHA-256).
 */
export async function hashLineUserIdHmac(
  lineUserId: string,
  hmacSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(hmacSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(lineUserId));
  return toHex(new Uint8Array(sigBuffer));
}

/**
 * Round coordinates to 3 decimal places (~110m precision) before logging to `search_logs`.
 */
export function roundCoord3(coord: number): number {
  return Math.round(coord * 1000) / 1000;
}

export function parseFilterKey(filterKey: string): {
  filtersJson: Record<string, unknown>;
  filterLabel: string | null;
} {
  switch (filterKey) {
    case 'has_disabled_access':
      return { filtersJson: { has_disabled_access: true }, filterLabel: 'ห้องน้ำผู้พิการ' };
    case 'sanitary':
      return { filtersJson: { facility: 'ผ้าอนามัย' }, filterLabel: 'ผ้าอนามัย' };
    case 'has_bidet':
      return { filtersJson: { has_bidet: true }, filterLabel: 'สายฉีดชำระ' };
    default:
      return { filtersJson: {}, filterLabel: null };
  }
}

async function replyToLine(
  replyToken: string,
  messages: unknown[],
  channelAccessToken: string
): Promise<void> {
  if (!replyToken || !channelAccessToken) return;
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`LINE reply API error (${res.status}):`, errText);
    }
  } catch (err) {
    console.error('Network exception in replyToLine:', err);
  }
}

async function searchWithExpandingRadius(
  supabaseAdmin: ReturnType<typeof createClient>,
  lat: number,
  lng: number,
  filtersJson: Record<string, unknown>
): Promise<{ toilets: NearbyToiletRow[]; usedRadiusM: number }> {
  for (const radiusM of SEARCH_RADII_M) {
    const { data, error } = await supabaseAdmin.rpc('nearby_toilets', {
      lat,
      lng,
      radius_m: radiusM,
      limit_n: MAX_CAROUSEL_CARDS,
      filters: filtersJson,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return { toilets: data as NearbyToiletRow[], usedRadiusM: radiusM };
    }
  }

  return { toilets: [], usedRadiusM: SEARCH_RADII_M[SEARCH_RADII_M.length - 1] };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', service: 'plod-ploi-line-webhook' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET') || '92f558f9918534d9ad8eef1c511078a7';
  const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || 'YEm1FmH6TAw3gbCsCUkIdsVeowhTtRO1r7IfgQPMKOBPex3b52CYGuUPDJ8n6tGFBkMg1jHapy8/1M+bropNM/qSTSVe8zxfliaIKlvVBZ2Nylu+wRWT0pBzcFTfVwwNdn/bWGOADMNo1Eunx4x00wdB04t89/1O/w1cDnyilFU=';
  const searchLogHmacSecret = Deno.env.get('SEARCH_LOG_HMAC_SECRET') || channelSecret;
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://wotvrvrfpwinvaagwnle.supabase.co';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'sb_publishable_Jw87Rp6PXwOFTW0v2Arlnw_RghodbjG';
  const appBaseUrl = Deno.env.get('APP_BASE_URL') || Deno.env.get('NEXT_PUBLIC_APP_BASE_URL') || 'https://mockupadmin.vercel.app';
  const liffId = Deno.env.get('LIFF_ID') || Deno.env.get('NEXT_PUBLIC_LIFF_ID') || '2012397593-ADI98PZS';

  const rawBody = await req.text();
  const signature = req.headers.get('x-line-signature');

  const isValid = await verifyLineSignature(rawBody, signature, channelSecret);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid x-line-signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = JSON.parse(rawBody);
  const events = Array.isArray(payload.events) ? payload.events : [];
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  for (const event of events) {
    const replyToken: string | undefined = event.replyToken;
    const rawUserId: string = event.source?.userId || 'anonymous';
    const hashedUserId = await hashLineUserIdHmac(rawUserId, searchLogHmacSecret);

    // 1. Follow Event (User adds OA as friend)
    if (event.type === 'follow' && replyToken) {
      await replyToLine(
        replyToken,
        [
          {
            type: 'text',
            text: 'สวัสดีครับ! ยินดีต้อนรับสู่ "ปลดปล่อย (Plod-Ploi)" 🚽✨\n\nกดปุ่ม "📍 ส่งตำแหน่งใหม่" ด้านล่าง หรือกดจากเมนู "หาห้องน้ำใกล้ฉัน" เพื่อค้นหาห้องน้ำที่สะอาดและพร้อมใช้งานใกล้ตัวคุณได้ทันทีครับ!',
            quickReply: buildQuickReplyFilterItems(),
          },
        ],
        channelAccessToken
      );
      continue;
    }

    // 2. Location Message Event -> Strict Geofencing (1.5km cutoff from Thammasat & 500m strict radius)
    if (event.type === 'message' && event.message?.type === 'location' && replyToken) {
      const lat = Number(event.message.latitude);
      const lng = Number(event.message.longitude);
      const distFromCampus = calculateHaversineM(
        lat,
        lng,
        THA_PRACHAN_CENTER.lat,
        THA_PRACHAN_CENTER.lng
      );

      const roundedLat = roundCoord3(lat);
      const roundedLng = roundCoord3(lng);

      // If user's distance is greater than 1,500 meters (1.5 km) from Thammasat center
      if (distFromCampus > 1500) {
        await supabaseAdmin.from('search_logs').insert([
          {
            line_user_id: hashedUserId,
            source: 'line_webhook',
            search_lat: roundedLat,
            search_lng: roundedLng,
            radius_m: 1500,
            results_count: 0,
            filters: {},
          },
        ]);

        await replyToLine(
          replyToken,
          [
            {
              type: 'text',
              text: 'ขออภัยครับ ขณะนี้คุณอยู่นอกพื้นที่ให้บริการ 📍 ระบบรองรับเฉพาะพื้นที่ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์ เท่านั้นครับ คุณสามารถกดเปิดดูแผนที่ภาพรวมของมหาวิทยาลัยได้ที่ปุ่มด้านล่างนี้',
              quickReply: {
                items: [
                  {
                    type: 'action',
                    action: {
                      type: 'uri',
                      label: '🗺️ เปิดแผนที่ภาพรวม',
                      uri: `https://liff.line.me/${liffId}`,
                    },
                  },
                  {
                    type: 'action',
                    action: {
                      type: 'location',
                      label: '📍 ส่งตำแหน่งใหม่',
                    },
                  },
                ],
              },
            },
          ],
          channelAccessToken
        );
        continue;
      }

      // Within 1.5km of campus -> Search with strict radius <= 500m
      const { toilets, usedRadiusM } = await searchWithExpandingRadius(
        supabaseAdmin,
        lat,
        lng,
        {}
      );

      // Strict filter: only toilets within 500 meters
      const strictToilets = toilets.filter((t) => t.distance_m <= 500);

      await supabaseAdmin.from('search_logs').insert([
        {
          line_user_id: hashedUserId,
          source: 'line_webhook',
          search_lat: roundedLat,
          search_lng: roundedLng,
          radius_m: usedRadiusM,
          results_count: strictToilets.length,
          filters: {},
        },
      ]);

      if (strictToilets.length === 0) {
        await replyToLine(
          replyToken,
          [
            {
              type: 'text',
              text: 'ขออภัยครับ ไม่พบห้องน้ำ มธ. ท่าพระจันทร์ ในระยะใกล้ตัวคุณ (รัศมี 500 ม.) 📍 คุณสามารถกดเปิดดูแผนที่ภาพรวมของมหาวิทยาลัยได้ที่ปุ่มด้านล่างนี้',
              quickReply: {
                items: [
                  {
                    type: 'action',
                    action: {
                      type: 'uri',
                      label: '🗺️ เปิดแผนที่ภาพรวม',
                      uri: `https://liff.line.me/${liffId}`,
                    },
                  },
                  {
                    type: 'action',
                    action: {
                      type: 'location',
                      label: '📍 ส่งตำแหน่งใหม่',
                    },
                  },
                ],
              },
            },
          ],
          channelAccessToken
        );
      } else {
        const flexMsg = buildNearbyToiletsCarouselMessage(strictToilets, {
          appBaseUrl,
          liffId,
          activeRadiusM: usedRadiusM,
          activeFilterLabel: null,
        });
        await replyToLine(replyToken, [flexMsg], channelAccessToken);
      }
      continue;
    }

    // 3. Postback Event (Rich Menu Button "กรองห้องน้ำ" or Quick Reply filter chips)
    if (event.type === 'postback' && replyToken) {
      const params = new URLSearchParams(event.postback?.data || '');
      const filterKey = params.get('filter') || 'all';

      // If user tapped "กรองห้องน้ำ" (action=filter), send the interactive filter card
      if (filterKey === 'all' || params.get('action') === 'filter') {
        await replyToLine(
          replyToken,
          [buildFilterSelectionFlexMessage(liffId)],
          channelAccessToken
        );
        continue;
      }

      const { filtersJson, filterLabel } = parseFilterKey(filterKey);

      // Check if user has a recent search location within 1,000m
      const { data: lastLogs } = await supabaseAdmin
        .from('search_logs')
        .select('search_lat, search_lng')
        .eq('line_user_id', hashedUserId)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastLocation = Array.isArray(lastLogs) && lastLogs.length > 0 ? lastLogs[0] : null;

      if (lastLocation?.search_lat && lastLocation?.search_lng) {
        const lat = Number(lastLocation.search_lat);
        const lng = Number(lastLocation.search_lng);
        const dist = calculateHaversineM(lat, lng, THA_PRACHAN_CENTER.lat, THA_PRACHAN_CENTER.lng);

        if (dist <= 1500) {
          const { toilets, usedRadiusM } = await searchWithExpandingRadius(
            supabaseAdmin,
            lat,
            lng,
            filtersJson
          );

          const strictToilets = toilets.filter((t) => t.distance_m <= 500);

          if (strictToilets.length > 0) {
            const flexMsg = buildNearbyToiletsCarouselMessage(strictToilets, {
              appBaseUrl,
              liffId,
              activeRadiusM: usedRadiusM,
              activeFilterLabel: filterLabel || 'มธ. ท่าพระจันทร์',
            });
            await replyToLine(replyToken, [flexMsg], channelAccessToken);
            continue;
          }
        }
      }

      // If no valid recent campus location, send the filter selection card
      await replyToLine(
        replyToken,
        [buildFilterSelectionFlexMessage(liffId)],
        channelAccessToken
      );
      continue;
    }

    // 4. Text Message Event (e.g. "กรองห้องน้ำ" from Rich Menu, "หาห้องน้ำ", etc.)
    if (event.type === 'message' && event.message?.type === 'text' && replyToken) {
      const text = String(event.message.text || '').trim();

      if (text.includes('กรอง')) {
        await replyToLine(
          replyToken,
          [buildFilterSelectionFlexMessage(liffId)],
          channelAccessToken
        );
      } else {
        await replyToLine(
          replyToken,
          [
            {
              type: 'text',
              text: 'สวัสดีครับ! ยินดีต้อนรับสู่ "ปลดปล่อย (Plod-Ploi)" 🚽✨\n\nกดส่งตำแหน่ง หรือเลือกเปิดแผนที่ห้องน้ำ มธ. ท่าพระจันทร์ ได้เลยครับ 👇',
              quickReply: {
                items: [
                  {
                    type: 'action',
                    action: {
                      type: 'location',
                      label: '📍 ส่งตำแหน่งค้นหา',
                    },
                  },
                  {
                    type: 'action',
                    action: {
                      type: 'uri',
                      label: '🗺️ เปิดแผนที่ LIFF',
                      uri: `https://liff.line.me/${liffId}`,
                    },
                  },
                  {
                    type: 'action',
                    action: {
                      type: 'postback',
                      label: '🔍 กรองห้องน้ำ',
                      data: 'action=filter&filter=all',
                      displayText: 'กรองห้องน้ำ',
                    },
                  },
                ],
              },
            },
          ],
          channelAccessToken
        );
      }
      continue;
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
