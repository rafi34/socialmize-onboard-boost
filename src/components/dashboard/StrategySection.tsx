
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyData } from "@/types/dashboard";

interface StrategySectionProps {
  strategy: StrategyData | null;
  loading: boolean;
}

export const StrategySection = ({ strategy, loading }: StrategySectionProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple"></div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">Strategy Not Generated Yet</h3>
        <p className="text-muted-foreground">Please complete the onboarding process to generate your strategy.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Creator Level</CardTitle>
          <CardDescription>Based on your onboarding profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-socialmize-purple">
            {strategy.experience_level || "Beginner"}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Content Types</CardTitle>
          <CardDescription>Recommended formats for your audience</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {strategy.content_types?.map((type, index) => (
              <li key={index}>{type}</li>
            )) || "Loading content types..."}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Weekly Content Calendar</CardTitle>
          <CardDescription>Your optimal posting schedule</CardDescription>
        </CardHeader>
        <CardContent>
          {strategy.weekly_calendar ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {Object.entries(strategy.weekly_calendar).map(([day, posts]) => (
                <Card key={day} className="p-3">
                  <p className="font-bold text-center mb-2">{day}</p>
                  <ul className="text-sm space-y-1">
                    {posts.map((post, i) => (
                      <li key={i} className="py-1 px-2 bg-muted rounded">{post}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          ) : (
            <p>No weekly calendar available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
