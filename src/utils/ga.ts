import ReactGA from 'react-ga4'

/**
 * GA 이벤트 이름을 enum으로 관리 (오타 방지)
 */
export enum GAEvent {
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  VIEW_DINING_DETAIL = 'view_dining_detail',
  VIEW_PLACE_POI_MODULE = 'view_place_poi_module',
  CLICK_PLACE_POI = 'click_place_poi',
  VIEW_PLACE_POI_DETAIL = 'view_place_poi_detail',
  PLACE_POI_CONVERSION = 'place_poi_conversion',
  EXTERNAL_APP_EXIT = 'external_app_exit',
}

type GAParams = Record<string, string | number>

export const trackEvent = (eventName: GAEvent, params?: GAParams) => {
  ReactGA.event(eventName, params)
}

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path })
}

export const setUserProperties = (properties: GAParams) => {
  ReactGA.set({ user_properties: properties })
}

export const buildDefaultUserProperties = (): GAParams => {
  if (typeof window === 'undefined') {
    return {}
  }

  const isMobile = window.matchMedia('(max-width: 768px)').matches
  return {
    device_type: isMobile ? 'mobile' : 'desktop',
    language: navigator.language || 'unknown',
  }
}
