
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-socialmize-light-purple via-background to-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Creator Strategy</h1>
            <p className="text-muted-foreground">Ready to build your first viral moment</p>
          </div>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <div className="bg-socialmize-light-purple px-3 py-1 rounded-full text-socialmize-purple">
              Level 1
            </div>
            <div className="flex items-center gap-1">
              <span className="text-socialmize-purple font-bold">⚡</span>
              <span>100 XP</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <span className="text-socialmize-orange font-bold">🔥</span>
              <span>0 Day Streak</span>
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Starter Scripts</CardTitle>
                <CardDescription>Ready-to-use content ideas based on your preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="p-4 border rounded-lg hover:border-socialmize-purple transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">Script #{index}</h3>
                        <span className="bg-socialmize-light-purple text-socialmize-purple text-xs px-2 py-1 rounded-full">
                          30-60 sec
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        "5 things I wish I knew before starting [your niche]! The third one changed everything..."
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Use</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">View All Scripts</Button>
              </CardContent>
            </Card>
            
            <Button className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple text-white font-semibold py-6 rounded-xl">
              Post Today's Content + Earn 20 XP
            </Button>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Weekly Calendar</CardTitle>
                <CardDescription>Your content plan for this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <div key={day} className="p-3 border rounded-lg flex justify-between items-center">
                      <div className="font-medium">{day}</div>
                      <div className="text-xs bg-socialmize-light-purple text-socialmize-purple px-2 py-1 rounded-full">
                        Suggested
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
