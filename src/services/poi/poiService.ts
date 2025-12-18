import type { LifestylePoi, PoiCategory, ReservationType } from '@/types/poi'

import mapVisualizationData from '../../../Map Visualization Data.json'

type JsonRecord = {
  id?: string
  category: 'restaurant' | 'culture'
  name: string
  address: string
  lat: string | number
  lng: string | number
  url?: string
  type?: string
}

type NormalizedRecord = {
  id: string
  category: 'restaurant' | 'culture'
  name: string
  address: string
  lat: number
  lng: number
  url?: string
  type?: string
  audience?: string
}

const DEFAULT_HOURS: Record<JsonRecord['category'], string> = {
  restaurant: '11:00-22:00',
  culture: '10:00-20:00',
}

const DEFAULT_RESERVATION: Record<JsonRecord['category'], ReservationType> = {
  restaurant: 'FREE_RESERVATION',
  culture: 'NONE',
}

function toJsonRecords(entries: JsonRecord[]): NormalizedRecord[] {
  const categoryCounts: Record<string, number> = {}
  return entries
    .map(entry => {
      const lat = Number(entry.lat)
      const lng = Number(entry.lng)
      if (!entry.category || !entry.name || !entry.address || Number.isNaN(lat) || Number.isNaN(lng)) {
        return null
      }
      const count = categoryCounts[entry.category] ?? 0
      categoryCounts[entry.category] = count + 1
      const id =
        entry.id ??
        `${entry.category}-${String(count).padStart(3, '0')}`
      return {
        ...entry,
        id,
        lat,
        lng,
      } as NormalizedRecord
    })
    .filter((entry): entry is NormalizedRecord => Boolean(entry))
}

const jsonRecords = toJsonRecords(mapVisualizationData as JsonRecord[])

function synthesizePoi(record: NormalizedRecord): LifestylePoi {
  const { id, category, name, address, lat, lng, url } = record
  const description =
    category === 'restaurant'
      ? `${name} · 앵커 다이닝 기반 추천 미식 공간`
      : `${name} · 앵커 다이닝과 연결된 문화·예술 경험`

  const baseTags =
    category === 'restaurant'
      ? ['미식', '코스 추천', '다이닝 페어링']
      : ['문화', '전시', '체험']

  return {
    id,
    name,
    category: category as PoiCategory,
    description,
    address,
    lat,
    lng,
    openHours: DEFAULT_HOURS[category],
    closedDays: [],
    isFree: category === 'culture',
    isPaid: category === 'restaurant',
    reservable: category === 'restaurant',
    reservationType: DEFAULT_RESERVATION[category],
    tags: baseTags,
    images: [],
    dataSource: 'manual',
    sourceUrl: url,
    type: record.type,
    audience: record.audience,
  }
}

const lifestylePois: LifestylePoi[] = jsonRecords.map(synthesizePoi)

export const poiService = {
  listLifestylePois: (): LifestylePoi[] => lifestylePois,
  listActiveLifestylePois: (): LifestylePoi[] => lifestylePois,
  findPoiById: (id: string): LifestylePoi | undefined => lifestylePois.find(poi => poi.id === id),
}
