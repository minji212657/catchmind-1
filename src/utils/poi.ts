import type { LifestylePoi, PoiCategory } from '@/types/poi'

const CATEGORY_LABELS: Record<PoiCategory, string> = {
  exhibition: '전시',
  performance: '공연',
  gallery: '갤러리',
  popup: '팝업',
  class: '클래스',
  wineBar: '와인바',
  walk: '산책',
  cafe: '카페',
  restaurant: '미식',
  culture: '문화·예술',
}

export function mapCategoryLabel(category: PoiCategory) {
  return CATEGORY_LABELS[category] ?? category
}

export function getMockRating(poi: LifestylePoi) {
  const base = (poi.id.charCodeAt(0) % 10) / 10
  const rating = 4 + base
  const reviews = 10 + ((poi.id.charCodeAt(1) ?? 5) % 50)
  return {
    rating: rating.toFixed(1),
    reviews,
  }
}
