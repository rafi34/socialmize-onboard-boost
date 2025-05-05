
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminLogsTable } from "@/components/admin/AdminLogsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Activity, Bug, Settings } from "lucide-react";
import { logStrategyAction } from "@/utils/adminLog";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("users");
  const [christianAdminInProgress, setChristianAdminInProgress] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user?.id });
      
      if (error) throw error;
      
      setIsAdmin(!!data);
      
      if (!data) {
        toast.error("You don't have admin access");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast.error("Error checking admin permissions");
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const makeChristianAdmin = async () => {
    try {
      if (!user) return;
      
      setChristianAdminInProgress(true);
      
      // First, find Christian's user ID by email
      const { data: christianUser, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'christian@communitylaunch.com')
        .single();
      
      if (lookupError) {
        console.error("Error finding Christian's user ID:", lookupError);
        toast.error("Couldn't find Christian in the system");
        setChristianAdminInProgress(false);
        return;
      }
      
      if (!christianUser || !christianUser.id) {
        toast.error("Christian's user account not found");
        setChristianAdminInProgress(false);
        return;
      }
      
      console.log("Found Christian's user ID:", christianUser.id);
      
      // Now call the RPC function with the correct user ID
      const { data, error } = await supabase
        .rpc('set_admin_status', { 
          target_user_id: christianUser.id, 
          is_admin: true,
          admin_user_id: user.id
        });
      
      if (error) {
        console.error("Failed to make Christian an admin:", error);
        toast.error("Failed to make Christian an admin: " + error.message);
        return;
      }
      
      console.log("Admin status update result:", data);
      
      // Log this action
      await supabase.from("admin_logs").insert({
        admin_user_id: user.id,
        target_user_id: christianUser.id,
        action: "grant_admin",
        metadata: { method: "makeChristianAdmin", operation: "success" }
      });
      
      toast.success("Admin privileges granted to Christian");
    } catch (error: any) {
      console.error("Error making Christian admin:", error);
      toast.error("Error making Christian admin: " + error.message);
    } finally {
      setChristianAdminInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container py-8">
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, fix issues, and optimize platform growth"
        icon={<Shield className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Activity Logs</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                <span>Debug Tools</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Admin Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <AdminUsersTable />
            </TabsContent>

            <TabsContent value="logs">
              <AdminLogsTable />
            </TabsContent>

            <TabsContent value="tools">
              <div className="rounded-lg border p-6 bg-white shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Platform Debug Tools</h3>
                <p className="text-muted-foreground mb-6">
                  Advanced tools for troubleshooting and fixing user issues. These actions are logged.
                </p>
                
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Coming soon...</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="rounded-lg border p-6 bg-white shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Admin Configuration</h3>
                <p className="text-muted-foreground mb-6">
                  Configure admin users and platform settings.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-amber-600" />
                      Special Admin Controls
                    </h4>
                    <p className="text-sm text-amber-800 mb-4">
                      These actions grant special admin privileges to specific users.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={makeChristianAdmin}
                      disabled={christianAdminInProgress}
                      className="bg-white"
                    >
                      {christianAdminInProgress ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span> Processing...
                        </>
                      ) : (
                        "Make Christian an Admin"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <AdminStatsCard />
          
          <div className="rounded-lg border p-4 bg-white shadow-sm">
            <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
            <Separator className="my-2" />
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Admin tools coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
