// This script marks the current user as onboarded in Supabase.
// Usage: node markOnboardingComplete.ts <user_email>

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function markOnboardingComplete(userEmail: string) {
  // Find user by email
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (error || !user) {
    console.error('Could not find user with email:', userEmail);
    process.exit(1);
  }

  // Update onboarding_complete and profile_progress
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true, profile_progress: 100 })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to update onboarding status:', updateError.message);
    process.exit(1);
  }

  console.log('Onboarding marked as complete for:', userEmail);
}

// Get email from command line
const userEmail = process.argv[2];
if (!userEmail) {
  console.error('Usage: node markOnboardingComplete.ts <user_email>');
  process.exit(1);
}

markOnboardingComplete(userEmail);
