import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xspshdeuppwaqjfbdfcb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HnnFmVvK-W0vzqBUEkqDbg_nZiaACgt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

