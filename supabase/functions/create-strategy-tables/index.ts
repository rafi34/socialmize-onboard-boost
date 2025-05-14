
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  createDeepProfile?: boolean;
  createMissionMap?: boolean;
  checkDeepProfile?: boolean;
  checkMissionMap?: boolean;
  saveProfile?: boolean;
  saveMissionMap?: boolean;
  userId?: string;
  profileData?: Record<string, any>;
  missionMapData?: Record<string, any>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const requestData: RequestBody = await req.json();
    let result = { success: false, message: "" };
    
    // Check for deep profile data
    if (requestData.checkDeepProfile && requestData.userId) {
      const { data, error } = await supabase
        .from('strategy_deep_profile')
        .select('*')
        .eq('user_id', requestData.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (!error && data) {
        return new Response(JSON.stringify({ 
          success: true, 
          profile: data 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // Check for mission map data
    if (requestData.checkMissionMap && requestData.userId) {
      const { data, error } = await supabase
        .from('mission_map_plans')
        .select('*')
        .eq('user_id', requestData.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (!error && data) {
        return new Response(JSON.stringify({ 
          success: true, 
          missionMap: data 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // Create strategy_deep_profile table if it doesn't exist
    if (requestData.createDeepProfile) {
      const { error } = await supabase.rpc('create_strategy_deep_profile_table');
      
      if (error) {
        console.error("Error creating strategy_deep_profile table:", error);
        result.message = "Failed to create strategy_deep_profile table: " + error.message;
      } else {
        result.success = true;
        result.message = "Created strategy_deep_profile table successfully";
      }
    }
    
    // Create mission_map_plans table if it doesn't exist
    if (requestData.createMissionMap) {
      const { error } = await supabase.rpc('create_mission_map_plans_table');
      
      if (error) {
        console.error("Error creating mission_map_plans table:", error);
        result.message = "Failed to create mission_map_plans table: " + error.message;
      } else {
        result.success = true;
        result.message = "Created mission_map_plans table successfully";
      }
    }
    
    // Save deep profile data
    if (requestData.saveProfile && requestData.userId && requestData.profileData) {
      const { error } = await supabase
        .from('strategy_deep_profile')
        .insert({
          user_id: requestData.userId,
          data: requestData.profileData
        });
      
      if (error) {
        console.error("Error saving deep profile:", error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Failed to save profile: " + error.message 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        result.success = true;
        result.message = "Saved deep profile successfully";
      }
    }
    
    // Save mission map data
    if (requestData.saveMissionMap && requestData.userId && requestData.missionMapData) {
      const { error } = await supabase
        .from('mission_map_plans')
        .insert({
          user_id: requestData.userId,
          data: requestData.missionMapData
        });
      
      if (error) {
        console.error("Error saving mission map:", error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Failed to save mission map: " + error.message 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        result.success = true;
        result.message = "Saved mission map successfully";
      }
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in create-strategy-tables function:", err);
    
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
