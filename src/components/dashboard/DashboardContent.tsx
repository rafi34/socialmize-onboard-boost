
import { StrategyData, GeneratedScript } from "@/types/dashboard";
import { ScriptPreviewsSection } from "./ScriptPreviewsSection";
import { LeaderboardSection } from "./LeaderboardSection";

interface DashboardContentProps {
  strategy: StrategyData | null;
  scripts: GeneratedScript[] | null;
  loading: boolean;
  refetchScripts?: () => void;
}

export const DashboardContent = ({ strategy, scripts, loading, refetchScripts }: DashboardContentProps) => {
  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <ScriptPreviewsSection scripts={scripts} loading={loading} />
      </div>
      
      <div className="space-y-6">
        <LeaderboardSection />
      </div>
    </div>
  );
};
