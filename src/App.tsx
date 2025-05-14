
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import { Index } from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Settings } from "./pages/Settings";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { OnboardingRoute } from "./components/OnboardingRoute";
import { AdminRoute } from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import Reminders from "./pages/Reminders";
import BadgesPage from "./pages/BadgesPage";
import ScriptsLibrary from "./pages/ScriptsLibrary";
import GenerateScripts from "./pages/GenerateScripts";
import ContentPlanner from "./pages/ContentPlanner";
import WeeklyCalendar from "./pages/WeeklyCalendar";
import InboxCenterPage from "./pages/InboxCenterPage";
import TopicSuggestions from "./pages/TopicSuggestions";
import StrategyChat from "./pages/StrategyChat";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute>{null}</ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/scripts" element={<ScriptsLibrary />} />
        <Route path="/generate-scripts" element={<GenerateScripts />} />
        <Route path="/content-planner" element={<ContentPlanner />} />
        <Route path="/calendar" element={<WeeklyCalendar />} />
        <Route path="/inbox" element={<InboxCenterPage />} />
        <Route path="/topic-suggestions" element={<TopicSuggestions />} />
        <Route path="/strategy-chat" element={<StrategyChat />} />
      </Route>
      
      {/* Admin Routes */}
      <Route element={<AdminRoute>{null}</AdminRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      
      {/* Onboarding Routes */}
      <Route element={<OnboardingRoute>{null}</OnboardingRoute>}>
        {/* Any onboarding specific routes go here */}
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
