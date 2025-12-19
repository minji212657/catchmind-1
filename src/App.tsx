import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import {
  HomePage,
  MyDiningPage,
  PoiDetailPage,
  RestaurantReservationConfirmPage,
  RestaurantReservationSuccessPage,
} from '@/pages'
import {
  GAEvent,
  buildDefaultUserProperties,
  setUserProperties,
  trackEvent,
  trackPageView,
} from '@/utils/ga'

import './App.css'

export function App() {
  const location = useLocation()
  const hasTrackedSessionStart = useRef(false)

  useEffect(() => {
    if (hasTrackedSessionStart.current) {
      return
    }
    hasTrackedSessionStart.current = true
    setUserProperties(buildDefaultUserProperties())
    trackEvent(GAEvent.SESSION_START)
  }, [])

  useEffect(() => {
    const path = `${location.pathname}${location.search}`
    trackPageView(path)
  }, [location.pathname, location.search])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackEvent(GAEvent.SESSION_END)
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/poi/:poiId" element={<PoiDetailPage />} />
        <Route
          path="/poi/:poiId/reservation/confirm"
          element={<RestaurantReservationConfirmPage />}
        />
        <Route
          path="/poi/:poiId/reservation/success"
          element={<RestaurantReservationSuccessPage />}
        />
        <Route path="/my-dining" element={<MyDiningPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
