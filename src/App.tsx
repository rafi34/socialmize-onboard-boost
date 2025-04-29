
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

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <div className="flex-1">
      {children}
    </div>
  </div>
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
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
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
                  <AppLayout>
                    <StrategyChat />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Review Content Ideas - only for authenticated users */}
            <Route 
              path="/review-ideas" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReviewIdeas />
                  </AppLayout>
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
