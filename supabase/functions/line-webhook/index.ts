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

const SEARCH_RADII_M = [300, 500, 1000, 3000] as const;
const MAX_CAROUSEL_CARDS = 12;

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
  await fetch('https://api.line.me/v2/bot/message/reply', {
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

    // 2. Location Message Event -> Expanding search 300m -> 500m -> 1000m -> 3000m
    if (event.type === 'message' && event.message?.type === 'location' && replyToken) {
      const lat = Number(event.message.latitude);
      const lng = Number(event.message.longitude);

      const { toilets, usedRadiusM } = await searchWithExpandingRadius(
        supabaseAdmin,
        lat,
        lng,
        {}
      );

      // Round coordinates to 3 decimal places before storing in `search_logs`
      const roundedLat = roundCoord3(lat);
      const roundedLng = roundCoord3(lng);

      await supabaseAdmin.from('search_logs').insert([
        {
          line_user_id: hashedUserId,
          source: 'line_webhook',
          search_lat: roundedLat,
          search_lng: roundedLng,
          radius_m: usedRadiusM,
          results_count: toilets.length,
          filters: {},
        },
      ]);

      if (toilets.length === 0) {
        await replyToLine(
          replyToken,
          [
            {
              type: 'text',
              text: 'ไม่พบห้องน้ำที่เปิดใช้งานในรัศมี 3 กม. รอบตำแหน่งของคุณครับ 🙏\nสามารถลองเปลี่ยนจุดค้นหาหรือเปิดแผนที่ทั้งหมดใน LIFF ได้เลยครับ',
              quickReply: buildQuickReplyFilterItems(),
            },
          ],
          channelAccessToken
        );
      } else {
        const flexMsg = buildNearbyToiletsCarouselMessage(toilets, {
          appBaseUrl,
          liffId,
          activeRadiusM: usedRadiusM,
          activeFilterLabel: null,
        });
        await replyToLine(replyToken, [flexMsg], channelAccessToken);
      }
      continue;
    }

    // 3. Postback Event (Rich Menu Button 3 "กรองห้องน้ำ" or Quick Reply filter chips)
    if (event.type === 'postback' && replyToken) {
      const params = new URLSearchParams(event.postback?.data || '');
      const filterKey = params.get('filter') || 'all';
      const { filtersJson, filterLabel } = parseFilterKey(filterKey);

      // Look up the user's latest rounded location from `search_logs` (if any)
      const { data: lastLogs } = await supabaseAdmin
        .from('search_logs')
        .select('search_lat, search_lng')
        .eq('line_user_id', hashedUserId)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastLocation = Array.isArray(lastLogs) && lastLogs.length > 0 ? lastLogs[0] : null;

      if (lastLocation && lastLocation.search_lat && lastLocation.search_lng) {
        const lat = Number(lastLocation.search_lat);
        const lng = Number(lastLocation.search_lng);
        const { toilets, usedRadiusM } = await searchWithExpandingRadius(
          supabaseAdmin,
          lat,
          lng,
          filtersJson
        );

        await supabaseAdmin.from('search_logs').insert([
          {
            line_user_id: hashedUserId,
            source: 'line_webhook',
            search_lat: roundCoord3(lat),
            search_lng: roundCoord3(lng),
            radius_m: usedRadiusM,
            results_count: toilets.length,
            filters: filtersJson,
          },
        ]);

        if (toilets.length > 0) {
          const flexMsg = buildNearbyToiletsCarouselMessage(toilets, {
            appBaseUrl,
            liffId,
            activeRadiusM: usedRadiusM,
            activeFilterLabel: filterLabel,
          });
          await replyToLine(replyToken, [flexMsg], channelAccessToken);
          continue;
        }
      }

      // If no previous location or no matching toilets found, send filter card + location Quick Reply
      await replyToLine(
        replyToken,
        [buildFilterSelectionFlexMessage(liffId)],
        channelAccessToken
      );
      continue;
    }

    // 4. Text Message Event (e.g. "กรองห้องน้ำ" from Rich Menu Button 3 or "หาห้องน้ำ")
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
              text: 'กดปุ่ม "📍 ส่งตำแหน่งใหม่" ด้านล่างเพื่อค้นหาห้องน้ำใกล้คุณในรัศมี 300 ม. – 3 กม. หรือเลือกตัวกรองที่ต้องการได้เลยครับ 👇',
              quickReply: buildQuickReplyFilterItems(),
            },
          ],
          channelAccessToken
        );
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
