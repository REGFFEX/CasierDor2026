import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost';
const supabaseAnonKey = 'dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
