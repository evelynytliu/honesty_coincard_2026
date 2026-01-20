
import { createClient } from '@supabase/supabase-js';

// These should be in .env, but for this simple internal tool we can keep them here for now
// OR ask the user to input them.
// For now, I will use placeholders. The user will need to update this.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vrkrocxpdmtfmhzotfnk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZya3JvY3hwZG10Zm1oem90Zm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mjc2MjYsImV4cCI6MjA4NDAwMzYyNn0.vfXLl13fpChsytuqZbis98TLH1uv-KQEVCiRClfKY9I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
