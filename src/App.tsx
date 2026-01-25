import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Players } from './pages/Players'
import { Games } from './pages/Games'
import { Ranking } from './pages/Ranking'
import { Settings } from './pages/Settings'

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/games" element={<Games />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}
