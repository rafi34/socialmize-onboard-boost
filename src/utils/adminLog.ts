
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateAdminLogParams {
  adminUserId: string;
  targetUserId?: string;
  action: string;
  metadata?: Record<string, any>;
}

/**
 * Creates an admin log entry in the database
 * @param params The log entry parameters
 * @returns A promise that resolves to a boolean indicating success or failure
 */
export const createAdminLog = async (params: CreateAdminLogParams): Promise<boolean> => {
  try {
    const { error } = await supabase.from("admin_logs").insert({
      admin_user_id: params.adminUserId,
      target_user_id: params.targetUserId,
      action: params.action,
      metadata: params.metadata || {},
    });

    if (error) {
      console.error("Error creating admin log:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error creating admin log:", error);
    return false;
  }
};

/**
 * Helper function to log a strategy-related admin action
 */
export const logStrategyAction = async (
  adminUserId: string,
  targetUserId: string,
  action: "view" | "update" | "reset" | "generate",
  details?: Record<string, any>
): Promise<void> => {
  const actionMapping = {
    view: "strategy_view",
    update: "strategy_update",
    reset: "strategy_reset",
    generate: "strategy_generate",
  };

  const success = await createAdminLog({
    adminUserId,
    targetUserId,
    action: actionMapping[action],
    metadata: details,
  });

  if (!success) {
    toast.error("Failed to log admin action");
  }
};
