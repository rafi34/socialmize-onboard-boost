// Usage: node listAllProfileEmails.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllEmails() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email');

  if (error) {
    console.error('Error fetching emails:', error.message);
    process.exit(1);
  }

  console.log('\nAll emails in profiles table:');
  data.forEach(profile => {
    console.log(`ID: ${profile.id} | Email: '${profile.email}'`);
  });
}

listAllEmails();
