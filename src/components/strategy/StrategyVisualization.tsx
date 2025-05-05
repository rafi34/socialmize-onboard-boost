
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { StrategyData } from "@/types/dashboard";

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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Content Format Mix</CardTitle>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Topic Utilization</CardTitle>
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
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Content Schedule</CardTitle>
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
    </div>
  );
};
