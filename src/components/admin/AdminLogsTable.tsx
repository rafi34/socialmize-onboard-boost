
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminLog {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  action: string;
  metadata: any;
  created_at: string;
  admin_email?: string;
}

interface AdminLogsTableProps {
  userId?: string; // Optional - if provided, only shows logs for this user
}

export function AdminLogsTable({ userId }: AdminLogsTableProps) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmails, setAdminEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Create query for logs
      let query = supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false });
        
      // If userId is provided, filter by target_user_id
      if (userId) {
        query = query.eq('target_user_id', userId);
      }
      
      // Limit to 100 most recent logs
      query = query.limit(100);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Collect all unique admin user IDs
      const adminIds = [...new Set(data.map(log => log.admin_user_id))];
      
      // Fetch admin email addresses
      if (adminIds.length > 0) {
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', adminIds);
          
        if (adminError) throw adminError;
        
        // Create map of admin IDs to emails
        const emailMap: Record<string, string> = {};
        adminData.forEach(admin => {
          emailMap[admin.id] = admin.email;
        });
        
        setAdminEmails(emailMap);
      }
      
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      toast.error("Failed to load admin logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      xp_override: "bg-yellow-500",
      strategy_view: "bg-blue-500",
      strategy_update: "bg-green-500",
      strategy_reset: "bg-red-500",
      strategy_generate: "bg-purple-500",
      delete_scripts: "bg-orange-500",
    };
    
    const actionLabels: Record<string, string> = {
      xp_override: "XP Override",
      strategy_view: "Strategy View",
      strategy_update: "Strategy Update",
      strategy_reset: "Strategy Reset",
      strategy_generate: "Strategy Generate",
      delete_scripts: "Delete Scripts"
    };
    
    const color = actionColors[action] || "bg-gray-500";
    const label = actionLabels[action] || action;
    
    return (
      <Badge className={color}>{label}</Badge>
    );
  };

  const getAdminEmail = (adminId: string) => {
    return adminEmails[adminId] || "Unknown admin";
  };

  const renderMetadata = (metadata: any) => {
    if (!metadata) return null;
    
    try {
      // Format the metadata as JSON string with indentation
      return (
        <pre className="text-xs bg-muted p-2 rounded-md max-h-20 overflow-auto">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      );
    } catch (error) {
      return <span className="text-xs text-muted-foreground">Invalid metadata format</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Admin Logs</h3>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No admin logs found
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    {getAdminEmail(log.admin_user_id)}
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell className="max-w-md">
                    {renderMetadata(log.metadata)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
