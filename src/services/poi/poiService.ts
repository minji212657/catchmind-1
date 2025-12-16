import type { LifestylePoi, PoiCategory, ReservationType } from '@/types/poi'
import { parseCsv } from '@/utils/csv'

import rawCsv from '@/data/map-visualization-data.csv?raw'

type CsvRecord = {
  category: 'restaurant' | 'culture'
  name: string
  address: string
  lat: number
  lng: number
  url?: string
}

const DEFAULT_HOURS: Record<CsvRecord['category'], string> = {
  restaurant: '11:00-22:00',
  culture: '10:00-20:00',
}

const DEFAULT_RESERVATION: Record<CsvRecord['category'], ReservationType> = {
  restaurant: 'FREE_RESERVATION',
  culture: 'NONE',
}

function toCsvRecords(content: string): CsvRecord[] {
  const rows = parseCsv(content)
  const [header, ...dataRows] = rows
  if (!header) {
    return []
  }
  const columnIndex = (column: string) => header.findIndex(cell => cell.toLowerCase() === column)

  const idxCategory = columnIndex('category')
  const idxName = columnIndex('name')
  const idxAddress = columnIndex('address')
  const idxLat = columnIndex('lat')
  const idxLng = columnIndex('lng')
  const idxUrl = columnIndex('url')

  return dataRows
    .map(row => {
      const category = row[idxCategory] as CsvRecord['category']
      const name = row[idxName]
      const address = row[idxAddress]
      const lat = Number(row[idxLat])
      const lng = Number(row[idxLng])
      const url = idxUrl >= 0 ? row[idxUrl] : undefined

      if (!category || !name || !address || Number.isNaN(lat) || Number.isNaN(lng)) {
        return null
      }

      return {
        category,
        name,
        address,
        lat,
        lng,
        url,
      } as CsvRecord
    })
    .filter((record): record is CsvRecord => Boolean(record))
}

const csvRecords = toCsvRecords(rawCsv)

function synthesizePoi(record: CsvRecord, index: number): LifestylePoi {
  const { category, name, address, lat, lng, url } = record
  const id = `${category}-${index.toString().padStart(3, '0')}`
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
  }
}

const lifestylePois: LifestylePoi[] = csvRecords.map(synthesizePoi)

export const poiService = {
  listLifestylePois: (): LifestylePoi[] => lifestylePois,
  listActiveLifestylePois: (): LifestylePoi[] => lifestylePois,
  findPoiById: (id: string): LifestylePoi | undefined => lifestylePois.find(poi => poi.id === id),
}
