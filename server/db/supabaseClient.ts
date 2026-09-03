import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log(`[Supabase] ✅ Cliente inicializado correctamente para: ${supabaseUrl}`);
  } catch (err: any) {
    console.error(`[Supabase] ❌ Error inicializando cliente:`, err.message);
    supabase = null;
  }
} else {
  console.log(`[Supabase] ℹ️ Variables SUPABASE_URL o SUPABASE_KEY no configuradas. Operando en modo local resiliente.`);
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
