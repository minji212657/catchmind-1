import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { MapOverlay } from '@/components/map/MapOverlay'
import { MapView } from '@/components/map/MapView'
import { PoiBottomSheet } from '@/components/poi/PoiBottomSheet'
import { poiService } from '@/services/poi/poiService'
import type { LifestylePoi, PoiCategory } from '@/types/poi'
import { calculateDistanceInKm, formatDistanceMeters } from '@/utils/geo'

import './HomePage.css'

type CategoryFilter = 'all' | PoiCategory
type RadiusFilter = 100 | 500 | 3000
type TimeFilter = 'all' | 'morning' | 'afternoon' | 'evening'

const radiusOptions: RadiusFilter[] = [100, 500, 3000]

export function HomePage() {
  const allPois = useMemo<LifestylePoi[]>(() => poiService.listLifestylePois(), [])
  const [selectedPoiId, setSelectedPoiId] = useState<string | undefined>(allPois[0]?.id)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>(3000)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [isSheetExpanded, setIsSheetExpanded] = useState(false)
  const navigate = useNavigate()

  const anchorPoi = allPois[0]
  const referencePoint = anchorPoi ? { lat: anchorPoi.lat, lng: anchorPoi.lng } : undefined

  const filteredPois = useMemo(
    () =>
      applyFilters(allPois, {
        category: categoryFilter,
        radius: radiusFilter,
        time: timeFilter,
        anchor: anchorPoi,
      }),
    [allPois, anchorPoi, categoryFilter, radiusFilter, timeFilter],
  )

  const categories = useMemo(() => {
    const counts = allPois.reduce<Record<string, number>>(
      (acc, poi) => {
        const key = poi.category
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      },
      { all: allPois.length },
    )

    return [
      { label: '전체', value: 'all' as CategoryFilter, count: counts.all ?? allPois.length },
      { label: '미식', value: 'restaurant' as CategoryFilter, count: counts.restaurant ?? 0 },
      { label: '문화·예술', value: 'culture' as CategoryFilter, count: counts.culture ?? 0 },
    ]
  }, [allPois])

  const featuredPoi = useMemo(() => {
    if (!filteredPois.length) {
      return undefined
    }
    if (selectedPoiId && filteredPois.some(poi => poi.id === selectedPoiId)) {
      return filteredPois.find(poi => poi.id === selectedPoiId)
    }
    return filteredPois[0]
  }, [filteredPois, selectedPoiId])

  useEffect(() => {
    if (!filteredPois.length) {
      setSelectedPoiId(undefined)
      return
    }
    if (!selectedPoiId || !filteredPois.some(poi => poi.id === selectedPoiId)) {
      setSelectedPoiId(filteredPois[0].id)
    }
  }, [filteredPois, selectedPoiId])

  useEffect(() => {
    if (isSheetExpanded) {
      document.body.classList.add('body--no-scroll')
    } else {
      document.body.classList.remove('body--no-scroll')
    }
    return () => {
      document.body.classList.remove('body--no-scroll')
    }
  }, [isSheetExpanded])

  const handlePoiSelect = (poi: LifestylePoi) => {
    setSelectedPoiId(poi.id)
    navigate(`/poi/${poi.id}`)
    setIsSheetExpanded(true)
  }

  const handleRadiusCycle = () => {
    const currentIndex = radiusOptions.indexOf(radiusFilter)
    const nextRadius = radiusOptions[(currentIndex + 1) % radiusOptions.length]
    setRadiusFilter(nextRadius)
  }

  const handleNearbyClick = () => {
    setRadiusFilter(radiusOptions[0])
  }

  const handleTimeFilterToggle = () => {
    const order: TimeFilter[] = ['all', 'morning', 'afternoon', 'evening']
    const currentIndex = order.indexOf(timeFilter)
    const nextFilter = order[(currentIndex + 1) % order.length]
    setTimeFilter(nextFilter)
  }

  return (
    <main className="home-page">
      <section className="map-hero">
        <MapView
          className="map-view--hero"
          pois={filteredPois}
          containerId="hero-map"
          onPoiSelect={handlePoiSelect}
          activePoiId={selectedPoiId}
        />
        <MapOverlay
          categories={categories}
          selectedCategory={categoryFilter}
          onCategoryChange={value => setCategoryFilter(value)}
        />
        <PoiBottomSheet
          poi={featuredPoi}
          pois={filteredPois}
          referencePoint={referencePoint}
          radiusLabel={formatRadius(radiusFilter)}
          onRadiusChange={handleRadiusCycle}
          onFilterChange={handleTimeFilterToggle}
          onNearbyClick={handleNearbyClick}
          filterLabel={getTimeFilterLabel(timeFilter)}
          distanceLabel={
            featuredPoi && referencePoint
              ? `내 위치에서 ${formatDistanceMeters(
                  calculateDistanceInKm(referencePoint.lat, referencePoint.lng, featuredPoi.lat, featuredPoi.lng) *
                    1000,
                )}`
              : undefined
          }
          expanded={isSheetExpanded}
          onToggleExpand={() => setIsSheetExpanded(prev => !prev)}
          onPoiClick={handlePoiSelect}
        />
      </section>

    </main>
  )
}

interface FilterOptions {
  category: CategoryFilter
  radius: number
  time: TimeFilter
  anchor?: LifestylePoi
}

function formatRadius(value: number) {
  return value >= 1000 ? `${value / 1000}km` : `${value}m`
}

function getTimeFilterLabel(filter: TimeFilter) {
  switch (filter) {
    case 'morning':
      return '오전 추천'
    case 'afternoon':
      return '오후 추천'
    case 'evening':
      return '야간 추천'
    default:
      return '필터'
  }
}

function applyFilters(pois: LifestylePoi[], filters: FilterOptions) {
  const { category, radius, time, anchor } = filters

  return pois.filter(poi => {
    if (category !== 'all' && poi.category !== category) {
      return false
    }

    if (anchor && radius) {
      const distanceMeters = calculateDistanceInKm(anchor.lat, anchor.lng, poi.lat, poi.lng) * 1000
      if (distanceMeters > radius) {
        return false
      }
    }

    if (time !== 'all' && !matchesTimeFilter(poi.openHours, time)) {
      return false
    }

    return true
  })
}

function matchesTimeFilter(openHours: string, filter: TimeFilter) {
  const [startStr, endStr] = openHours.split('-')
  if (!startStr || !endStr) {
    return true
  }
  const toHour = (value: string) => {
    const [hourStr, minuteStr] = value.split(':')
    const hour = Number(hourStr)
    const minute = Number(minuteStr ?? 0)
    return hour + minute / 60
  }

  const start = toHour(startStr)
  const end = toHour(endStr)
  const ranges: Record<Exclude<TimeFilter, 'all'>, [number, number]> = {
    morning: [6, 12],
    afternoon: [12, 18],
    evening: [18, 24],
  }

  if (filter === 'all') {
    return true
  }

  const [rangeStart, rangeEnd] = ranges[filter]
  return start < rangeEnd && end > rangeStart
}
