
import { supabase } from './integrations/supabase/client';

async function testConnection() {
  // Using 'profiles' table which exists in the database
  const { data, error } = await supabase.from('profiles').select('*').limit(1);

  if (error) {
    console.error('Supabase connection error:', error);
  } else {
    console.log('Supabase connection successful! Sample data:', data);
  }
}

testConnection();
