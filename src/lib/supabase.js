import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = supabaseUrl && supabaseUrl !== 'undefined' && supabaseUrl.startsWith('http') && !supabaseUrl.includes('placeholder.supabase.co');

if (!isConfigured) {
  console.warn('Variáveis de ambiente do Supabase não encontradas ou inválidas. Usando fallback local.')
}

const mockSupabase = {
  from: () => {
    throw new Error('Supabase não configurado');
  }
};

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;
