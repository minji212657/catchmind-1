import type { KeyboardEvent } from 'react'

import { Bookmark, ChevronDown, SlidersHorizontal, Star } from 'lucide-react'

import type { LifestylePoi, PoiCategory } from '@/types/poi'
import { calculateDistanceInKm, formatDistanceMeters } from '@/utils/geo'
import { getMockRating, mapCategoryLabel } from '@/utils/poi'

import './PoiBottomSheet.css'

interface PoiBottomSheetProps {
  poi?: LifestylePoi
  pois: LifestylePoi[]
  referencePoint?: { lat: number; lng: number }
  radiusLabel: string
  onRadiusChange: () => void
  onFilterChange: () => void
  onNearbyClick: () => void
  filterLabel: string
  distanceLabel?: string
  expanded: boolean
  onToggleExpand: () => void
  onPoiClick: (poi: LifestylePoi) => void
}

export function PoiBottomSheet({
  poi,
  pois,
  referencePoint,
  radiusLabel,
  onRadiusChange,
  onFilterChange,
  onNearbyClick,
  filterLabel,
  distanceLabel,
  expanded,
  onToggleExpand,
  onPoiClick,
}: PoiBottomSheetProps) {
  return (
    <section className={`poi-bottom-sheet ${expanded ? 'poi-bottom-sheet--expanded' : ''}`}>
      <button type="button" className="poi-bottom-sheet__handle" onClick={onToggleExpand} aria-label="바텀 시트 확장/축소">
        <span />
      </button>

      <div className="poi-bottom-sheet__controls">
        <button type="button" className="poi-bottom-sheet__radius-button" onClick={onRadiusChange}>
          주변 {radiusLabel}
          <ChevronDown size={18} />
        </button>

        <div className="poi-bottom-sheet__filter-row">
          <button type="button" className="poi-bottom-sheet__filter-button">
            추천순
            <ChevronDown size={14} />
          </button>
          <button type="button" className="poi-bottom-sheet__filter-button" onClick={onFilterChange}>
            <SlidersHorizontal size={16} />
            {filterLabel}
          </button>
          <button
            type="button"
            className="poi-bottom-sheet__filter-button poi-bottom-sheet__filter-button--accent"
            onClick={onNearbyClick}
          >
            내 주변
          </button>
        </div>
      </div>

      <div className={`poi-bottom-sheet__content ${expanded ? 'poi-bottom-sheet__content--expanded' : ''}`}>
        {expanded ? (
          <div className="poi-bottom-sheet__list">
            {pois.map(item =>
              renderPoiCard({
                poi: item,
                referencePoint,
                onPoiClick,
              }),
            )}
          </div>
        ) : (
          poi &&
          renderPoiCard({
            poi,
            referencePoint,
            distanceLabel,
            onPoiClick,
          })
        )}
      </div>
    </section>
  )
}

function renderPoiCard({
  poi,
  referencePoint,
  distanceLabel,
  onPoiClick,
}: {
  poi: LifestylePoi
  referencePoint?: { lat: number; lng: number }
  distanceLabel?: string
  onPoiClick: (poi: LifestylePoi) => void
}) {
  const { rating, reviews } = getMockRating(poi)
  const computedDistance =
    referencePoint != null
      ? formatDistanceMeters(
          calculateDistanceInKm(referencePoint.lat, referencePoint.lng, poi.lat, poi.lng) * 1000,
        )
      : undefined
  const displayDistance = distanceLabel ?? computedDistance
  const locationText = formatPoiLocation(poi.address)
  const descriptor = formatPoiDescriptor(poi)
  const gallerySources: (string | undefined)[] = Array.from({ length: 5 }, (_, index) => poi.images?.[index])

  const handleCardClick = () => onPoiClick(poi)
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPoiClick(poi)
    }
  }

  return (
    <article
      key={poi.id}
      className="poi-bottom-sheet__poi-card"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div className="poi-bottom-sheet__poi-header">
        <div>
          <p className="poi-bottom-sheet__poi-category">{mapCategoryLabel(poi.category)}</p>
          <h3>{poi.name}</h3>
        </div>
        <button
          type="button"
          aria-label="저장"
          onClick={event => {
            event.stopPropagation()
          }}
        >
          <Bookmark size={20} />
        </button>
      </div>

      <p className="poi-bottom-sheet__poi-rating">
        <span className="poi-bottom-sheet__star">
          <Star size={12} />
        </span>
        <strong>{rating}</strong>
        <span>({reviews})</span>
        {locationText && <span>· {locationText}</span>}
        {descriptor && <span>· {descriptor}</span>}
        {displayDistance && <span>· {displayDistance}</span>}
      </p>

      <div className="poi-bottom-sheet__carousel" role="group" aria-label={`${poi.name} 이미지`}>
        <div className="poi-bottom-sheet__carousel-track">
          {gallerySources.map((src, index) => (
            <div key={`${poi.id}-image-${index}`} className="poi-bottom-sheet__carousel-item">
              {src ? (
                <img src={src} alt={`${poi.name} 이미지 ${index + 1}`} loading="lazy" />
              ) : (
                <div className="poi-bottom-sheet__carousel-placeholder" />
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

const CULTURE_CATEGORIES: PoiCategory[] = ['exhibition', 'performance', 'gallery', 'popup', 'class', 'walk', 'culture']

function formatPoiLocation(address: string) {
  if (!address) {
    return ''
  }
  const parts = address.split(' ')
  return parts.slice(0, 3).join(' ')
}

function formatPoiDescriptor(poi: LifestylePoi) {
  if (CULTURE_CATEGORIES.includes(poi.category)) {
    return '전체 관람가'
  }
  return '파인다이닝 · 코스'
}
