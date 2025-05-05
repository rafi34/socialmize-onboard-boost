
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  progress: {
    current_xp: number;
    current_level: number;
  };
}

interface XPOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: UserData;
  onXPUpdated: () => void;
}

export function XPOverrideDialog({ 
  open, 
  onOpenChange, 
  userData, 
  onXPUpdated 
}: XPOverrideDialogProps) {
  const { user } = useAuth();
  const [xp, setXp] = useState<number>(userData.progress.current_xp);
  const [level, setLevel] = useState<number>(userData.progress.current_level);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleXPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setXp(value);
    }
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setLevel(value);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Get current values for logging
      const { data: currentData, error: fetchError } = await supabase
        .from('progress_tracking')
        .select('current_xp, current_level')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      const previousXp = currentData?.current_xp || 0;
      const previousLevel = currentData?.current_level || 1;
      
      // Update the progress_tracking table
      const { error } = await supabase
        .from('progress_tracking')
        .update({
          current_xp: xp,
          current_level: level,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userData.id);

      if (error) throw error;
      
      // Create admin log entry
      await supabase.from("admin_logs").insert({
        admin_user_id: user.id,
        target_user_id: userData.id,
        action: "xp_override",
        metadata: {
          previous_xp: previousXp,
          previous_level: previousLevel,
          new_xp: xp,
          new_level: level,
          reason
        }
      });
      
      toast.success("XP and level updated successfully");
      onOpenChange(false);
      onXPUpdated();
      
    } catch (error) {
      console.error("Error updating XP and level:", error);
      toast.error("Failed to update XP and level");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            XP & Level Override
          </DialogTitle>
          <DialogDescription>
            Manually adjust XP and level for {userData.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-xp" className="text-right">
              Current XP
            </Label>
            <div className="col-span-3 text-muted-foreground">
              {userData.progress.current_xp}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-level" className="text-right">
              Current Level
            </Label>
            <div className="col-span-3 text-muted-foreground">
              {userData.progress.current_level}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-xp" className="text-right">
              New XP
            </Label>
            <Input
              id="new-xp"
              type="number"
              value={xp}
              onChange={handleXPChange}
              min={0}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-level" className="text-right">
              New Level
            </Label>
            <Input
              id="new-level"
              type="number"
              value={level}
              onChange={handleLevelChange}
              min={1}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Textarea
              id="reason"
              placeholder="Reason for adjustment (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
