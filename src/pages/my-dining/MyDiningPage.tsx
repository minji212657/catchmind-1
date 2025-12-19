import {
  Bookmark,
  CalendarCheck,
  CalendarPlus,
  Home,
  MapPin,
  Search,
  User,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import type { SuccessSummary } from '@/components/poi/reservation/ReservationSuccessScreen'
import type { SerializedRestaurantReservationSelection } from '@/components/poi/reservation/RestaurantReserveBottomSheet'
import { poiService } from '@/services/poi/poiService'
import type { LifestylePoi, PoiCategory } from '@/types/poi'
import { calculateDistanceInKm, formatDistanceMeters } from '@/utils/geo'

import './MyDiningPage.css'

type TabKey = 'reservations' | 'notifications'
type StatusKey = 'upcoming' | 'completed' | 'canceled'
type NearbySectionKey = 'culture' | 'restaurant'
type RadiusOption = 100 | 500 | 3000

type ReservationCardData = {
  id: string
  title: string
  area: string
  category: string
  poiCategory: 'restaurant' | 'culture'
  isOnline: boolean
  date: string
  dateLabel?: string
  time: string
  people: string
  status: StatusKey
  anchorLat?: number
  anchorLng?: number
}

type MyDiningLocationState = {
  reservation?: SerializedRestaurantReservationSelection
  poiId?: string
  poiName?: string
  cultureReservation?: {
    summary: SuccessSummary
    poiId?: string
    poiName?: string
  }
}

type NearbyCardData = {
  id: string
  name: string
  meta: string
  dateText: string
  distanceText: string
  type: string
}

const TAB_OPTIONS: { key: TabKey; label: string }[] = [
  { key: 'reservations', label: '나의 예약' },
  { key: 'notifications', label: '나의 알림' },
]

const STATUS_OPTIONS: { key: StatusKey; label: string }[] = [
  { key: 'upcoming', label: '방문 예정' },
  { key: 'completed', label: '방문 완료' },
  { key: 'canceled', label: '취소/노쇼' },
]

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function MyDiningPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('reservations')
  const [activeStatus, setActiveStatus] = useState<StatusKey>('upcoming')
  const [selectedRadius] = useState<RadiusOption>(500)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({})
  const [selectedTypeByCard, setSelectedTypeByCard] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = useMemo(
    () => (location.state as MyDiningLocationState | undefined) ?? {},
    [location.state],
  )
  const storedReservations = useMemo(
    () => hydrateReservationState(locationState),
    [locationState],
  )

  const allPois = useMemo(() => poiService.listLifestylePois(), [])
  const typeOptionsByCategory = useMemo(
    () => ({
      restaurant: buildTypeOptionsByCategory(allPois, 'restaurant'),
      culture: buildTypeOptionsByCategory(allPois, 'culture'),
    }),
    [allPois],
  )

  const reservationCards = useMemo(
    () => buildReservationCardsFromList(storedReservations, allPois),
    [storedReservations, allPois],
  )
  const filteredReservations = useMemo(
    () => reservationCards.filter(card => card.status === activeStatus),
    [reservationCards, activeStatus],
  )

  const toggleAccordion = (key: string) => {
    setOpenAccordions(current => ({
      ...current,
      [key]: !current[key],
    }))
  }

  return (
    <section className="my-dining-page">
      <header className="my-dining-header">
        <h1>마이 다이닝</h1>
        <button type="button" className="my-dining-header__icon" aria-label="검색">
          <Search size={20} />
        </button>
      </header>

      <div className="my-dining-tabs">
        {TAB_OPTIONS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`my-dining-tab ${activeTab === tab.key ? 'my-dining-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reservations' ? (
        <main className="my-dining-content">
          <div className="my-dining-chip-row">
            {STATUS_OPTIONS.map(option => (
              <button
                key={option.key}
                type="button"
                className={`my-dining-chip ${activeStatus === option.key ? 'my-dining-chip--active' : ''}`}
                onClick={() => setActiveStatus(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <section className="my-dining-section">
            {filteredReservations.length ? (
              filteredReservations.map(card => (
                <ReservationCardWithNearby
                  key={card.id}
                  card={card}
                  isOpen={Boolean(openAccordions[card.id])}
                  onToggle={() => toggleAccordion(card.id)}
                  allPois={allPois}
                  radius={selectedRadius}
                  sectionKey={
                    card.poiCategory === 'restaurant' ? 'culture' : 'restaurant'
                  }
                  typeOptions={
                    card.poiCategory === 'restaurant'
                      ? typeOptionsByCategory.culture
                      : typeOptionsByCategory.restaurant
                  }
                  selectedType={selectedTypeByCard[card.id] ?? '전체'}
                  onTypeChange={type =>
                    setSelectedTypeByCard(current => ({ ...current, [card.id]: type }))
                  }
                />
              ))
            ) : (
              <div className="my-dining-empty">선택한 상태의 예약이 없습니다.</div>
            )}
          </section>
        </main>
      ) : (
        <main className="my-dining-content my-dining-content--empty">
          <p className="my-dining-empty-title">아직 새로운 알림이 없습니다.</p>
          <p className="my-dining-empty-sub">
            예약 상태 변경, 추천 알림이 생기면 알려드릴게요.
          </p>
        </main>
      )}

      <nav className="my-dining-nav">
        <button
          type="button"
          className="my-dining-nav__item"
          onClick={() => navigate('/')}
        >
          <Home size={20} />
          <span>홈</span>
        </button>
        <button type="button" className="my-dining-nav__item">
          <Bookmark size={20} />
          <span>저장</span>
        </button>
        <button
          type="button"
          className="my-dining-nav__item"
          onClick={() => navigate('/')}
        >
          <MapPin size={20} />
          <span>내 주변</span>
        </button>
        <button type="button" className="my-dining-nav__item my-dining-nav__item--active">
          <CalendarCheck size={20} />
          <span>마이 다이닝</span>
        </button>
        <button type="button" className="my-dining-nav__item">
          <User size={20} />
          <span>MY</span>
        </button>
      </nav>
    </section>
  )
}

function ReservationCardContent({ card }: { card: ReservationCardData }) {
  const visitDate = new Date(card.date)
  const dateLabel = card.dateLabel ?? formatReservationDate(visitDate)
  const dDayLabel = formatDdayLabel(visitDate)
  const badgeLabel = getReservationBadgeLabel(card)

  return (
    <>
      <div className="my-dining-card__badges">
        <span className="my-dining-card__badge">{dDayLabel}</span>
        <span className="my-dining-card__badge my-dining-card__badge--light">
          {badgeLabel}
        </span>
      </div>
      <div className="my-dining-card__body">
        <div className="my-dining-card__thumb" />
        <div className="my-dining-card__info">
          <p className="my-dining-card__title">{card.title}</p>
          <p className="my-dining-card__meta">
            {card.area} | {card.category}
          </p>
          <p className="my-dining-card__highlight">
            {dateLabel}
            {card.time ? ` · ${card.time}` : ''} · {card.people}
          </p>
        </div>
        <button type="button" className="my-dining-card__icon" aria-label="캘린더 추가">
          <CalendarPlus size={18} />
        </button>
      </div>
      {card.poiCategory === 'restaurant' && (
        <button type="button" className="my-dining-card__action">
          초대장 보내기
        </button>
      )}
    </>
  )
}

function ReservationCardWithNearby({
  card,
  isOpen,
  onToggle,
  sectionKey,
  allPois,
  radius,
  typeOptions,
  selectedType,
  onTypeChange,
}: {
  card: ReservationCardData
  isOpen: boolean
  onToggle: () => void
  sectionKey: NearbySectionKey
  allPois: LifestylePoi[]
  radius: RadiusOption
  typeOptions: string[]
  selectedType: string
  onTypeChange: (type: string) => void
}) {
  const navigate = useNavigate()
  const title =
    sectionKey === 'culture' ? '주변에 가볼 만한 공간' : '주변에 먹을 만한 식당'
  const targetCategory: PoiCategory = sectionKey === 'culture' ? 'culture' : 'restaurant'
  const nearbyList = useMemo(() => {
    const anchor =
      card.anchorLat && card.anchorLng
        ? { id: card.id, lat: card.anchorLat, lng: card.anchorLng }
        : undefined
    return buildNearbyCards(allPois, anchor, targetCategory, radius)
  }, [allPois, card.anchorLat, card.anchorLng, card.id, targetCategory, radius])
  const filteredNearby =
    selectedType === '전체'
      ? nearbyList
      : nearbyList.filter(item => item.type === selectedType)

  return (
    <article className="my-dining-card my-dining-card--with-accordion">
      <div className="my-dining-card__reservation">
        <ReservationCardContent card={card} />
      </div>
      <section className="my-dining-accordion my-dining-accordion--attached">
        <button type="button" className="my-dining-accordion__header" onClick={onToggle}>
          <span>{title}</span>
          <span className={`my-dining-accordion__chevron ${isOpen ? 'is-open' : ''}`}>
            ⌄
          </span>
        </button>
        {isOpen && (
          <div className="my-dining-accordion__body">
            <div className="my-dining-filter-row">
              <div className="my-dining-filter-chips">
                {typeOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`my-dining-filter-chip ${selectedType === option ? 'is-active' : ''}`}
                    onClick={() => onTypeChange(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="poi-detail__experience-list success-recommend-list my-dining-nearby-list">
              {filteredNearby.map(item => (
                <NearbyCard
                  key={item.id}
                  card={item}
                  onSelect={() => navigate(`/poi/${item.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </article>
  )
}

function NearbyCard({ card, onSelect }: { card: NearbyCardData; onSelect: () => void }) {
  return (
    <article
      className="poi-detail__experience-card my-dining-nearby-card"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="poi-detail__experience-media my-dining-nearby-card__media" />
      <div className="poi-detail__experience-body my-dining-nearby-card__body">
        <div className="poi-detail__experience-title-row">
          <span className="poi-detail__experience-title">{card.name}</span>
        </div>
        <div className="poi-detail__experience-meta">
          <span>{card.meta}</span>
        </div>
        <div className="poi-detail__experience-meta">
          <span>{card.dateText}</span>
          <span>{card.distanceText}</span>
        </div>
      </div>
    </article>
  )
}

function buildNearbyCards(
  pois: LifestylePoi[],
  anchor: { id: string; lat: number; lng: number } | undefined,
  targetCategory: PoiCategory,
  radius: RadiusOption,
): NearbyCardData[] {
  if (!anchor) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return pois
    .filter(poi => poi.category === targetCategory)
    .filter(poi => poi.id !== anchor.id)
    .filter(poi => isPoiActive(poi, today))
    .map(poi => {
      const distanceMeters =
        calculateDistanceInKm(anchor.lat, anchor.lng, poi.lat, poi.lng) * 1000
      return {
        poi,
        distanceMeters,
      }
    })
    .filter(item => item.distanceMeters <= radius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 8)
    .map(item => ({
      id: item.poi.id,
      name: item.poi.name,
      meta: `${item.poi.type ?? item.poi.category} · ${item.poi.address.split(' ')[1] ?? item.poi.address}`,
      dateText: formatUpcomingDate(item.poi.endDate),
      distanceText: formatDistanceMeters(item.distanceMeters),
      type: item.poi.type ?? '기타',
    }))
}

function buildReservationCardsFromList(
  entries: MyDiningLocationState[],
  pois: LifestylePoi[],
) {
  const cards: ReservationCardData[] = []

  entries.forEach(entry => {
    if (entry.reservation) {
      const poi = entry.poiId ? pois.find(item => item.id === entry.poiId) : undefined
      const area = poi?.address.split(' ')[1] ?? poi?.address ?? '지역 정보 없음'
      const category =
        poi?.type ?? (poi?.category === 'restaurant' ? '레스토랑' : '문화·예술')

      cards.push({
        id: buildReservationKey(entry),
        title: entry.poiName ?? poi?.name ?? '예약한 장소',
        area,
        category,
        poiCategory: 'restaurant',
        isOnline: true,
        date: entry.reservation.date,
        time: entry.reservation.sessionLabel ?? '',
        people: entry.reservation.people,
        status: 'upcoming',
        anchorLat: poi?.lat,
        anchorLng: poi?.lng,
      })
    }

    const cultureReservation = entry.cultureReservation
    if (cultureReservation) {
      const poi = cultureReservation.poiId
        ? pois.find(item => item.id === cultureReservation.poiId)
        : undefined
      const area = poi?.address.split(' ')[1] ?? poi?.address ?? '지역 정보 없음'
      const category = poi?.type ?? '문화·예술'
      const parsedDate = parseSummaryDate(cultureReservation.summary.dateText)

      cards.push({
        id: buildReservationKey(entry),
        title:
          cultureReservation.poiName ?? poi?.name ?? cultureReservation.summary.title,
        area,
        category,
        poiCategory: 'culture',
        isOnline: false,
        date: parsedDate?.toISOString() ?? new Date().toISOString(),
        dateLabel: cultureReservation.summary.dateText,
        time: cultureReservation.summary.timeText,
        people: cultureReservation.summary.peopleText,
        status: 'upcoming',
        anchorLat: poi?.lat,
        anchorLng: poi?.lng,
      })
    }
  })

  return cards
}

function isPoiActive(poi: LifestylePoi, today: Date) {
  if (!poi.endDate) {
    return true
  }
  return new Date(poi.endDate).getTime() >= today.getTime()
}

function formatUpcomingDate(endDate?: string) {
  if (!endDate) {
    return '운영 중'
  }
  const date = new Date(endDate)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[date.getDay()]})까지`
}

function formatReservationDate(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return '날짜 미정'
  }
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[date.getDay()]})`
}

