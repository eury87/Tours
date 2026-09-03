import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nhaaxhwbfcgtgnursyya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oYWF4aHdiZmNndGdudXJzeXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTI0MzAsImV4cCI6MjEwNDAyODQzMH0.1MtnF_Q0AUKX2gCGScIXQ64Tw9M72s7kxV6u2tIoNZQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
