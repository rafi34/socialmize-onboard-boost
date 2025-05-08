import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

export default function SupabaseTest() {
  const [result, setResult] = useState<string>('Checking connection...');

  useEffect(() => {
    async function testConnection() {
      // Replace 'users' with your actual table name if needed
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        setResult('Supabase connection error: ' + error.message);
      } else {
        setResult('Supabase connection successful! Sample data: ' + JSON.stringify(data));
      }
    }
    testConnection();
  }, []);

  return <div style={{padding:20,background:'#f8fafc',borderRadius:8}}>{result}</div>;
}
