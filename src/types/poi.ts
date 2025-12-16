export type EntryMethod = 'QR' | 'reservationCode'

export type SessionStatus = 'available' | 'soldOut' | 'closed'

export type PoiCategory =
  | 'exhibition'
  | 'performance'
  | 'gallery'
  | 'popup'
  | 'class'
  | 'wineBar'
  | 'walk'
  | 'cafe'
  | 'restaurant'
  | 'culture'

export type ReservationType = 'FREE_RESERVATION' | 'TICKETING' | 'NONE'

export interface PoiSession {
  time: string
  capacity: number
  status: SessionStatus
  price: number
}

export interface LifestylePoi {
  id: string
  name: string
  category: PoiCategory
  description: string
  address: string
  lat: number
  lng: number
  openHours: string
  closedDays: string[]
  isFree: boolean
  isPaid: boolean
  reservable: boolean
  reservationType: ReservationType
  endDate?: string
  durationMinutes?: number
  tags?: string[]
  sessions?: PoiSession[]
  entryMethod?: EntryMethod
  images?: string[]
  dataSource?: 'public' | 'partner' | 'manual'
  sourceUrl?: string
}
