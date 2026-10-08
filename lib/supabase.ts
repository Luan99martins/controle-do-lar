import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  // Impede lançamento silencioso sem login funcional.
  console.warn('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no Cloudflare Pages.');
}
export const supabase = createClient(url || 'https://example.supabase.co', key || 'missing-public-key');
export const hasSupabaseConfig = Boolean(url && key);
