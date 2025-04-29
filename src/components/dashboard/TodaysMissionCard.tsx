
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategyData } from "@/types/dashboard";

interface TodaysMissionCardProps {
  strategy: StrategyData | null;
  loading: boolean;
}

export const TodaysMissionCard = ({ strategy, loading }: TodaysMissionCardProps) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy || !strategy.weekly_calendar || !strategy.weekly_calendar[today]?.length) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">No content scheduled for today.</p>
          <Button>Add Task for Today</Button>
        </CardContent>
      </Card>
    );
  }

  const todayContent = strategy.weekly_calendar[today][0];
  
  // Mock script preview
  const scriptPreview = "Hook: Want to earn passive income with AI? Here's what I learned...";

  return (
    <Card className="mb-6 border-socialmize-purple">
      <CardHeader className="pb-2 bg-socialmize-light-purple rounded-t-lg">
        <CardTitle className="text-lg">Today's Mission</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <h3 className="font-medium text-lg mb-1">{todayContent}</h3>
        <p className="text-sm text-muted-foreground mb-4">{scriptPreview}</p>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">View Full Script</Button>
          <Button variant="outline" size="sm">Open Guide</Button>
          <Button size="sm" className="bg-socialmize-purple hover:bg-socialmize-dark-purple ml-auto">
            Mark as Posted (+20 XP)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
