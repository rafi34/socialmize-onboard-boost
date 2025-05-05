
import { ContentAnalyticsSection, WeeklyConsistencyCard } from "@/components/dashboard";
import { GeneratedScript } from "@/types/dashboard";

interface DashboardAnalyticsProps {
  scripts: GeneratedScript[] | null;
  loading: boolean;
}

export const DashboardAnalytics = ({
  scripts,
  loading
}: DashboardAnalyticsProps) => {
  return (
    <div className="space-y-6">
      <ContentAnalyticsSection scripts={scripts} loading={loading} />
      <WeeklyConsistencyCard />
    </div>
  );
};
