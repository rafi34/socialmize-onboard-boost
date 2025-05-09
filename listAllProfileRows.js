// Usage: node listAllProfileRows.js
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

async function listAllRows() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching rows:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No rows found (possible RLS or permission issue).');
  } else {
    console.log('\nFirst 5 rows in profiles table:');
    data.forEach((row, idx) => {
      console.log(`Row ${idx + 1}:`, row);
    });
  }
}

listAllRows();
