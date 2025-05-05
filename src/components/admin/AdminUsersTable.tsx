
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
  Clock,
  AlertTriangle,
  Users,
  Shield,
  User,
  AlertCircle,
  Info
} from "lucide-react";
import { XPOverrideDialog } from "./XPOverrideDialog";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { AdminLogDialog } from "./AdminLogDialog";
import { logStrategyAction } from "@/utils/adminLog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

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
  data_status?: {
    hasProgress: boolean;
    hasStrategy: boolean;
  };
}

export function AdminUsersTable() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      
      console.log("Fetching all users...");
      
      // Query all auth users from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      console.log("Profiles fetched:", profilesData);
      
      if (!profilesData || profilesData.length === 0) {
        console.log("No users found in database");
        setUsers([]);
        setLoading(false);
        return;
      }

      // Map through all profiles and fetch related data
      const usersWithData = await Promise.all(profilesData.map(async (profile) => {
        // Initialize with default data structure and track what data is available
        const userData: UserData = {
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at,
          profile: {
            onboarding_complete: profile.onboarding_complete,
            metadata: profile.metadata || {}
          },
          progress: {
            current_xp: 0,
            current_level: 1,
            streak_days: 0
          },
          strategy: {
            niche_topic: '',
            summary: '',
            creator_style: '',
            posting_frequency: ''
          },
          data_status: {
            hasProgress: false,
            hasStrategy: false
          }
        };

        try {
          // Fetch progress tracking data
          const { data: progressData, error: progressError } = await supabase
            .from('progress_tracking')
            .select('*')
            .eq('user_id', profile.id)
            .maybeSingle();

          if (progressError) {
            console.warn(`Warning: Error fetching progress data for user ${profile.id}:`, progressError);
          } else if (progressData) {
            userData.progress = {
              current_xp: progressData.current_xp || 0,
              current_level: progressData.current_level || 1,
              streak_days: progressData.streak_days || 0
            };
            userData.data_status!.hasProgress = true;
          }
        } catch (err) {
          console.warn(`Warning: Exception in progress data fetch for user ${profile.id}:`, err);
        }

        try {
          // Fetch strategy profile data
          const { data: strategyData, error: strategyError } = await supabase
            .from('strategy_profiles')
            .select('*')
            .eq('user_id', profile.id)
            .maybeSingle();

          if (strategyError) {
            console.warn(`Warning: Error fetching strategy data for user ${profile.id}:`, strategyError);
          } else if (strategyData) {
            userData.strategy = {
              niche_topic: strategyData.niche_topic || '',
              summary: strategyData.summary || '',
              creator_style: strategyData.creator_style || '',
              posting_frequency: strategyData.posting_frequency || ''
            };
            userData.data_status!.hasStrategy = true;
          }
        } catch (err) {
          console.warn(`Warning: Exception in strategy data fetch for user ${profile.id}:`, err);
        }

        return userData;
      }));

      console.log("Transformed user data:", usersWithData);
      setUsers(usersWithData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(`Failed to load users: ${error.message || "Unknown error"}`);
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

  // Create user type filters
  const adminUsers = users.filter(user => user.profile.metadata?.is_admin === true);
  const regularUsers = users.filter(user => user.profile.metadata?.is_admin !== true);
  
  // Filter by search query
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.strategy.niche_topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get counts for the user types
  const adminCount = adminUsers.length;
  const regularCount = regularUsers.length;

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Function to determine if user is in onboarding
  const isInOnboarding = (userData: UserData) => {
    return !userData.profile.onboarding_complete;
  };

  // Function to render data status indicators
  const renderDataStatusIndicator = (userData: UserData) => {
    if (!userData.data_status) return null;
    
    if (!userData.data_status.hasProgress && !userData.data_status.hasStrategy) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-1" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Missing progress and strategy data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (!userData.data_status.hasProgress) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Info className="h-3.5 w-3.5 text-blue-500 ml-1" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Missing progress data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (!userData.data_status.hasStrategy) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Info className="h-3.5 w-3.5 text-blue-500 ml-1" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Missing strategy data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return null;
  };

  // Function to get user type badge
  const getUserTypeBadge = (userData: UserData) => {
    if (userData.profile.metadata?.is_admin) {
      return (
        <Badge variant="default" className="bg-socialmize-purple text-white flex items-center gap-1">
          <Shield className="h-3 w-3" />
          <span>Admin</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>Creator</span>
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white shadow-sm p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Users</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-socialmize-purple" />
          <h3 className="text-lg font-medium">All Users ({users.length})</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Admins: {adminCount}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Users: {regularCount}</span>
            </Badge>
          </div>
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
                  {users.length === 0 ? 
                    "No users found in the database. You need to create at least one user account." : 
                    "No users match your search criteria."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((userData) => (
                <TableRow key={userData.id} className={userData.profile.metadata?.is_admin ? "bg-purple-50" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-medium">{userData.email}</span>
                        {renderDataStatusIndicator(userData)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {getUserTypeBadge(userData)}
                        {isInOnboarding(userData) && (
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
                    {userData.strategy.niche_topic || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {userData.strategy.posting_frequency || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
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
