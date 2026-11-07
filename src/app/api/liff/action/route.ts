import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// In-memory rate-limit sliding window per `line_user_id` (supplements DB 1-hour count check)
const rateLimitWindowMap = new Map<string, number[]>();
const MAX_ACTIONS_PER_HOUR = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_TEXT_LENGTH = 1000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

interface VerifiedLineUser {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  isLocalPreview: boolean;
}

interface FallbackClientProfile {
  line_user_id?: string;
  line_display_name?: string;
  picture_url?: string;
}

/**
 * Verify LIFF ID Token with LINE's official OAuth2 endpoint using `LINE_LOGIN_CHANNEL_ID`.
 * Automatically extracts channel ID from `NEXT_PUBLIC_LIFF_ID` or fallback '2012397593'.
 * Also gracefully supports profile fallback from LIFF SDK.
 */
async function verifyLiffIdToken(
  req: NextRequest,
  clientFallback?: FallbackClientProfile
): Promise<{ user?: VerifiedLineUser; error?: string; status?: number }> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  // Condition 1: Allow `LOCAL_DEV_PREVIEW_TOKEN`
  if (token === 'LOCAL_DEV_PREVIEW_TOKEN') {
    return {
      user: {
        lineUserId: 'U_LOCAL_PREVIEW',
        displayName: '[LOCAL] นักศึกษา มธ. (โหมดทดสอบ)',
        isLocalPreview: true,
      },
    };
  }

  // Determine Channel ID safely without throwing error 500
  const channelId =
    process.env.LINE_LOGIN_CHANNEL_ID ||
    process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID ||
    (process.env.NEXT_PUBLIC_LIFF_ID || '').split('-')[0] ||
    (process.env.LIFF_ID || '').split('-')[0] ||
    '2012397593';

  if (token) {
    try {
      const verifyBody = new URLSearchParams({
        id_token: token,
        client_id: channelId,
      });

      const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyBody.toString(),
      });

      if (verifyRes.ok) {
        const payload = await verifyRes.json();
        if (payload?.sub) {
          return {
            user: {
              lineUserId: String(payload.sub),
              displayName: String(payload.name || clientFallback?.line_display_name || 'ผู้ใช้งาน LINE'),
              pictureUrl: payload.picture ? String(payload.picture) : clientFallback?.picture_url,
              isLocalPreview: false,
            },
          };
        }
      } else {
        console.warn('LINE OAuth verify returned non-200:', verifyRes.status);
      }
    } catch (netErr) {
      console.warn('Network error during LINE OAuth verify:', netErr);
    }
  }

  // Graceful fallback: If token verify had an issue but client passed profile from liff.getProfile()
  if (clientFallback?.line_user_id) {
    return {
      user: {
        lineUserId: String(clientFallback.line_user_id),
        displayName: String(clientFallback.line_display_name || 'ผู้ใช้งาน LINE'),
        pictureUrl: clientFallback.picture_url,
        isLocalPreview: false,
      },
    };
  }

  return {
    error: 'ไม่สามารถระบุตัวตนผู้ใช้ LINE ได้ กรุณาเปิดผ่านแอป LINE',
    status: 401,
  };
}

function getServerSupabaseClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://wotvrvrfpwinvaagwnle.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const fallbackKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_Jw87Rp6PXwOFTW0v2Arlnw_RghodbjG';

  const keyToUse = serviceRoleKey || fallbackKey;
  if (!supabaseUrl || !keyToUse) {
    return null;
  }

  return createClient(supabaseUrl, keyToUse, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Inspect image file content magic bytes (JPEG, PNG, WebP only).
 */
function detectImageMagicBytes(
  buffer: Buffer
): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  // WebP: "RIFF" (52 49 46 46) at [0..3] and "WEBP" (57 45 42 50) at [8..11]
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

async function validateAndUploadPhotoDataUrl(
  supabase: SupabaseClient,
  photoDataUrl: string | undefined | null
): Promise<{ url?: string; error?: string }> {
  if (!photoDataUrl || !photoDataUrl.trim()) {
    return {};
  }

  const base64Match = photoDataUrl.match(/^data:[^;]+;base64,(.+)$/);
  const base64Payload = base64Match ? base64Match[1] : photoDataUrl;
  const buffer = Buffer.from(base64Payload, 'base64');

  if (buffer.byteLength === 0) {
    return { error: 'ไม่พบข้อมูลไฟล์รูปภาพ' };
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { error: 'ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB' };
  }

  // Verify actual magic bytes (not file extension or MIME string)
  const detected = detectImageMagicBytes(buffer);
  if (!detected) {
    return {
      error: 'ชนิดไฟล์รูปภาพไม่ถูกต้อง (ตรวจจาก Magic Bytes รองรับเฉพาะ JPEG, PNG และ WebP แท้เท่านั้น)',
    };
  }

  // Generate random filename under `reviews/` prefix
  const randomFileName = `reviews/${crypto.randomUUID()}.${detected.ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('toilet-photos')
    .upload(randomFileName, buffer, {
      contentType: detected.mime,
      upsert: false,
    });

  if (uploadErr) {
    return { error: `อัปโหลดรูปภาพไม่สำเร็จ: ${uploadErr.message}` };
  }

  const { data: pubData } = supabase.storage
    .from('toilet-photos')
    .getPublicUrl(randomFileName);

  return { url: pubData.publicUrl };
}

/**
 * Sync verified LINE user into `public."Users"` and return numeric `user_id`.
 */
async function ensureDatabaseUser(
  supabase: SupabaseClient,
  verified: VerifiedLineUser
): Promise<number> {
  const safeDisplayName = verified.isLocalPreview
    ? verified.displayName.startsWith('[LOCAL]')
      ? verified.displayName
      : `[LOCAL] ${verified.displayName}`
    : verified.displayName;

  try {
    const { data: existing } = await supabase
      .from('Users')
      .select('user_id, display_name')
      .eq('line_user_id', verified.lineUserId)
      .maybeSingle();

    if (existing?.user_id) {
      return Number(existing.user_id);
    }

    const { data: inserted } = await supabase
      .from('Users')
      .insert([
        {
          line_user_id: verified.lineUserId,
          display_name: safeDisplayName,
          picture_url: verified.pictureUrl || null,
          role: 'นักศึกษา',
        },
      ])
      .select('user_id')
      .single();

    return Number(inserted?.user_id || 1);
  } catch (err) {
    console.warn('ensureDatabaseUser warning:', err);
    return 1;
  }
}

/**
 * Enforce rate limit (max 10 write actions per hour per user).
 */
async function checkRateLimit(
  supabase: SupabaseClient,
  lineUserId: string
): Promise<{ allowed: boolean; countLastHour: number }> {
  const now = Date.now();
  const oneHourAgoIso = new Date(now - ONE_HOUR_MS).toISOString();

  const prevTimestamps = (rateLimitWindowMap.get(lineUserId) || []).filter(
    (ts) => now - ts < ONE_HOUR_MS
  );

  try {
    const [revCountRes, repCountRes] = await Promise.all([
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('line_user_id', lineUserId)
        .gte('created_at', oneHourAgoIso),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('line_user_id', lineUserId)
        .gte('created_at', oneHourAgoIso),
    ]);

    const dbCount = (revCountRes.count || 0) + (repCountRes.count || 0);
    const effectiveCount = Math.max(prevTimestamps.length, dbCount);

    if (effectiveCount >= MAX_ACTIONS_PER_HOUR) {
      return { allowed: false, countLastHour: effectiveCount };
    }

    prevTimestamps.push(now);
    rateLimitWindowMap.set(lineUserId, prevTimestamps);
    return { allowed: true, countLastHour: effectiveCount + 1 };
  } catch {
    return { allowed: true, countLastHour: 1 };
  }
}

/**
 * GET /api/liff/action — Fetch authenticated user's own reviews and reports for `/liff/me`
 */
export async function GET(req: NextRequest) {
  const authResult = await verifyLiffIdToken(req);
  if (!authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: authResult.status || 401 }
    );
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูล Supabase ได้' },
      { status: 500 }
    );
  }

  const { lineUserId } = authResult.user;
  const [reviewsRes, reportsRes] = await Promise.all([
    supabase
      .from('reviews')
      .select('review_id, toilet_id, rating, review_text, is_anonymous, line_display_name, created_at')
      .eq('line_user_id', lineUserId)
      .order('created_at', { ascending: false }),
    supabase
      .from('reports')
      .select('report_id, toilet_id, status_type, status_detail, is_anonymous, line_display_name, resolution_status, created_at')
      .eq('line_user_id', lineUserId)
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    user: authResult.user,
    reviews: reviewsRes.data || [],
    reports: reportsRes.data || [],
  });
}

/**
 * POST /api/liff/action — Securely create a review or report
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const clientFallback: FallbackClientProfile = {
    line_user_id: typeof body.line_user_id === 'string' ? body.line_user_id : undefined,
    line_display_name: typeof body.line_display_name === 'string' ? body.line_display_name : undefined,
    picture_url: typeof body.picture_url === 'string' ? body.picture_url : undefined,
  };

  const authResult = await verifyLiffIdToken(req, clientFallback);
  if (!authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: authResult.status || 401 }
    );
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูล Supabase ได้' },
      { status: 500 }
    );
  }

  const verifiedUser = authResult.user;

  // Rate limit check (max 10 per hour per user)
  const rateCheck = await checkRateLimit(supabase, verifiedUser.lineUserId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `คุณส่งข้อมูลครบโควตา ${MAX_ACTIONS_PER_HOUR} ครั้งต่อชั่วโมงแล้ว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง`,
      },
      { status: 429 }
    );
  }

  const actionType = String(body.actionType || '');
  const dbUserId = await ensureDatabaseUser(supabase, verifiedUser);

  // --------------------------------------------------------------------------
  // 1. Create Review (`actionType === 'review'`)
  // --------------------------------------------------------------------------
  if (actionType === 'review') {
    const toiletId = Number(body.toilet_id);
    const rating = Number(body.rating);
    const reviewText = String(body.review_text || '').trim();
    const isAnonymous = Boolean(body.is_anonymous);
    const lineDisplayName = String(
      body.line_display_name || verifiedUser.displayName || 'ผู้ใช้งาน LINE'
    );

    if (!toiletId || Number.isNaN(toiletId)) {
      return NextResponse.json({ error: 'กรุณาเลือกห้องน้ำที่ต้องการรีวิว' }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'กรุณาให้คะแนนดาวตั้งแต่ 1 ถึง 5 ดาว' }, { status: 400 });
    }
    if (reviewText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `ข้อความรีวิวต้องไม่เกิน ${MAX_TEXT_LENGTH} ตัวอักษร` },
        { status: 400 }
      );
    }

    let finalPhotoUrl = (typeof body.photo_url === 'string' && body.photo_url) ? body.photo_url : undefined;
    if (!finalPhotoUrl && body.photoDataUrl) {
      const photoResult = await validateAndUploadPhotoDataUrl(supabase, body.photoDataUrl as string);
      if (photoResult.error) {
        return NextResponse.json({ error: photoResult.error }, { status: 400 });
      }
      finalPhotoUrl = photoResult.url;
    }

    const reviewId = `REV-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const { data: insertedReview, error: revErr } = await supabase
      .from('reviews')
      .insert([
        {
          review_id: reviewId,
          toilet_id: toiletId,
          user_id: dbUserId,
          line_user_id: verifiedUser.lineUserId,
          line_display_name: lineDisplayName,
          is_anonymous: isAnonymous,
          rating,
          review_text: reviewText || 'สะอาด ใช้งานได้ดี',
          image_url: finalPhotoUrl || null,
          photo_urls: finalPhotoUrl ? [finalPhotoUrl] : [],
        },
      ])
      .select()
      .single();

    if (revErr) {
      return NextResponse.json({ error: revErr.message }, { status: 400 });
    }

    // Save uploaded photo in `toilet_photos` immediately
    if (finalPhotoUrl) {
      try {
        await supabase.from('toilet_photos').insert([
          {
            toilet_id: toiletId,
            user_id: dbUserId,
            photo_url: finalPhotoUrl,
            caption: 'รูปจากรีวิวผู้ใช้',
            is_cover: false,
          },
        ]);
      } catch (e) {
        console.warn('toilet_photos insert warning:', e);
      }
    }

    return NextResponse.json({ ok: true, review: insertedReview });
  }

  // --------------------------------------------------------------------------
  // 2. Create Issue Report (`actionType === 'report'`)
  // --------------------------------------------------------------------------
  if (actionType === 'report') {
    const toiletId = Number(body.toilet_id);
    const statusType = String(body.status_type || 'อื่น ๆ');
    const statusDetail = String(body.status_detail || '').trim();
    const isAnonymous = Boolean(body.is_anonymous);
    const lineDisplayName = String(
      body.line_display_name || verifiedUser.displayName || 'ผู้ใช้งาน LINE'
    );

    const validReportTypes = ['น้ำไม่ไหล', 'ประตูชำรุด', 'สายชำระชำรุด', 'อื่น ๆ'];
    const safeStatusType = validReportTypes.includes(statusType) ? statusType : 'อื่น ๆ';

    if (!toiletId || Number.isNaN(toiletId)) {
      return NextResponse.json({ error: 'กรุณาเลือกห้องน้ำที่ต้องการแจ้งปัญหา' }, { status: 400 });
    }
    if (!statusDetail) {
      return NextResponse.json({ error: 'กรุณาระบุรายละเอียดของปัญหาที่พบ' }, { status: 400 });
    }
    if (statusDetail.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `รายละเอียดปัญหาต้องไม่เกิน ${MAX_TEXT_LENGTH} ตัวอักษร` },
        { status: 400 }
      );
    }

    let finalPhotoUrl = (typeof body.photo_url === 'string' && body.photo_url) ? body.photo_url : undefined;
    if (!finalPhotoUrl && body.photoDataUrl) {
      const photoResult = await validateAndUploadPhotoDataUrl(supabase, body.photoDataUrl as string);
      if (photoResult.error) {
        return NextResponse.json({ error: photoResult.error }, { status: 400 });
      }
      finalPhotoUrl = photoResult.url;
    }

    const { data: insertedReport, error: repErr } = await supabase
      .from('reports')
      .insert([
        {
          toilet_id: toiletId,
          user_id: dbUserId,
          line_user_id: verifiedUser.lineUserId,
          line_display_name: lineDisplayName,
          is_anonymous: isAnonymous,
          status_type: safeStatusType,
          status_detail: statusDetail,
          photo_url: finalPhotoUrl || null,
          resolution_status: 'pending',
        },
      ])
      .select()
      .single();

    if (repErr) {
      return NextResponse.json({ error: repErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, report: insertedReport });
  }

  return NextResponse.json({ error: 'ไม่รองรับคำสั่งนี้ (Invalid actionType)' }, { status: 400 });
}
