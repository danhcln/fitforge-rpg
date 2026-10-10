import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { db } from '@/services/db'
import { AppShell } from '@/components/layout'
import {
  DashboardPage,
  CharacterPage,
  WorkoutPage,
  BodyAnalysisPage,
  GoalsPlanningPage,
  HistoryAchievementsPage,
  SettingsPage,
} from '@/pages'

export default function App() {
  useEffect(() => {
    // Initialize Dexie IndexedDB with seed data if running for the first time
    db.seedInitialData().catch((err) => {
      console.warn('FitForge RPG local database initialization note:', err)
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/character" element={<CharacterPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/body-analysis" element={<BodyAnalysisPage />} />
          <Route path="/goals" element={<GoalsPlanningPage />} />
          <Route path="/history" element={<HistoryAchievementsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
