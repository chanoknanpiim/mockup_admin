import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Production Project Fallback Configuration
export const PROJECT_SUPABASE_URL = 'https://wotvrvrfpwinvaagwnle.supabase.co';
export const PROJECT_SUPABASE_KEY = 'sb_publishable_Jw87Rp6PXwOFTW0v2Arlnw_RghodbjG';
export const PROJECT_STORAGE_BUCKET = 'toilet-photos';

export const ENV_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  PROJECT_SUPABASE_URL;

export const ENV_SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  PROJECT_SUPABASE_KEY;

export const ENV_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET ||
  PROJECT_STORAGE_BUCKET;

export function getSupabaseConfig() {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('plodploi_supabase_url');
    const savedKey = localStorage.getItem('plodploi_supabase_key');
    const savedBucket = localStorage.getItem('plodploi_storage_bucket');

    // Only use localStorage if it contains a valid https URL pointing to Supabase
    const finalUrl = (savedUrl && savedUrl.startsWith('https://')) ? savedUrl : ENV_SUPABASE_URL;
    const finalKey = (savedKey && savedKey.length > 10) ? savedKey : ENV_SUPABASE_KEY;
    const finalBucket = savedBucket || ENV_STORAGE_BUCKET;

    return { url: finalUrl, key: finalKey, bucket: finalBucket };
  }
  return { url: ENV_SUPABASE_URL, key: ENV_SUPABASE_KEY, bucket: ENV_STORAGE_BUCKET };
}

let cachedClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const { url, key } = getSupabaseConfig();

  if (typeof window !== 'undefined') {
    console.log('[Supabase Client] Active Endpoint:', url);
    console.log('[Supabase Client] Has NEXT_PUBLIC_SUPABASE_URL env:', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
  }

  if (!url || !key) {
    console.error('[Supabase Client] Missing Supabase URL or Key! Check Vercel Environment Variables.');
    return null;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('[Supabase Client] Initialization error:', err);
    return null;
  }
}

export function createSupabaseClientInstance(customUrl?: string, customKey?: string): SupabaseClient | null {
  if (customUrl || customKey) {
    const { url, key } = getSupabaseConfig();
    const finalUrl = customUrl ?? url;
    const finalKey = customKey ?? key;
    if (!finalUrl || !finalKey) return null;
    try {
      return createClient(finalUrl, finalKey);
    } catch (err) {
      console.error('[Supabase Client] Instance initialization error:', err);
      return null;
    }
  }
  return getBrowserSupabase();
}
