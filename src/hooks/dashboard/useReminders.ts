
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { ReminderData } from "@/types/dashboard";

export function useReminders() {
  const { user } = useAuth();
  const [reminder, setReminder] = useState<ReminderData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('reminder_time', now)
        .order('reminder_time', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      if (data) setReminder(data as ReminderData);
    } catch (err) {
      console.error("Error fetching reminders:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [user, fetchReminders]);

  return {
    reminder,
    loading,
    fetchReminders
  };
}
