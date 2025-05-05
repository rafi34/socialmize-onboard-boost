
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
import { Shield, Users, Activity, Bug } from "lucide-react";
import { logStrategyAction } from "@/utils/adminLog";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("users");

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
        heading="Admin Dashboard"
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
