
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, BarChart2, PieChart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeneratedScript } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentAnalyticsSectionProps {
  scripts?: GeneratedScript[] | null;
  loading?: boolean;
}

export const ContentAnalyticsSection = ({ 
  scripts, 
  loading = false 
}: ContentAnalyticsSectionProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Calculate content metrics
  const contentCounts = scripts?.reduce((acc, script) => {
    const formatType = script.format_type || 'Unknown';
    acc[formatType] = (acc[formatType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Format content data for display
  const contentTypes = Object.keys(contentCounts);
  const totalScripts = scripts?.length || 0;
  
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Content Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-socialmize-purple" />
            Content Analytics
          </CardTitle>
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="content">
              Content Breakdown
            </TabsTrigger>
            <TabsTrigger value="performance">
              Performance
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Content</h3>
                <p className="text-2xl font-bold">{totalScripts}</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Content Types</h3>
                <p className="text-2xl font-bold">{contentTypes.length}</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Production Rate</h3>
                <p className="text-2xl font-bold">
                  {totalScripts > 0
                    ? <span className="flex items-center gap-1">{(totalScripts / 7).toFixed(1)} <span className="text-xs font-normal">/week</span></span>
                    : "N/A"}
                </p>
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Content Distribution</h3>
              <div className="flex flex-wrap gap-3">
                {contentTypes.length > 0 ? (
                  contentTypes.map(type => (
                    <div 
                      key={type} 
                      className="flex-1 min-w-[120px] p-3 bg-background rounded-md shadow-sm"
                    >
                      <div className="text-xs text-muted-foreground">{type}</div>
                      <div className="text-lg font-semibold mt-1">{contentCounts[type]}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round((contentCounts[type] / totalScripts) * 100)}% of total
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center w-full text-muted-foreground p-4">
                    No content data available
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Detailed breakdown of your content by type and performance metrics.
              </p>
              {contentTypes.length > 0 ? (
                <div className="space-y-2">
                  {contentTypes.map(type => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <h4 className="font-medium">{type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {contentCounts[type]} scripts
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 bg-muted rounded-full h-2 mr-2">
                          <div 
                            className="bg-socialmize-purple h-2 rounded-full" 
                            style={{ width: `${Math.round((contentCounts[type] / totalScripts) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">
                          {Math.round((contentCounts[type] / totalScripts) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-md">
                  <p>No content data available</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Generate Content
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Content performance metrics will be available once you start recording engagement metrics.
              </p>
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
                <BarChart className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Performance Tracking</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
                  Connect your social media accounts to track content performance and gain insights to optimize your strategy.
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  Connect Accounts
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