function formatDdayLabel(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / MILLISECONDS_PER_DAY)
  if (diff > 0) {
    return `D-${diff}`
  }
  if (diff === 0) {
    return 'D-day'
  }
  return `D+${Math.abs(diff)}`
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

function getReservationBadgeLabel(card: ReservationCardData) {
  if (card.poiCategory === 'restaurant') {
    return card.isOnline ? '온라인 예약' : '방문 예약'
  }
  return card.isOnline ? '온라인 수령' : '방문 수령'
}

function buildTypeOptionsByCategory(pois: LifestylePoi[], category: PoiCategory) {
  const types = pois
    .filter(poi => poi.category === category)
    .map(poi => poi.type)
    .filter((value): value is string => Boolean(value))
  const uniqueTypes = Array.from(new Set(types))
  return ['전체', ...uniqueTypes]
}

function parseSummaryDate(value: string) {
  const normalized = value.replace(/\./g, '-')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

function hydrateReservationState(state: MyDiningLocationState) {
  const stored = readStoredReservations()
  if (!hasReservationPayload(state)) {
    return stored
  }

  const key = buildReservationKey(state)
  const hasDuplicate = stored.some(entry => buildReservationKey(entry) === key)
  const nextStored = hasDuplicate ? stored : [state, ...stored]
  sessionStorage.setItem(MY_DINING_STORAGE_KEY, JSON.stringify(nextStored))
  return nextStored
}

function readStoredReservations() {
  const stored = sessionStorage.getItem(MY_DINING_STORAGE_KEY)
  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored) as MyDiningLocationState | MyDiningLocationState[]
    if (Array.isArray(parsed)) {
      return parsed
    }
    if (parsed && typeof parsed === 'object') {
      return [parsed]
    }
    return []
  } catch (error) {
    sessionStorage.removeItem(MY_DINING_STORAGE_KEY)
    return []
  }
}

function hasReservationPayload(state: MyDiningLocationState) {
  return Boolean(state.reservation || state.cultureReservation)
}

const MY_DINING_STORAGE_KEY = 'my-dining:last-reservation'

function buildReservationKey(state: MyDiningLocationState) {
  if (state.reservation) {
    return [
      'restaurant',
      state.poiId ?? '',
      state.reservation.date,
      state.reservation.sessionId ?? '',
      state.reservation.people ?? '',
    ].join('|')
  }
  if (state.cultureReservation) {
    const summary = state.cultureReservation.summary
    return [
      'culture',
      state.cultureReservation.poiId ?? '',
      summary.dateText,
      summary.timeText,
      summary.peopleText,
    ].join('|')
  }
  return 'unknown'
}
