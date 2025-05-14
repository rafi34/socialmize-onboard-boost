
import { useState, useEffect } from 'react'
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
                  <OnboardingRoute>
                    <Dashboard />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/strategy" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <StrategyOverview />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/strategy-detail" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <StrategyDetail />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/strategy-chat" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <StrategyChat />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/scripts" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <ScriptsLibrary />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/generate" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <GenerateScripts />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <Settings />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/badges" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <BadgesPage />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/reminders" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <Reminders />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <WeeklyCalendar />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/topics" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <TopicSuggestions />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/review-ideas" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <ReviewIdeas />
                  </OnboardingRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/inbox" element={
                <ProtectedRoute>
                  <OnboardingRoute>
                    <InboxCenterPage />
                  </OnboardingRoute>
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
