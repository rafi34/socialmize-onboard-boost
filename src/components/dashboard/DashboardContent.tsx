
import { StrategyData, GeneratedScript } from "@/types/dashboard";
import { ContentMissionsSection } from "./ContentMissionsSection";
import { ScriptPreviewsSection } from "./ScriptPreviewsSection";

interface DashboardContentProps {
  strategy: StrategyData | null;
  scripts: GeneratedScript[] | null;
  loading: boolean;
  refetchScripts?: () => void;
}

export const DashboardContent = ({ strategy, scripts, loading, refetchScripts }: DashboardContentProps) => {
  return (
    <div className="grid gap-6">
      <ContentMissionsSection />
      <ScriptPreviewsSection scripts={scripts} loading={loading} />
    </div>
  );
};
