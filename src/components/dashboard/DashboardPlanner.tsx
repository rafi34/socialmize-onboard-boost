
import { 
  EnhancedWeeklyCalendarGrid, 
  ReminderCard, 
  LevelProgressCard 
} from "@/components/dashboard";
import { StrategyData, ReminderData, ProgressData } from "@/types/dashboard";

interface DashboardPlannerProps {
  strategy: StrategyData | null;
  reminder: ReminderData | null;
  loading: boolean;
  progress?: ProgressData | null;
}

export const DashboardPlanner = ({
  strategy,
  reminder,
  loading,
  progress
}: DashboardPlannerProps) => {
  return (
    <div className="space-y-6">
      <EnhancedWeeklyCalendarGrid strategy={strategy} loading={loading} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReminderCard reminder={reminder} loading={loading} />
        <LevelProgressCard loading={loading} progress={progress} />
      </div>
    </div>
  );
};
