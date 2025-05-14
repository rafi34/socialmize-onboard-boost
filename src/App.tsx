
import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'

import Index from '@/pages/Index'
import Dashboard from '@/pages/Dashboard'
import StrategyOverview from '@/pages/StrategyOverview'
import NotFound from '@/pages/NotFound'
import AuthPage from '@/pages/AuthPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OnboardingRoute } from '@/components/OnboardingRoute'
import AdminDashboard from '@/pages/AdminDashboard'
import { AdminRoute } from '@/components/AdminRoute'
import ScriptsLibrary from '@/pages/ScriptsLibrary'
import GenerateScripts from '@/pages/GenerateScripts'
import Settings from '@/pages/Settings'
import BadgesPage from '@/pages/BadgesPage'
import Reminders from '@/pages/Reminders'
import WeeklyCalendar from '@/pages/WeeklyCalendar'
import TopicSuggestions from '@/pages/TopicSuggestions'
import ReviewIdeas from '@/pages/ReviewIdeas'
import StrategyChat from '@/pages/StrategyChat'
import StrategyDetail from '@/pages/StrategyDetail'
import InboxCenterPage from '@/pages/InboxCenterPage'
import { AuthProvider } from './contexts/AuthContext'
import { OnboardingProvider } from './contexts/OnboardingContext'
import { StrategyProvider } from './contexts/StrategyContext'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <StrategyProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/strategy" element={
                <ProtectedRoute>
                  <StrategyOverview />
                </ProtectedRoute>
              } />
              
              <Route path="/strategy-detail" element={
                <ProtectedRoute>
                  <StrategyDetail />
                </ProtectedRoute>
              } />
              
              <Route path="/strategy-chat" element={
                <ProtectedRoute>
                  <StrategyChat />
                </ProtectedRoute>
              } />
              
              <Route path="/scripts" element={
                <ProtectedRoute>
                  <ScriptsLibrary />
                </ProtectedRoute>
              } />
              
              <Route path="/generate" element={
                <ProtectedRoute>
                  <GenerateScripts />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="/badges" element={
                <ProtectedRoute>
                  <BadgesPage />
                </ProtectedRoute>
              } />
              
              <Route path="/reminders" element={
                <ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>
              } />
              
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <WeeklyCalendar />
                </ProtectedRoute>
              } />
              
              <Route path="/topics" element={
                <ProtectedRoute>
                  <TopicSuggestions />
                </ProtectedRoute>
              } />
              
              <Route path="/review-ideas" element={
                <ProtectedRoute>
                  <ReviewIdeas />
                </ProtectedRoute>
              } />
              
              <Route path="/inbox" element={
                <ProtectedRoute>
                  <InboxCenterPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </StrategyProvider>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
