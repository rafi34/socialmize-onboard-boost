
import { StrategyData, GeneratedScript } from "@/types/dashboard";
import { ContentMissionsSection } from "./ContentMissionsSection";
import { ScriptPreviewsSection } from "./ScriptPreviewsSection";
import { WeeklyXPCard } from "./WeeklyXPCard";

interface DashboardContentProps {
  strategy: StrategyData | null;
  scripts: GeneratedScript[] | null;
  loading: boolean;
  refetchScripts?: () => void;
}

export const DashboardContent = ({ strategy, scripts, loading, refetchScripts }: DashboardContentProps) => {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ContentMissionsSection />
        </div>
        <div>
          <WeeklyXPCard />
        </div>
      </div>
      <ScriptPreviewsSection scripts={scripts} loading={loading} />
    </div>
  );
};
