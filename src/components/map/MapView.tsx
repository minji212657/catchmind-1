import { useEffect, useMemo, useRef, useState } from 'react'

import { MapClient } from '@/services/map/mapClient'
import type { LifestylePoi } from '@/types/poi'

import './MapView.css'

type MapStatus = 'idle' | 'loading' | 'ready' | 'error'

interface MapViewProps {
  pois: LifestylePoi[]
  containerId?: string
  className?: string
  onPoiSelect?: (poi: LifestylePoi) => void
  activePoiId?: string
}

export function MapView({
  pois,
  containerId = 'lifestyle-map',
  className,
  onPoiSelect,
  activePoiId,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapClientRef = useRef<MapClient | null>(null)
  const poisRef = useRef<LifestylePoi[]>(pois)
  const onPoiSelectRef = useRef<typeof onPoiSelect>(onPoiSelect)
  const activePoiIdRef = useRef<string | undefined>(activePoiId)
  const [status, setStatus] = useState<MapStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const defaultViewport = useMemo(() => {
    const fallback = { lat: 37.5665, lng: 126.978, zoom: 5 }
    if (!pois.length) {
      return fallback
    }
    const anchor = pois[0]
    return { lat: anchor.lat, lng: anchor.lng, zoom: 5 }
  }, [pois])

  useEffect(() => {
    let isMounted = true
    const element = containerRef.current
    if (!element) {
      return
    }

    const client = new MapClient({
      containerId,
      provider: 'kakao',
      defaultViewport,
    })

    mapClientRef.current = client
    setStatus('loading')

    client
      .initialize()
      .then(() => {
        if (!isMounted) {
          return
        }
        setStatus('ready')
        client.renderPois(poisRef.current, {
          onPoiSelect: poi => onPoiSelectRef.current?.(poi),
          activePoiId: activePoiIdRef.current,
        })
      })
      .catch(error => {
        if (!isMounted) {
          return
        }
        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : '지도를 불러오는 중 오류가 발생했습니다.',
        )
      })

    return () => {
      isMounted = false
      client.destroy()
      mapClientRef.current = null
    }
  }, [containerId, defaultViewport])

  useEffect(() => {
    poisRef.current = pois
  }, [pois])

  useEffect(() => {
    onPoiSelectRef.current = onPoiSelect
  }, [onPoiSelect])

  useEffect(() => {
    activePoiIdRef.current = activePoiId
  }, [activePoiId])

  useEffect(() => {
    if (status === 'ready') {
      const client = mapClientRef.current
      if (!client) {
        return
      }
      client.renderPois(pois, {
        onPoiSelect: poi => onPoiSelectRef.current?.(poi),
        activePoiId,
      })
    }
  }, [pois, status, activePoiId])

  const shouldShowOverlay = status === 'idle' || status === 'loading' || status === 'error'
  const overlayMessage =
    status === 'error'
      ? errorMessage
      : status === 'loading'
        ? '카카오 지도를 불러오는 중입니다...'
        : '지도 초기화를 준비 중입니다.'

  const sectionClassName = ['map-view', className].filter(Boolean).join(' ')

  return (
    <section className={sectionClassName}>
      <div id={containerId} ref={containerRef} className="map-view__canvas" aria-label="지도" />
      {shouldShowOverlay && (
        <div className={`map-view__overlay map-view__overlay--${status}`} role="status">
          <span>{overlayMessage}</span>
        </div>
      )}
    </section>
  )
}
