import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const ENV_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';

export const ENV_SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  '';

export const ENV_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'report-photos';

export function getSupabaseConfig() {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('plodploi_supabase_url') || ENV_SUPABASE_URL;
    const savedKey = localStorage.getItem('plodploi_supabase_key') || ENV_SUPABASE_KEY;
    const savedBucket = localStorage.getItem('plodploi_storage_bucket') || ENV_STORAGE_BUCKET;
    return { url: savedUrl, key: savedKey, bucket: savedBucket };
  }
  return { url: ENV_SUPABASE_URL, key: ENV_SUPABASE_KEY, bucket: ENV_STORAGE_BUCKET };
}

export function createSupabaseClientInstance(customUrl?: string, customKey?: string): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  const finalUrl = customUrl ?? url;
  const finalKey = customKey ?? key;

  if (!finalUrl || !finalKey) {
    return null;
  }

  try {
    return createClient(finalUrl, finalKey);
  } catch (err) {
    console.error('Supabase initialization error:', err);
    return null;
  }
}
