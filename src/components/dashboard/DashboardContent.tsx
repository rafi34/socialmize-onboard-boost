
import { 
  TodaysMissionCard, 
  WeeklyConsistencyTracker, 
  StrategySuggestionSection, 
  ContentGenerationSection, 
  ScriptsSection, 
  ScriptPreviewsSection 
} from "@/components/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StrategyData, GeneratedScript } from "@/types/dashboard";

interface DashboardContentProps {
  strategy: StrategyData | null;
  scripts: GeneratedScript[] | null;
  loading: boolean;
  refetchScripts: () => Promise<void>;
}

export const DashboardContent = ({
  strategy,
  scripts,
  loading,
  refetchScripts
}: DashboardContentProps) => {
  return (
    <div className="space-y-6">
      <TodaysMissionCard strategy={strategy} loading={loading} />
      <WeeklyConsistencyTracker />
      <StrategySuggestionSection strategy={strategy} loading={loading} />
      <ContentGenerationSection
        strategy={strategy}
        loading={loading}
        refetchScripts={refetchScripts}
      />
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <ScriptsSection strategy={strategy} loading={loading} />
        </CardContent>
      </Card>
      <ScriptPreviewsSection scripts={scripts} loading={loading} />
    </div>
  );
};
