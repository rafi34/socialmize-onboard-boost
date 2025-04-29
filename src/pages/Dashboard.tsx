
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container py-8">
        <h1 className="text-3xl font-bold mb-8">Welcome to your Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-2">Creator Profile</h2>
            <p className="text-muted-foreground mb-4">View and edit your creator profile settings.</p>
            <div className="text-sm">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
            </div>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-2">Content Strategy</h2>
            <p className="text-muted-foreground">Your personalized content strategy and scripts.</p>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-2">Creator Progress</h2>
            <p className="text-muted-foreground">Track your growth and engagement metrics.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
