import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { db } from '@/services/db'
import { DatabaseSync } from '@/services/db/DatabaseSync'
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
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    // Open/migrate local storage and add defaults without overwriting existing rows.
    db.seedInitialData().then(() => setReady(true)).catch((err: unknown) => setError(String(err)))
  }, [])

  if (!ready) return <div className="p-8 text-slate-200">{error ? `Không thể mở dữ liệu cục bộ: ${error}` : 'Đang mở dữ liệu cục bộ…'}</div>
  return (
    <BrowserRouter>
      <DatabaseSync />
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
