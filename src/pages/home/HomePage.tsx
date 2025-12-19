import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { MapOverlay } from '@/components/map/MapOverlay'
import { MapView } from '@/components/map/MapView'
import { PoiBottomSheet } from '@/components/poi/PoiBottomSheet'
import { poiService } from '@/services/poi/poiService'
import type { LifestylePoi, PoiCategory } from '@/types/poi'
import { GAEvent, trackEvent } from '@/utils/ga'
import { calculateDistanceInKm } from '@/utils/geo'

import './HomePage.css'

type CategoryFilter = 'all' | PoiCategory
type RadiusFilter = 100 | 500 | 3000

const radiusOptions: RadiusFilter[] = [100, 500, 3000]

const locationFilterCategory = (state: unknown): CategoryFilter | null => {
  if (
    state &&
    typeof state === 'object' &&
    'filterCategory' in state &&
    state.filterCategory
  ) {
    return state.filterCategory as CategoryFilter
  }
  return null
}

export function HomePage() {
  const allPois = useMemo<LifestylePoi[]>(() => poiService.listLifestylePois(), [])
  const { state: locationState } = useLocation()
  const initialCategory = locationFilterCategory(locationState) ?? 'all'
  const [selectedPoiId, setSelectedPoiId] = useState<string | undefined>(allPois[0]?.id)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(initialCategory)
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>(3000)
  const [sheetState, setSheetState] = useState<'folded' | 'unfolded'>('folded')
  const navigate = useNavigate()

  const anchorPoi = allPois[0]
  const referencePoint = anchorPoi
    ? { lat: anchorPoi.lat, lng: anchorPoi.lng }
    : undefined

  const filteredPois = useMemo(
    () =>
      applyFilters(allPois, {
        category: categoryFilter,
        radius: radiusFilter,
        anchor: anchorPoi,
      }),
    [allPois, anchorPoi, categoryFilter, radiusFilter],
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
      {
        label: '전체',
        value: 'all' as CategoryFilter,
        count: counts.all ?? allPois.length,
      },
      {
        label: '미식',
        value: 'restaurant' as CategoryFilter,
        count: counts.restaurant ?? 0,
      },
      {
        label: '문화·예술',
        value: 'culture' as CategoryFilter,
        count: counts.culture ?? 0,
      },
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
    if (sheetState === 'unfolded') {
      document.body.classList.add('body--no-scroll')
    } else {
      document.body.classList.remove('body--no-scroll')
    }
    return () => {
      document.body.classList.remove('body--no-scroll')
    }
  }, [sheetState])

  useEffect(() => {
    const routeCategory = locationFilterCategory(locationState)
    if (routeCategory) {
      setCategoryFilter(routeCategory)
    }
  }, [locationState])

  const handlePoiSelect = (poi: LifestylePoi) => {
    setSelectedPoiId(poi.id)
    trackEvent(GAEvent.CLICK_PLACE_POI, {
      poi_id: poi.id,
      poi_name: poi.name,
      poi_category: poi.category,
      source: 'home_map',
    })
    navigate(`/poi/${poi.id}`)
    setSheetState('unfolded')
  }

  const handleRadiusCycle = () => {
    const currentIndex = radiusOptions.indexOf(radiusFilter)
    const nextRadius = radiusOptions[(currentIndex + 1) % radiusOptions.length]
    setRadiusFilter(nextRadius)
  }

  const handleToggleSheetState = () => {
    setSheetState(prev => (prev === 'folded' ? 'unfolded' : 'folded'))
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
          visible={sheetState === 'folded'}
        />
        <PoiBottomSheet
          poi={featuredPoi}
          pois={filteredPois}
          referencePoint={referencePoint}
          radiusLabel={formatRadius(radiusFilter)}
          onRadiusChange={handleRadiusCycle}
          sheetState={sheetState}
          onToggleSheetState={handleToggleSheetState}
          categoryFilter={categoryFilter}
          onCategoryChange={value => setCategoryFilter(value)}
          categories={categories}
          onPoiSelect={handlePoiSelect}
          autoUnfold={Boolean(locationFilterCategory(locationState))}
        />
      </section>
    </main>
  )
}

interface FilterOptions {
  category: CategoryFilter
  radius: number
  anchor?: LifestylePoi
}

function formatRadius(value: number) {
  return value >= 1000 ? `${value / 1000}km` : `${value}m`
}

function applyFilters(pois: LifestylePoi[], filters: FilterOptions) {
  const { category, radius, anchor } = filters

  return pois.filter(poi => {
    if (category !== 'all' && poi.category !== category) {
      return false
    }

    if (anchor && radius) {
      const distanceMeters =
        calculateDistanceInKm(anchor.lat, anchor.lng, poi.lat, poi.lng) * 1000
      if (distanceMeters > radius) {
        return false
      }
    }

    return true
  })
}
