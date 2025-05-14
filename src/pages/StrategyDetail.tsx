
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Target, BrainCircuit, MessageSquare } from "lucide-react";
import { MissionMap } from "@/components/strategy-chat/MissionMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStrategy } from "@/contexts/StrategyContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function StrategyDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { missionMap, deepProfile, loading, error } = useStrategy();
  
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  const handleChatWithStrategist = () => {
    navigate('/strategy-chat');
  };

  if (!user) {
    return <div className="p-6">Please log in to access this feature.</div>;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-background/90">
      {/* Header */}
      <div className="premium-header p-4 md:p-6 sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/20 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-3" 
            onClick={handleBack}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-[#22B573] to-[#4C9F85] bg-clip-text text-transparent flex items-center">
              <Target className="h-5 w-5 mr-2 text-[#22B573]" />
              Your Content Strategy
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Your personalized content roadmap</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 container py-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="mission">
            <TabsList>
              <TabsTrigger value="mission" className="flex items-center">
                <Target className="h-4 w-4 mr-2" /> Mission Map
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center">
                <BrainCircuit className="h-4 w-4 mr-2" /> Deep Profile
              </TabsTrigger>
              <TabsTrigger value="plan" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Full Plan
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="mission" className="mt-6">
              {loading ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 flex-1" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : error ? (
                <Card className="border-destructive/50 bg-destructive/10">
                  <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{error}</p>
                    <Button variant="outline" className="mt-4" onClick={handleChatWithStrategist}>
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : missionMap ? (
                <MissionMap phases={missionMap.phases || []} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Mission Map</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-12">
                    <BrainCircuit className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Mission Map Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Complete your strategy chat session to generate your personalized content mission map.
                    </p>
                    <Button onClick={handleChatWithStrategist} className="bg-[#22B573] hover:bg-[#1a9c5e]">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat with AI Strategist
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="profile" className="mt-6">
              {loading ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64" />
                  </CardContent>
                </Card>
              ) : error ? (
                <Card className="border-destructive/50 bg-destructive/10">
                  <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{error}</p>
                    <Button variant="outline" className="mt-4" onClick={handleChatWithStrategist}>
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : deepProfile ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Strategy Deep Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {Object.entries(deepProfile).map(([key, value]) => (
                        <div key={key} className="border-b pb-3">
                          <h3 className="font-medium mb-1 capitalize">{key.replace('_', ' ')}</h3>
                          <p className="text-muted-foreground">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Strategy Deep Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-12">
                    <BrainCircuit className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Deep Profile Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Complete your strategy chat session to build your personalized deep profile.
                    </p>
                    <Button onClick={handleChatWithStrategist} className="bg-[#22B573] hover:bg-[#1a9c5e]">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat with AI Strategist
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="plan" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Full Content Strategy Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Full plan content will go here */}
                  <p className="text-muted-foreground mb-6">
                    Your complete content strategy plan combines your mission map, deep profile insights, and tailored recommendations.
                  </p>
                  <Button 
                    onClick={handleChatWithStrategist} 
                    className="bg-[#22B573] hover:bg-[#1a9c5e]"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Continue Strategy Chat
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
