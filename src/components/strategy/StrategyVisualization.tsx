
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid } from "recharts";
import { StrategyData } from "@/types/dashboard";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartPie, ChartBar, ChartArea } from "lucide-react";

interface StrategyVisualizationProps {
  strategy: StrategyData | null;
  usedTopicsCount: number;
  totalTopicsCount: number;
}

export const StrategyVisualization = ({ 
  strategy, 
  usedTopicsCount,
  totalTopicsCount 
}: StrategyVisualizationProps) => {
  // Content type distribution for visualization
  const contentTypeData = useMemo(() => {
    if (!strategy?.content_types?.length) return [];
    
    // Return content types with their frequency
    return strategy.content_types.map((type, index) => ({
      name: type,
      value: 1,
      fill: getContentTypeColor(index)
    }));
  }, [strategy?.content_types]);
  
  // Topic utilization data
  const topicUtilizationData = useMemo(() => {
    return [
      { name: "Used", value: usedTopicsCount, fill: "#8884d8" },
      { name: "Remaining", value: Math.max(0, totalTopicsCount - usedTopicsCount), fill: "#e0e0e0" }
    ];
  }, [usedTopicsCount, totalTopicsCount]);
  
  // Weekly content plan data
  const weeklyPlanData = useMemo(() => {
    if (!strategy?.weekly_calendar) return [];
    
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return weekdays.map(day => ({
      name: day.substring(0, 3), // Abbreviate day names
      content: (strategy.weekly_calendar[day] || []).length
    }));
  }, [strategy?.weekly_calendar]);

  // Projected growth data (simulated)
  const projectedGrowthData = useMemo(() => {
    const baseFollowers = 100;
    const weeklyGrowth = 0.15; // 15% weekly growth
    
    return Array.from({ length: 12 }, (_, i) => ({
      week: `Week ${i + 1}`,
      followers: Math.round(baseFollowers * Math.pow(1 + weeklyGrowth, i))
    }));
  }, []);

  // Engagement prediction data (simulated)
  const engagementPredictionData = useMemo(() => {
    // Different engagement rates for different content types
    const contentTypes = strategy?.content_types || [];
    if (contentTypes.length === 0) return [];
    
    return contentTypes.map((type, index) => {
      // Simulate different engagement rates for different content types
      const baseRate = 2 + (index % 3) * 1.5;
      
      return {
        name: type,
        rate: baseRate,
        fill: getContentTypeColor(index)
      };
    });
  }, [strategy?.content_types]);
  
  // Helper to get color for content type
  function getContentTypeColor(index: number) {
    const colors = [
      "#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", 
      "#a4de6c", "#d0ed57", "#ffc658", "#ff8042"
    ];
    return colors[index % colors.length];
  }
  
  if (!strategy) {
    return null;
  }
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ 
    cx, cy, midAngle, innerRadius, outerRadius, percent, name 
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Content Types Distribution */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChartPie className="h-5 w-5 text-socialmize-purple" />
            Content Format Mix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {contentTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {contentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No content type data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Topic Utilization */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChartPie className="h-5 w-5 text-socialmize-purple" />
            Topic Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {totalTopicsCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topicUtilizationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topicUtilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No topic data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly Content Posting Plan */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChartBar className="h-5 w-5 text-socialmize-purple" />
            Weekly Content Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {weeklyPlanData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPlanData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any) => [`${value} content items`, 'Planned Content']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="content" fill="#8884d8" name="Planned Content" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No weekly schedule data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Chart: Projected Audience Growth */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChartArea className="h-5 w-5 text-socialmize-purple" />
            Projected Audience Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectedGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value} followers`, 'Projected Followers']}
                  labelFormatter={(label) => `${label}`}
                />
                <Line type="monotone" dataKey="followers" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* New Chart: Engagement Prediction by Content Type */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChartBar className="h-5 w-5 text-socialmize-purple" />
            Predicted Engagement by Content Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {engagementPredictionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementPredictionData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Avg. Engagement Rate']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar dataKey="rate" fill="#8884d8" name="Predicted Engagement Rate (%)">
                    {engagementPredictionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No engagement prediction data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
