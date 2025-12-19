import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'
import './index.css'

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
if (GA_ID) {
  ReactGA.initialize(GA_ID)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
