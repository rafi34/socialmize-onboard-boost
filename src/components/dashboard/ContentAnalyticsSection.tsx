
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedScript } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, PieChart as PieChartIcon } from "lucide-react";

interface ContentAnalyticsProps {
  scripts: GeneratedScript[] | null;
  loading: boolean;
}

export const ContentAnalyticsSection = ({ scripts, loading }: ContentAnalyticsProps) => {
  const [contentTypeData, setContentTypeData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<'distribution' | 'weekly'>('distribution');
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'];

  useEffect(() => {
    if (scripts && scripts.length > 0) {
      // Process content type distribution
      const typeCount: Record<string, number> = {};
      scripts.forEach(script => {
        const type = script.format_type || 'Unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      
      const distributionData = Object.entries(typeCount).map(([name, value], index) => ({
        name,
        value,
        fill: COLORS[index % COLORS.length]
      }));
      setContentTypeData(distributionData);
      
      // Process weekly content generation
      const weeklyStats: Record<string, number> = {
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
        'Saturday': 0,
        'Sunday': 0
      };
      
      scripts.forEach(script => {
        const date = new Date(script.created_at);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        weeklyStats[day] = (weeklyStats[day] || 0) + 1;
      });
      
      const weeklyDataArray = Object.entries(weeklyStats).map(([day, count]) => ({
        day,
        count
      }));
      
      setWeeklyData(weeklyDataArray);
    }
  }, [scripts]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!scripts || scripts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            No content data available yet. 
            Generate some content to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Content Analytics</CardTitle>
        <Tabs value={activeChart} onValueChange={(value) => setActiveChart(value as 'distribution' | 'weekly')}>
          <TabsList>
            <TabsTrigger value="distribution" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Distribution</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Weekly</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <TabsContent value="distribution" className="mt-0">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} scripts`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Distribution of content by type
          </p>
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-0">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} scripts`, 'Generated']} />
                <Bar dataKey="count" fill="#8884d8" name="Scripts Generated" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Scripts generated by day of week
          </p>
        </TabsContent>
      </CardContent>
    </Card>
  );
};
