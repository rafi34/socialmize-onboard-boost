
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TopicSuggestionGridProps {
  topics: string[];
  usedTopics: string[];
  onRefresh: () => Promise<void>;
  onMarkAsUsed: (topic: string) => Promise<void>;
  refreshing: boolean;
  creatorStyle: string;
}

export const TopicSuggestionGrid = ({
  topics,
  usedTopics,
  onRefresh,
  onMarkAsUsed,
  refreshing,
  creatorStyle,
}: TopicSuggestionGridProps) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Helper to check if a topic has been used
  const isTopicUsed = (topic: string) => {
    return usedTopics.includes(topic.toLowerCase());
  };

  // Get style-specific colors
  const getStyleColor = () => {
    switch (creatorStyle) {
      case "educational":
        return "text-blue-600";
      case "entertaining":
        return "text-purple-600";
      case "inspirational":
        return "text-amber-600";
      case "authoritative":
        return "text-emerald-600";
      default:
        return "text-socialmize-purple";
    }
  };

  const styleColor = getStyleColor();

  return (
    <div className="space-y-6">
      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic, index) => {
            const isUsed = isTopicUsed(topic);
            
            return (
              <motion.div
                key={`${topic}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Card 
                  className={`h-full transition-all duration-300 ${
                    isUsed ? "bg-gray-100 border-gray-200" : "bg-white hover:shadow-md"
                  }`}
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex-1 mb-3 relative">
                      {!isUsed && hoveredCard === index && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute -top-1 -left-1"
                        >
                          <Sparkles className={`h-5 w-5 ${styleColor}`} />
                        </motion.div>
                      )}
                      
                      <h3 
                        className={`text-base leading-6 font-medium mt-1 ${
                          isUsed ? "text-gray-500" : "text-gray-900"
                        }`}
                      >
                        {topic}
                      </h3>
                      
                      {isUsed && (
                        <Badge variant="outline" className="mt-2 bg-gray-100 text-gray-500">
                          Used
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <Button
                        variant={isUsed ? "outline" : "default"}
                        size="sm"
                        className={`w-full ${
                          isUsed ? "text-gray-500" : "bg-socialmize-purple hover:bg-socialmize-dark-purple"
                        }`}
                        onClick={() => !isUsed && onMarkAsUsed(topic)}
                        disabled={isUsed}
                      >
                        {isUsed ? (
                          <span className="flex items-center">
                            <Check className="h-4 w-4 mr-2" /> Marked as Used
                          </span>
                        ) : (
                          "Mark as Used"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      <div className="flex justify-center mt-8">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onRefresh}
                className="bg-socialmize-purple hover:bg-socialmize-dark-purple"
                disabled={refreshing}
                size="lg"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing Topics...' : 'Refresh Topics'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Generate new topic suggestions
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
