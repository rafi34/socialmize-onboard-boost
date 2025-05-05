
import { useState } from "react";
import { Badge as BadgeType } from "@/types/inbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock, Sparkles, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface BadgeCardProps {
  badge: BadgeType;
}

export const BadgeCard = ({ badge }: BadgeCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getIconComponent = () => {
    switch (badge.icon) {
      case 'trophy':
        return <Trophy className="h-12 w-12" />;
      case 'star':
        return <Star className="h-12 w-12" />;
      case 'sparkles':
        return <Sparkles className="h-12 w-12" />;
      default:
        return <Trophy className="h-12 w-12" />;
    }
  };

  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  };

  const iconVariants = {
    initial: { rotate: 0 },
    hover: badge.isUnlocked ? { rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.6 } } : {}
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate={isHovered ? "hover" : "initial"}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="h-full"
        >
          <Card 
            className={`h-full flex flex-col relative overflow-hidden border-2 ${
              badge.isUnlocked 
                ? "border-socialmize-purple bg-white" 
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {badge.isUnlocked && (
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-socialmize-yellow rounded-full opacity-20" />
            )}
            
            <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
              <div 
                className={`mb-4 rounded-full p-4 ${
                  badge.isUnlocked 
                    ? "bg-socialmize-light-purple text-socialmize-purple" 
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                <motion.div variants={iconVariants} animate={isHovered ? "hover" : "initial"}>
                  {getIconComponent()}
                </motion.div>
              </div>
              
              <h3 className={`font-bold text-lg mb-1 ${badge.isUnlocked ? "" : "text-gray-500"}`}>
                {badge.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {badge.description}
              </p>
              
              <div className="mt-auto flex flex-col gap-2 w-full">
                <Badge 
                  variant={badge.isUnlocked ? "default" : "outline"} 
                  className={`w-full ${badge.isUnlocked ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                >
                  {badge.isUnlocked ? (
                    <div className="flex items-center gap-1">
                      <span>✅</span> Unlocked
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> {badge.unlockCriteria}
                    </div>
                  )}
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className={`w-full ${badge.isUnlocked ? "bg-socialmize-light-purple text-socialmize-purple" : "text-gray-500"}`}
                >
                  +{badge.xpReward} XP
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{badge.isUnlocked ? `Unlocked: ${badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : 'Recently'}` : badge.unlockCriteria}</p>
      </TooltipContent>
    </Tooltip>
  );
};
