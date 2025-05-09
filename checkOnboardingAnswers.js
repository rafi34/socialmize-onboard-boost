// Usage: node checkOnboardingAnswers.js <user_id>
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

async function checkOnboardingAnswers(userId) {
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching onboarding_answers:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No onboarding_answers found for this user.');
  } else {
    console.log(`Onboarding answers for user_id ${userId}:`);
    data.forEach((row, idx) => {
      console.log(`Row ${idx + 1}:`, row);
    });
  }
}

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node checkOnboardingAnswers.js <user_id>');
  process.exit(1);
}

checkOnboardingAnswers(userId);
