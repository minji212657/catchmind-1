import { Navigate, Route, Routes } from 'react-router-dom'

import { HomePage, PoiDetailPage } from '@/pages'

import './App.css'

export function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/poi/:poiId" element={<PoiDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
