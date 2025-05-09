
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelProgressCard } from "@/components/dashboard/LevelProgressCard";
import { ProgressData } from "@/types/dashboard";
import { WeeklyConsistencyTracker } from "./WeeklyConsistencyTracker";

interface CreatorSummaryHeaderProps {
  user: any;
  progress: ProgressData | null;
  loading?: boolean;
  refreshData?: () => void;
}

export const CreatorSummaryHeader = ({ 
  user, 
  progress, 
  loading = false,
  refreshData
}: CreatorSummaryHeaderProps) => {
  // Log progress data for debugging
  useEffect(() => {
    if (progress) {
      console.log("CreatorSummaryHeader received progress:", progress);
    }
  }, [progress]);

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
        <Skeleton className="h-40 w-full md:w-1/2 rounded-md" />
        <Skeleton className="h-40 w-full md:w-1/2 rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
      <div className="w-full md:w-1/2">
        <LevelProgressCard 
          progress={progress} 
          refreshData={refreshData} 
        />
      </div>
      <div className="w-full md:w-1/2">
        <WeeklyConsistencyTracker userId={user?.id} />
      </div>
    </div>
  );
};
