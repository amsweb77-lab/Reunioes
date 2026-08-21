import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis de ambiente do Supabase não encontradas. Verifique o arquivo .env.local')
}

let validUrl = 'https://placeholder.supabase.co';
try {
  new URL(supabaseUrl);
  validUrl = supabaseUrl;
} catch (e) {
  // Ignora o erro se a URL não for válida, usa o placeholder para evitar crash
}

export const supabase = createClient(
  validUrl, 
  supabaseAnonKey || 'sua-chave-anonima'
)
