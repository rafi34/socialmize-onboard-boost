import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Eye, 
  Sparkles, 
  RefreshCw, 
  Trash, 
  Bug,
  Search,
  Clock
} from "lucide-react";
import { XPOverrideDialog } from "./XPOverrideDialog";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { AdminLogDialog } from "./AdminLogDialog";
import { logStrategyAction } from "@/utils/adminLog";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  profile: {
    onboarding_complete: boolean;
    metadata: any;
  };
  progress: {
    current_xp: number;
    current_level: number;
    streak_days: number;
  };
  strategy: {
    niche_topic: string;
    summary: string;
    creator_style: string;
    posting_frequency: string;
  };
}

interface ProgressTracking {
  current_xp: number;
  current_level: number;
  streak_days: number;
}

interface StrategyProfile {
  niche_topic: string;
  summary: string;
  creator_style: string;
  posting_frequency: string;
}

export function AdminUsersTable() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showXPOverride, setShowXPOverride] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          created_at,
          onboarding_complete,
          metadata,
          progress_tracking:progress_tracking(current_xp, current_level, streak_days),
          strategy_profiles:strategy_profiles(niche_topic, summary, creator_style, posting_frequency)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to the expected structure
      const transformedData = data.map(item => ({
        id: item.id,
        email: item.email,
        created_at: item.created_at,
        profile: {
          onboarding_complete: item.onboarding_complete,
          metadata: item.metadata || {}
        },
        progress: {
          current_xp: Array.isArray(item.progress_tracking) && item.progress_tracking.length > 0 
            ? (item.progress_tracking[0]?.current_xp || 0) 
            : 0,
          current_level: Array.isArray(item.progress_tracking) && item.progress_tracking.length > 0 
            ? (item.progress_tracking[0]?.current_level || 1) 
            : 1,
          streak_days: Array.isArray(item.progress_tracking) && item.progress_tracking.length > 0 
            ? (item.progress_tracking[0]?.streak_days || 0) 
            : 0
        },
        strategy: {
          niche_topic: Array.isArray(item.strategy_profiles) && item.strategy_profiles.length > 0 
            ? (item.strategy_profiles[0]?.niche_topic || '') 
            : '',
          summary: Array.isArray(item.strategy_profiles) && item.strategy_profiles.length > 0 
            ? (item.strategy_profiles[0]?.summary || '') 
            : '',
          creator_style: Array.isArray(item.strategy_profiles) && item.strategy_profiles.length > 0 
            ? (item.strategy_profiles[0]?.creator_style || '') 
            : '',
          posting_frequency: Array.isArray(item.strategy_profiles) && item.strategy_profiles.length > 0 
            ? (item.strategy_profiles[0]?.posting_frequency || '') 
            : ''
        }
      }));

      setUsers(transformedData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (userData: UserData) => {
    setSelectedUser(userData);
    setShowUserProfile(true);
    
    // Log this admin action
    if (user) {
      logStrategyAction(user.id, userData.id, "view", {
        action: "view_profile",
        page: "admin_dashboard",
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleXPOverride = (userData: UserData) => {
    setSelectedUser(userData);
    setShowXPOverride(true);
  };

  const handleResetStrategy = async (userData: UserData) => {
    if (!confirm("Are you sure you want to reset this user's strategy? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Delete strategy and log the action
      const { error } = await supabase
        .from('strategy_profiles')
        .delete()
        .eq('user_id', userData.id);
        
      if (error) throw error;
      
      toast.success("Strategy reset successfully");
      
      // Log this admin action
      if (user) {
        logStrategyAction(user.id, userData.id, "reset", {
          action: "reset_strategy",
          timestamp: new Date().toISOString()
        });
      }
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error resetting strategy:", error);
      toast.error("Failed to reset strategy");
    }
  };

  const handleDeleteScripts = async (userData: UserData) => {
    if (!confirm("Are you sure you want to delete all scripts for this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Delete scripts and log action
      const { error, count } = await supabase
        .from('generated_scripts')
        .delete({ count: 'exact' })
        .eq('user_id', userData.id);
        
      if (error) throw error;
      
      toast.success(`Deleted ${count} scripts successfully`);
      
      // Log this admin action
      if (user) {
        await supabase.from("admin_logs").insert({
          admin_user_id: user.id,
          target_user_id: userData.id,
          action: "delete_scripts",
          metadata: { count }
        });
      }
    } catch (error) {
      console.error("Error deleting scripts:", error);
      toast.error("Failed to delete scripts");
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.strategy.niche_topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">All Users</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Level & XP</TableHead>
              <TableHead>Content Niche</TableHead>
              <TableHead>Posting Schedule</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((userData) => (
                <TableRow key={userData.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{userData.email}</span>
                      <div className="flex items-center gap-1 mt-1">
                        {userData.profile.metadata?.is_admin && (
                          <Badge variant="default" className="bg-socialmize-purple text-white">Admin</Badge>
                        )}
                        {!userData.profile.onboarding_complete && (
                          <Badge variant="outline">Onboarding</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span>Level {userData.progress.current_level}</span>
                      </div>
                      <span className="text-sm text-muted-foreground mt-1">
                        {userData.progress.current_xp} XP
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {userData.strategy.niche_topic || "Not set"}
                  </TableCell>
                  <TableCell>
                    {userData.strategy.posting_frequency || "Not set"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{formatDate(userData.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProfile(userData)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <AdminLogDialog targetUserId={userData.id} />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleXPOverride(userData)}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            XP Override
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetStrategy(userData)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset Strategy
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteScripts(userData)}>
                            <Trash className="h-4 w-4 mr-2" />
                            Delete All Scripts
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <Bug className="h-4 w-4 mr-2" />
                            Fix User Issues
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* XP Override Dialog */}
      {selectedUser && (
        <XPOverrideDialog 
          open={showXPOverride} 
          onOpenChange={setShowXPOverride}
          userData={selectedUser}
          onXPUpdated={fetchUsers}
        />
      )}

      {/* User Profile Drawer */}
      {selectedUser && (
        <UserProfileDrawer
          open={showUserProfile}
          onOpenChange={setShowUserProfile}
          userData={selectedUser}
        />
      )}
    </div>
  );
}
