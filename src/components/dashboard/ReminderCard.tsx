
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReminderData } from "@/types/dashboard";
import { format, parseISO } from "date-fns";

interface ReminderCardProps {
  reminder: ReminderData | null;
  loading: boolean;
}

export const ReminderCard = ({ reminder, loading }: ReminderCardProps) => {
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Upcoming Shoot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!reminder) {
    return null;
  }

  if (!reminder.is_active) {
    return null;
  }

  const reminderDate = parseISO(reminder.reminder_time);
  const formattedDate = format(reminderDate, 'EEEE, h:mm a');

  return (
    <Card className="mb-6 border-socialmize-orange">
      <CardHeader className="pb-2 bg-orange-50 dark:bg-orange-900/20 rounded-t-lg">
        <CardTitle className="text-lg">Upcoming Shoot</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <h3 className="font-medium text-lg mb-2">
          Next Shoot: {formattedDate}
        </h3>
        {reminder.message && (
          <p className="text-sm text-muted-foreground mb-4">{reminder.message}</p>
        )}
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="outline" size="sm">Snooze</Button>
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
