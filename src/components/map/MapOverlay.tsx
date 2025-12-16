import { ArrowLeft, BatteryFull, Calendar, Wifi, Signal } from 'lucide-react'

import './MapOverlay.css'

export type CategoryChip<V extends string = string> = {
  label: string
  value: V
  count?: number
}

interface MapOverlayProps<V extends string = string> {
  categories: CategoryChip<V>[]
  selectedCategory: V
  onCategoryChange: (value: V) => void
}

export function MapOverlay<V extends string>({
  categories,
  selectedCategory,
  onCategoryChange,
}: MapOverlayProps<V>) {
  return (
    <div className="map-overlay">
      <div className="map-overlay__status">
        <span className="map-overlay__time">9:41</span>
        <div className="map-overlay__status-icons" aria-hidden>
          <Signal size={16} />
          <Wifi size={16} />
          <BatteryFull size={18} />
        </div>
      </div>

      <div className="map-overlay__search-card">
        <ArrowLeft size={18} />
        <span className="map-overlay__search-placeholder">찾고 싶은게 있나요?</span>

        <span className="map-overlay__divider" aria-hidden />

        <button type="button" className="map-overlay__date">
          <Calendar size={18} />
          <span>날짜 · 인원</span>
        </button>
      </div>

      <div className="map-overlay__chips">
        {categories.map(chip => (
          <button
            key={chip.value}
            type="button"
            className={`map-overlay__chip ${
              selectedCategory === chip.value ? 'map-overlay__chip--active' : ''
            }`}
            onClick={() => onCategoryChange(chip.value)}
          >
            <span>{chip.label}</span>
            {typeof chip.count === 'number' && (
              <span className="map-overlay__chip-count">{chip.count.toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
