import { supabase } from './lib/supabaseClient';

async function testConnection() {
  // Replace 'users' with your actual table name if needed
  const { data, error } = await supabase.from('users').select('*').limit(1);

  if (error) {
    console.error('Supabase connection error:', error);
  } else {
    console.log('Supabase connection successful! Sample data:', data);
  }
}

testConnection();
