
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GeneratedScript } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, PieChartIcon, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays, isAfter, compareAsc } from "date-fns";

interface ContentAnalyticsProps {
  scripts: GeneratedScript[] | null;
  loading: boolean;
}

export const ContentAnalyticsSection = ({ scripts, loading }: ContentAnalyticsProps) => {
  const [contentTypeData, setContentTypeData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<'distribution' | 'weekly' | 'trends'>('distribution');
  const [topContentType, setTopContentType] = useState<string | null>(null);
  const [contentGrowth, setContentGrowth] = useState<number>(0);
  
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
      
      // Find top content type
      let maxCount = 0;
      let topType = null;
      Object.entries(typeCount).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topType = type;
        }
      });
      setTopContentType(topType);
      
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
      
      // Process trend data - looking at content creation over time
      const now = new Date();
      const dateMap: Record<string, number> = {};
      const lastWeekScripts = scripts.filter(script => {
        const scriptDate = new Date(script.created_at);
        return isAfter(scriptDate, subDays(now, 14));
      });
      
      // Get count for past 14 days
      for (let i = 13; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'MM/dd');
        dateMap[dateStr] = 0;
      }
      
      lastWeekScripts.forEach(script => {
        const date = new Date(script.created_at);
        const dateStr = format(date, 'MM/dd');
        if (dateMap[dateStr] !== undefined) {
          dateMap[dateStr] += 1;
        }
      });
      
      const trendDataArray = Object.entries(dateMap).map(([date, count]) => ({
        date,
        count
      }));
      setTrendData(trendDataArray);
      
      // Calculate growth rate (comparing last 7 days vs previous 7 days)
      const last7DaysScriptsCount = scripts.filter(script => {
        const scriptDate = new Date(script.created_at);
        return isAfter(scriptDate, subDays(now, 7));
      }).length;
      
      const previous7DaysScriptsCount = scripts.filter(script => {
        const scriptDate = new Date(script.created_at);
        return isAfter(scriptDate, subDays(now, 14)) && 
               compareAsc(scriptDate, subDays(now, 7)) < 0;
      }).length;
      
      const growthRate = previous7DaysScriptsCount > 0 
        ? ((last7DaysScriptsCount - previous7DaysScriptsCount) / previous7DaysScriptsCount) * 100 
        : last7DaysScriptsCount > 0 ? 100 : 0;
      
      setContentGrowth(parseFloat(growthRate.toFixed(1)));
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
        <div>
          <CardTitle>Content Analytics</CardTitle>
          <CardDescription>Track your content generation patterns and trends</CardDescription>
        </div>
        <Tabs value={activeChart} onValueChange={(value) => setActiveChart(value as 'distribution' | 'weekly' | 'trends')}>
          <TabsList>
            <TabsTrigger value="distribution" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Distribution</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Weekly</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Card className="bg-accent/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Top Content Type</p>
                  <h3 className="text-xl font-bold">{topContentType || "N/A"}</h3>
                </div>
                <PieChartIcon className="h-8 w-8 text-muted-foreground/70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-accent/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Content Growth</p>
                  <h3 className="text-xl font-bold flex items-center">
                    {contentGrowth}%
                    <Badge className={`ml-2 ${contentGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Last 7 days
                    </Badge>
                  </h3>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/70" />
              </div>
            </CardContent>
          </Card>
        </div>
      
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
        
        <TabsContent value="trends" className="mt-0">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} scripts`, 'Generated']} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Daily Content" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Content generation trend over the last 14 days
          </p>
        </TabsContent>
      </CardContent>
    </Card>
  );
};
