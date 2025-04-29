
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyData } from "@/types/dashboard";

interface ScriptsSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
}

export const ScriptsSection = ({ strategy, loading }: ScriptsSectionProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple"></div>
      </div>
    );
  }

  if (!strategy?.starter_scripts?.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">No Scripts Available</h3>
        <p className="text-muted-foreground">Please complete the onboarding process to generate your content scripts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {strategy.starter_scripts.map((script, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>Script {index + 1}: {script.title}</CardTitle>
            <CardDescription>Ready to shoot!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md whitespace-pre-line">
              {script.script}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
