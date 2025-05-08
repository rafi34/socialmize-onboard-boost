
import React, { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

const SupabaseTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>("Testing connection to Supabase...");

  useEffect(() => {
    async function testConnection() {
      try {
        // Using 'profiles' table which exists in the database
        const { data, error } = await supabase.from("profiles").select("*").limit(1);
        
        if (error) {
          console.error("Supabase connection error:", error);
          setIsConnected(false);
          setMessage(`Connection failed: ${error.message}`);
        } else {
          console.log("Supabase connection successful!", data);
          setIsConnected(true);
          setMessage("Successfully connected to Supabase!");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setIsConnected(false);
        setMessage(`Unexpected error: ${err}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Supabase Connection Test</h1>
      <div className={`p-4 rounded ${isConnected ? 'bg-green-100' : isConnected === false ? 'bg-red-100' : 'bg-gray-100'}`}>
        <p>{message}</p>
        {isConnected === true && (
          <p className="text-green-600 mt-2">✓ Connected to Supabase</p>
        )}
        {isConnected === false && (
          <p className="text-red-600 mt-2">✗ Failed to connect to Supabase</p>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;
