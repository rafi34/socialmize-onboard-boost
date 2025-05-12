
import { createClient } from '@supabase/supabase-js';

// Hardcode the Supabase URL and anon key for this project
const supabaseUrl = 'https://psauygzfbxvefnetudem.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYXV5Z3pmYnh2ZWZuZXR1ZGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NzkzODYsImV4cCI6MjA2MTQ1NTM4Nn0.xCszNtCzvfWEDbz61mJUxXzTJkWfzQncPlXRQtFjBW8';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
