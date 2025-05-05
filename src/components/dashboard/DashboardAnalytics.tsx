
import { ContentAnalyticsSection, WeeklyConsistencyCard } from "@/components/dashboard";
import { GeneratedScript } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, TrendingUp, LineChart, BarChart2, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";

interface DashboardAnalyticsProps {
  scripts: GeneratedScript[] | null;
  loading: boolean;
}

export const DashboardAnalytics = ({
  scripts,
  loading
}: DashboardAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<'content' | 'performance'>('content');
  const [contentMetrics, setContentMetrics] = useState({
    totalScripts: 0,
    recentScripts: 0,
    avgPerDay: 0,
    mostUsedFormat: '',
  });

  useEffect(() => {
    if (scripts && scripts.length > 0) {
      // Calculate total scripts
      const total = scripts.length;
      
      // Calculate scripts in last 7 days
      const now = new Date();
      const recentDate = subDays(now, 7);
      const recent = scripts.filter(script => 
        new Date(script.created_at) >= recentDate
      ).length;
      
      // Calculate average per day (last 7 days)
      const avgPerDay = recent / 7;
      
      // Find most used format
      const formatCounts: Record<string, number> = {};
      scripts.forEach(script => {
        const format = script.format_type || 'Unknown';
        formatCounts[format] = (formatCounts[format] || 0) + 1;
      });
      
      let maxCount = 0;
      let mostUsed = '';
      Object.entries(formatCounts).forEach(([format, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostUsed = format;
        }
      });
      
      setContentMetrics({
        totalScripts: total,
        recentScripts: recent,
        avgPerDay: parseFloat(avgPerDay.toFixed(1)),
        mostUsedFormat: mostUsed,
      });
    }
  }, [scripts]);

  return (
    <div className="space-y-6">
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'content' | 'performance')}
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Scripts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-2xl font-bold">{contentMetrics.totalScripts}</div>
                <p className="text-xs text-muted-foreground">All-time generated content</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Recent Scripts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-2xl font-bold">{contentMetrics.recentScripts}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Daily Average
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-2xl font-bold">{contentMetrics.avgPerDay}</div>
                <p className="text-xs text-muted-foreground">Scripts per day</p>
              </CardContent>
            </Card>
          </div>
          
          <ContentAnalyticsSection scripts={scripts} loading={loading} />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Analytics about your content performance will appear here</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <BarChart2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Performance tracking coming soon</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Connect your social media accounts to see engagement metrics
                </p>
              </div>
            </CardContent>
          </Card>
          
          <WeeklyConsistencyCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
