import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cbwfpuuubknvkioosaip.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid2ZwdXV1Ymtudmtpb29zYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTkwOTUsImV4cCI6MjA5MTMzNTA5NX0.Ft6JVh8VfWlcq5CsEDdlefwv45pPvzGk2csx16e4YDM';

export const supabase = createClient(supabaseUrl, supabaseKey);
