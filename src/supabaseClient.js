import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) 
  || 'https://qnuplpdiuaulxhaaiklr.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) 
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudXBscGRpdWF1bHhoYWFpa2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMDc3NDIsImV4cCI6MjEwODY4Mzc0Mn0.kHtHgak1Oq-e3ocWfRmqRae8K9lNfv8FBA1YYzR7NEo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
