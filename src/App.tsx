import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OnboardingRoute } from "@/components/OnboardingRoute";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import StrategyChat from "./pages/StrategyChat";
import ReviewIdeas from "./pages/ReviewIdeas";
import GenerateScripts from "./pages/GenerateScripts";
import WeeklyCalendar from "./pages/WeeklyCalendar";
import TopicSuggestions from "./pages/TopicSuggestions";
import StrategyOverview from "./pages/StrategyOverview";
import Reminders from "./pages/Reminders";
import ScriptsLibrary from "./pages/ScriptsLibrary";
import InboxCenterPage from "./pages/InboxCenterPage";
import BadgesPage from "./pages/BadgesPage";

const queryClient = new QueryClient();

const AppLayout = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex flex-col min-h-screen ${className || ''}`}>
    <Navbar />
    <div className="flex-1">
      {children}
    </div>
  </div>
);

const PremiumAppLayout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout className="bg-gradient-to-br from-white to-gray-50">
    {children}
  </AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Auth page - accessible when not logged in */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Onboarding route - for users who need to complete onboarding */}
            <Route 
              path="/" 
              element={
                <OnboardingRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </OnboardingRoute>
              } 
            />
            
            {/* Dashboard - only for authenticated and onboarded users */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <Dashboard />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Weekly Calendar - only for authenticated and onboarded users */}
            <Route 
              path="/weekly-calendar" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <WeeklyCalendar />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Topic Suggestions - only for authenticated and onboarded users */}
            <Route 
              path="/topic-suggestions" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <TopicSuggestions />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Strategy Overview - only for authenticated and onboarded users */}
            <Route 
              path="/strategy-overview" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <StrategyOverview />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Reminders - only for authenticated and onboarded users */}
            <Route 
              path="/reminders" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <Reminders />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Scripts Library - only for authenticated and onboarded users */}
            <Route 
              path="/scripts-library" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <ScriptsLibrary />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Inbox Center - only for authenticated and onboarded users */}
            <Route 
              path="/inbox" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <InboxCenterPage />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Badges Page - only for authenticated and onboarded users */}
            <Route 
              path="/badges" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <BadgesPage />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Settings - only for authenticated and onboarded users */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Strategy Chat - only for authenticated users */}
            <Route 
              path="/strategy-chat" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <StrategyChat />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Review Content Ideas - only for authenticated users */}
            <Route 
              path="/review-ideas" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <ReviewIdeas />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Generate Scripts - only for authenticated users */}
            <Route 
              path="/generate-scripts" 
              element={
                <ProtectedRoute>
                  <PremiumAppLayout>
                    <GenerateScripts />
                  </PremiumAppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all not found route */}
            <Route path="*" element={
              <AppLayout>
                <NotFound />
              </AppLayout>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
