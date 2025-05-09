// Usage: node checkOnboardingData.js <user_email>
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

async function checkOnboardingData(userEmail) {
  // 1. Check profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', userEmail)
    .single();

  if (profileError || !profile) {
    console.error('Could not find user with email:', userEmail);
    process.exit(1);
  }

  console.log('\n[profiles]');
  console.log(profile);

  // 2. Check onboarding_answers table
  const { data: onboardingAnswers, error: onboardingError } = await supabase
    .from('onboarding_answers')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (onboardingError) {
    console.error('Error fetching onboarding_answers:', onboardingError.message);
  } else if (!onboardingAnswers) {
    console.warn('No onboarding_answers found for this user.');
  } else {
    console.log('\n[onboarding_answers]');
    console.log(onboardingAnswers);
  }
}

const userEmail = process.argv[2];
if (!userEmail) {
  console.error('Usage: node checkOnboardingData.js <user_email>');
  process.exit(1);
}

checkOnboardingData(userEmail);
