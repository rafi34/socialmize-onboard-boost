
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield } from "lucide-react";

interface AdminLogDialogProps {
  targetUserId?: string;
  onLogCreated?: () => void;
}

export function AdminLogDialog({ targetUserId, onLogCreated }: AdminLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [metadata, setMetadata] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!action) {
      toast.error("Please select an action type");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create admin logs");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse metadata as JSON if provided, or use empty object
      let parsedMetadata = {};
      if (metadata) {
        try {
          parsedMetadata = JSON.parse(metadata);
        } catch (error) {
          toast.error("Invalid JSON in metadata field");
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.from("admin_logs").insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        action,
        metadata: parsedMetadata,
      });

      if (error) {
        console.error("Error creating admin log:", error);
        toast.error(`Failed to create admin log: ${error.message}`);
      } else {
        toast.success("Admin log created successfully");
        setOpen(false);
        setAction("");
        setMetadata("");
        if (onLogCreated) {
          onLogCreated();
        }
      }
    } catch (error) {
      console.error("Error creating admin log:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionOptions = [
    { value: "strategy_view", label: "Strategy View" },
    { value: "strategy_update", label: "Strategy Update" },
    { value: "strategy_reset", label: "Strategy Reset" },
    { value: "xp_override", label: "XP Override" },
    { value: "topic_approval", label: "Topic Approval" },
    { value: "script_generation", label: "Script Generation" },
    { value: "user_support", label: "User Support" },
    { value: "bug_fix", label: "Bug Fix" },
    { value: "other", label: "Other" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Shield className="h-4 w-4" /> Log Admin Action
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Admin Log</DialogTitle>
          <DialogDescription>
            Log administrative actions for audit and tracking purposes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="action" className="text-right text-sm font-medium">
              Action
            </label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="metadata" className="text-right text-sm font-medium">
              Metadata
            </label>
            <Textarea
              id="metadata"
              className="col-span-3"
              placeholder='{"key": "value"}'
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
            />
          </div>
          {targetUserId && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">User ID</label>
              <Input
                className="col-span-3"
                value={targetUserId}
                disabled
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Log"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
