
import { Badge as BadgeType } from "@/types/inbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NextBadgeProps {
  badge: BadgeType;
  onActionClick: () => void;
}

export const NextBadge = ({ badge, onActionClick }: NextBadgeProps) => {
  return (
    <Card className="mb-8 border-dashed border-2 border-socialmize-purple">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-socialmize-purple" />
          Next Badge to Unlock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-3 rounded-full">
              <Trophy className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium">{badge.title}</h3>
              <p className="text-sm text-muted-foreground">{badge.unlockCriteria}</p>
            </div>
          </div>
          <Button size="sm" onClick={onActionClick}>
            Get Started <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
