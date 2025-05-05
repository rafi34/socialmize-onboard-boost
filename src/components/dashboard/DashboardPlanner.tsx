
import { 
  EnhancedWeeklyCalendarGrid, 
  ReminderCard, 
  LevelProgressCard 
} from "@/components/dashboard";
import { StrategyData, ProgressData, ReminderData } from "@/types/dashboard";

interface DashboardPlannerProps {
  strategy: StrategyData | null;
  progress: ProgressData | null;
  reminder: ReminderData | null;
  loading: boolean;
}

export const DashboardPlanner = ({
  strategy,
  progress,
  reminder,
  loading
}: DashboardPlannerProps) => {
  return (
    <div className="space-y-6">
      <EnhancedWeeklyCalendarGrid strategy={strategy} loading={loading} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReminderCard reminder={reminder} loading={loading} />
        <LevelProgressCard progress={progress} loading={loading} />
      </div>
    </div>
  );
};
