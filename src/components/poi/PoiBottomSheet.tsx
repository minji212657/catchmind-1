import { ArrowLeft, Calendar, ChevronDown } from 'lucide-react'

import type { CategoryChip } from '@/components/map/MapOverlay'
import { CultureCard } from '@/components/poi/cards/CultureCard'
import { RestaurantCard } from '@/components/poi/cards/RestaurantCard'
import type { ReservationDate } from '@/components/poi/cards/RestaurantCard'
import type { LifestylePoi, PoiCategory } from '@/types/poi'
import { calculateDistanceInKm, formatDistanceMeters } from '@/utils/geo'
import { getMockRating, mapCategoryLabel } from '@/utils/poi'

import './PoiBottomSheet.css'

type CategoryFilter = 'all' | PoiCategory

interface PoiBottomSheetProps {
  poi?: LifestylePoi
  pois: LifestylePoi[]
  referencePoint?: { lat: number; lng: number }
  radiusLabel: string
  onRadiusChange: () => void
  sheetState: 'folded' | 'unfolded'
  onToggleSheetState: () => void
  categoryFilter: CategoryFilter
  onCategoryChange: (value: CategoryFilter) => void
  categories: CategoryChip<CategoryFilter>[]
  onPoiSelect: (poi: LifestylePoi) => void
}

export function PoiBottomSheet({
  poi,
  pois,
  referencePoint,
  radiusLabel,
  onRadiusChange,
  sheetState,
  onToggleSheetState,
  categoryFilter,
  onCategoryChange,
  categories,
  onPoiSelect,
}: PoiBottomSheetProps) {
  const isUnfolded = sheetState === 'unfolded'
  const visiblePois = isUnfolded ? pois : poi ? [poi] : []

  const buildDates = (item: LifestylePoi): ReservationDate[] => {
    const { sessions } = item
    if (sessions && sessions.length > 0) {
      return sessions.slice(0, 4).map(session => ({
        label: session.time,
        status: session.status === 'available' ? 'open' : 'closed',
      }))
    }

    const today = new Date()
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    return Array.from({ length: 5 }, (_, idx) => {
      const date = new Date(today)
      date.setDate(today.getDate() + idx)
      const dayLabel = dayNames[date.getDay()]
      const baseLabel =
        idx === 0
          ? `오늘(${dayLabel})`
          : idx === 1
            ? `내일(${dayLabel})`
            : `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}(${dayLabel})`
      return {
        label: baseLabel,
        status: idx <= 1 ? 'closed' : 'open',
      }
    })
  }

  const getDistanceLabel = (item: LifestylePoi) => {
    if (!referencePoint) return undefined
    const meters = calculateDistanceInKm(referencePoint.lat, referencePoint.lng, item.lat, item.lng) * 1000
    return `내 위치에서 ${formatDistanceMeters(meters)}`
  }

  return (
    <section className={`poi-bottom-sheet poi-bottom-sheet--${isUnfolded ? 'unfolded' : 'folded'}`}>
      <button
        type="button"
        className="poi-bottom-sheet__handle"
        onClick={onToggleSheetState}
        aria-label="바텀 시트 확장/축소"
        aria-expanded={isUnfolded}
      >
        <span />
      </button>

      <div className="poi-bottom-sheet__controls">
        {isUnfolded && (
          <>
            <div className="poi-bottom-sheet__search-card">
              <button type="button" className="poi-bottom-sheet__search-field">
                <ArrowLeft size={18} />
                <span className="poi-bottom-sheet__search-placeholder">찾고 싶은게 있나요?</span>
                <span className="poi-bottom-sheet__search-divider" aria-hidden />
              </button>
              <button type="button" className="poi-bottom-sheet__date-button">
                <Calendar size={18} />
                <span>날짜 · 인원</span>
              </button>
            </div>
            <div className="poi-bottom-sheet__category-tabs" role="tablist">
              {categories.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === tab.value}
                  className={`poi-bottom-sheet__category-tab ${
                    categoryFilter === tab.value ? 'poi-bottom-sheet__category-tab--active' : ''
                  }`}
                  onClick={() => onCategoryChange(tab.value)}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && <small>{tab.count.toLocaleString()}</small>}
                </button>
              ))}
            </div>
          </>
        )}
        <button type="button" className="poi-bottom-sheet__radius-button" onClick={onRadiusChange}>
          주변 {radiusLabel}
          <ChevronDown size={18} />
        </button>
      </div>

      <div className={`poi-bottom-sheet__content ${isUnfolded ? 'poi-bottom-sheet__content--expanded' : ''}`}>
        <div className="poi-bottom-sheet__list">
          {visiblePois.map((item, index) => {
            const { rating, reviews } = getMockRating(item)
            const distanceLabel = getDistanceLabel(item)
            const isRestaurant = item.category === 'restaurant'
            return (
              <div key={item.id} className="poi-bottom-sheet__list-item">
                {isRestaurant ? (
                  <RestaurantCard
                    name={item.name}
                    rating={rating}
                    reviewCount={reviews}
                    categoryLabel={item.type ?? mapCategoryLabel(item.category)}
                    location={item.address}
                    distanceLabel={distanceLabel}
                    images={item.images}
                    openHours={item.openHours}
                    priceLabel={buildPriceLabel(item)}
                    dates={buildDates(item)}
                    onSelect={() => onPoiSelect(item)}
                  />
                ) : (
                  <CultureCard
                    poi={item}
                    distanceLabel={distanceLabel}
                    onSelect={() => onPoiSelect(item)}
                    onReserve={() => onPoiSelect(item)}
                  />
                )}
                {index < visiblePois.length - 1 && <div className="poi-bottom-sheet__divider" aria-hidden="true" />}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function buildPriceLabel(poi: LifestylePoi) {
  const [first, second] = poi.sessions ?? []
  const formatWon = (value?: number) => {
    if (!value || Number.isNaN(value)) {
      return undefined
    }
    return value % 10000 === 0 ? `${value / 10000}만원` : `${value.toLocaleString()}원`
  }

  const fallbackSeed = poi.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const lunchFallback = 30000 + ((fallbackSeed % 4) + 1) * 5000
  const dinnerFallback = lunchFallback + 60000 + (fallbackSeed % 3) * 5000

  const lunch = formatWon(first?.price ?? lunchFallback)
  const dinner = formatWon(second?.price ?? dinnerFallback)

  if (!lunch && !dinner) {
    return undefined
  }

  if (lunch && dinner) {
    return `점심 ${lunch} · 저녁 ${dinner}`
  }

  return lunch ? `1인 ${lunch}` : `1인 ${dinner}`
}
