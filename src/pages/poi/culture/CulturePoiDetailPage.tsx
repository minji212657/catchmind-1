import {
  ArrowLeft,
  Bookmark,
  CircleDollarSign,
  Clock4,
  Home,
  MapPin,
  Search,
  Share2,
  Star,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ReservationSelectScreen,
  type ReservationSelectionResult,
} from '@/components/poi/reservation/ReservationSelectScreen'
import {
  ReservationSuccessScreen,
  type SuccessSummary,
} from '@/components/poi/reservation/ReservationSuccessScreen'
import { TicketPaymentScreen } from '@/components/poi/reservation/TicketPaymentScreen'
import { fetchPoiById } from '@/services/poi/poiApi'
import { poiService } from '@/services/poi/poiService'
import type { LifestylePoi, PoiCategory } from '@/types/poi'
import { GAEvent, trackEvent } from '@/utils/ga'
import { getMockRating, mapCategoryLabel } from '@/utils/poi'

import mapVisualizationData from '../../../../Map Visualization Data.json'
import './CulturePoiDetailPage.css'

export function CulturePoiDetailPage() {
  const { poiId } = useParams<{ poiId: string }>()
  const navigate = useNavigate()
  const [poi, setPoi] = useState<LifestylePoi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(1)
  const [detailExpanded, setDetailExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState(DETAIL_TABS[0])
  const [reservationStage, setReservationStage] = useState<
    'selection' | 'payment' | 'success' | null
  >(null)
  const [selectedReservationDate, setSelectedReservationDate] = useState<Date | null>(
    null,
  )
  const [adultTicketCount, setAdultTicketCount] = useState(1)
  const [youthTicketCount, setYouthTicketCount] = useState(0)
  const [ticketSelection, setTicketSelection] =
    useState<ReservationSelectionResult | null>(null)
  const [successSummary, setSuccessSummary] = useState<SuccessSummary | null>(null)
  const carouselTrackRef = useRef<HTMLDivElement | null>(null)
  const carouselContainerRef = useRef<HTMLDivElement | null>(null)
  const hasTrackedDetailView = useRef(false)
  const nearbyRestaurants = useMemo<NearbyRestaurant[]>(() => {
    if (!poi) {
      return []
    }
    const baseLat = Number(poi.lat ?? '0')
    const baseLng = Number(poi.lng ?? '0')
    return mapVisualizationData
      .filter(entry => entry.category === 'restaurant' && entry.name !== poi.name)
      .map(
        (entry): NearbyRestaurant => ({
          ...entry,
          distance: Math.hypot(baseLat - Number(entry.lat), baseLng - Number(entry.lng)),
        }),
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
  }, [poi])

  useEffect(() => {
    if (!poi || hasTrackedDetailView.current) {
      return
    }
    hasTrackedDetailView.current = true
    trackEvent(GAEvent.VIEW_PLACE_POI_DETAIL, {
      poi_id: poi.id,
      poi_name: poi.name,
      poi_category: poi.category,
    })
  }, [poi])
  useEffect(() => {
    if (!poiId) {
      setPoi(null)
      setIsLoading(false)
      setErrorMessage('POI ID가 제공되지 않았습니다.')
      return
    }

    const controller = new AbortController()
    const resolvedPoiId = poiId

    async function load() {
      setIsLoading(true)
      try {
        const remotePoi = await fetchPoiById(resolvedPoiId, controller.signal)
        if (!controller.signal.aborted) {
          setPoi(remotePoi)
          setErrorMessage(null)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        const fallbackPoi = poiService.findPoiById(resolvedPoiId)
        if (fallbackPoi) {
          setPoi(fallbackPoi)
          setErrorMessage('API 연결에 실패해 임시 데이터로 표시합니다.')
        } else {
          setPoi(null)
          setErrorMessage('해당 POI를 찾을 수 없습니다.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [poiId])

  if (isLoading) {
    return (
      <section className="poi-detail poi-detail--empty">
        <div>상세 정보를 불러오는 중입니다…</div>
      </section>
    )
  }

  if (!poi) {
    return (
      <section className="poi-detail poi-detail--empty">
        <div>{errorMessage ?? '해당 POI를 찾을 수 없습니다.'}</div>
        <button type="button" onClick={() => navigate('/')}>
          홈으로 이동
        </button>
      </section>
    )
  }

  const { rating, reviews } = getMockRating(poi)
  const galleryImages: (string | undefined)[] = Array.from(
    { length: 5 },
    (_, idx) => poi.images?.[idx],
  )
  const basePrice = poi.sessions?.[0]?.price ?? 24000
  const childPrice = Math.round((basePrice * 0.7) / 100) * 100
  const discountedAdultPrice = Math.round((basePrice * 0.7) / 100) * 100
  const priceRows = [
    { label: '성인', price: basePrice },
    { label: '어린이·청소년', price: childPrice || undefined },
  ]
  const descriptor = CULTURE_CATEGORIES.includes(poi.category)
    ? '전체 관람가'
    : `${mapCategoryLabel(poi.category)} 추천`
  const priceSummary =
    priceRows
      .filter(row => row.price)
      .map(row => `${row.label} ${row.price!.toLocaleString()}원`)
      .join(' · ') || '정보 준비 중'
  const totalImages = galleryImages.filter(Boolean).length || galleryImages.length

  const handleCarouselScroll = () => {
    if (!carouselContainerRef.current || !carouselTrackRef.current) {
      return
    }
    const containerWidth = carouselContainerRef.current.getBoundingClientRect().width
    if (!containerWidth) {
      return
    }
    const offset = carouselTrackRef.current.scrollLeft
    const index = Math.round(offset / containerWidth) + 1
    setCurrentImageIndex(Math.min(Math.max(index, 1), totalImages))
  }

  const handleOpenReservation = () => {
    setReservationStage('selection')
  }

  const handleReservationClose = () => {
    setReservationStage(null)
    setTicketSelection(null)
    setSuccessSummary(null)
  }

  const handleProceedToPayment = (result: ReservationSelectionResult) => {
    setSelectedReservationDate(result.selectedDate)
    setAdultTicketCount(result.adultCount)
    setYouthTicketCount(result.youthCount)
    setTicketSelection(result)
    setReservationStage('payment')
  }

  const handlePaymentBack = () => {
    setReservationStage('selection')
  }

  const formatSummaryDate = (date: Date | null) => {
    if (!date) {
      return '날짜 미정'
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  const handlePaymentComplete = () => {
    if (!poi) {
      setReservationStage(null)
      return
    }
    const dateText = formatSummaryDate(selectedReservationDate)
    const timeText = poi.openHours || '시간 미정'
    const adultLabel = adultTicketCount ? `성인 ${adultTicketCount}명` : ''
    const youthLabel = youthTicketCount ? `청소년 ${youthTicketCount}명` : ''
    const peopleText = [adultLabel, youthLabel].filter(Boolean).join(' · ') || '인원 미정'
    setSuccessSummary({
      title: poi.name,
      dateText,
      timeText,
      peopleText,
    })
    setReservationStage('success')
  }

  const handleSuccessClose = () => {
    setReservationStage(null)
    setTicketSelection(null)
    setSuccessSummary(null)
  }

  const handleRecommendationSelect = (place: NearbyRestaurant) => {
    trackEvent(GAEvent.CLICK_PLACE_POI, {
      poi_id: place.id,
      poi_name: place.name,
      poi_category: place.category,
      source: 'culture_detail_recommendation',
      anchor_poi_id: poi?.id ?? '',
    })
    navigate(`/poi/${place.id}`)
  }

  return (
    <section className="poi-detail">
      <header className="poi-detail__top-bar">
        <div className="poi-detail__top-left">
          <button type="button" onClick={() => navigate(-1)} aria-label="이전으로">
            <ArrowLeft size={20} />
          </button>
          <button type="button" onClick={() => navigate('/')} aria-label="홈으로">
            <Home size={18} />
          </button>
        </div>
        <div className="poi-detail__top-actions">
          <button type="button" aria-label="검색">
            <Search size={18} />
          </button>
          <button type="button" aria-label="북마크">
            <Bookmark size={18} />
          </button>
          <button type="button" aria-label="공유하기">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      <div className="poi-detail__scroll">
        <div
          className="poi-detail__carousel"
          role="group"
          aria-label={`${poi.name} 이미지`}
        >
          <div
            className="poi-detail__carousel-track"
            ref={node => {
              carouselTrackRef.current = node
            }}
            onScroll={handleCarouselScroll}
          >
            {galleryImages.map((src, index) => (
              <div
                key={`${poi.id}-carousel-${index}`}
                className="poi-detail__carousel-item"
                ref={index === 0 ? carouselContainerRef : undefined}
              >
                {src ? (
                  <img src={src} alt={`${poi.name} 이미지 ${index + 1}`} />
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>
          <div className="poi-detail__carousel-indicator">
            {currentImageIndex} / {totalImages}
          </div>
        </div>

        <section className="poi-detail__info-block">
          <div className="poi-detail__info-title">{poi.name}</div>
          <div className="culture-detail__audience">{poi.audience ?? descriptor}</div>
          <div className="culture-detail__info-rating">
            <Star size={14} />
            <strong>{rating}</strong>
            <span>리뷰 {reviews}개</span>
          </div>
          <div className="poi-detail__info-body">
            <div className="poi-detail__info-line">
              <MapPin size={16} />
              <span>{poi.address}</span>
            </div>
            <div className="poi-detail__info-line">
              <Clock4 size={16} />
              <span>
                {poi.endDate ? `${poi.endDate}` : '상시'} · {poi.openHours}
              </span>
            </div>
            <div className="poi-detail__info-line">
              <CircleDollarSign size={16} />
              <span>{priceSummary}</span>
            </div>
          </div>
        </section>

        <nav className="poi-detail__tabs" aria-label="상세 탭">
          {DETAIL_TABS.map(tab => (
            <button
              key={tab}
              type="button"
              className={`poi-detail__tab ${tab === activeTab ? 'poi-detail__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <section className="poi-detail__tab-content" data-tab="상품 상세">
          <section className="poi-detail__detail-area" data-expanded={detailExpanded}>
            <div className="poi-detail__detail-canvas" />
            <button
              type="button"
              className="poi-detail__outline-button poi-detail__detail-toggle"
              onClick={() => setDetailExpanded(prev => !prev)}
            >
              {detailExpanded ? '상품 상세 접기 ▴' : '상품 상세 자세히보기 ▾'}
            </button>
          </section>
        </section>
        <div className="poi-detail__section-divider" />

        <section className="poi-detail__tab-content" data-tab="가격">
          <div className="poi-detail__price-lines">
            <div className="poi-detail__price-box">
              <ul>
                {priceRows.map(
                  row =>
                    row.price && (
                      <li key={row.label}>
                        <span>{row.label}</span>
                        <strong>{row.price.toLocaleString()}원</strong>
                      </li>
                    ),
                )}
              </ul>
            </div>
          </div>
          <div className="poi-detail__price-note">
            특정 기간, 특정 공연에만 판매하는 가격이 있으니 예매 전 [가격 전체 보기]를
            눌러 확인해주세요.
          </div>
          <button type="button" className="poi-detail__outline-button">
            가격 전체보기
          </button>
        </section>
        <div className="poi-detail__section-divider" />

        <section className="poi-detail__tab-content" data-tab="할인 정보">
          <div className="poi-detail__section-block">
            <div className="poi-detail__panel-title">할인정보</div>
            <div className="poi-detail__panel-accent">[평일 오전 관람 할인 이벤트]</div>
            <div className="poi-detail__panel-text">
              * 진행기간: 2025.10.20 ~ 2025.12.21
              <br />* 입장가능시간: 평일 10:00 ~ 12:00 (이후 입장 시 사용 불가 / 차액결제
              필요)
            </div>
            <ul className="poi-detail__discount-list">
              <li>- 평일 오전 20%할인_성인 19,200원</li>
              <li>- 평일 오전 20%할인_청소년/어린이_13,600원</li>
              <li>- BC카드_ 평일 오전 30%할인_성인 16,800원</li>
              <li>- BC카드_ 평일 오전 30%할인_청소년/어린이 11,900원</li>
            </ul>
          </div>
        </section>
        <div className="poi-detail__section-divider" />

        <section className="poi-detail__tab-content" data-tab="취소 및 환불 규정">
          <div className="poi-detail__section-block">
            <div className="poi-detail__panel-title">취소 및 환불 규정</div>
            <div className="poi-detail__panel-text">
              예매 취소 조건보다 취소 수수료 규정이 우선 적용됩니다.
              <br />
              예매 당일 자정(밤 12시) 이전 취소시 티켓 취소수수료가 없으며, 예매 수수료도
              환불됩니다.(취소기한 내 한함)
            </div>
            <div className="poi-detail__panel-text">
              취소수수료 규정
              <br />
              관람일 기준 아래와 같이 취소 수수료가 적용됩니다.
              <br />
              취소 기한은 예매 후 [상세 예약 내역]에서 확인해 주세요.
            </div>
            <div className="poi-detail__alert-row poi-detail__alert-row--important">
              <span>취소 기간 내 취소 시</span>
              <strong>티켓 금액의 10%</strong>
            </div>
            <div className="poi-detail__panel-subtitle">예매 취소 조건</div>
            <div className="poi-detail__panel-text">
              예매 후 7일 이내 취소시 티켓 금액 전액이 환불됩니다.
              <br />
              (예매 수수료 제외)
            </div>
          </div>
        </section>
        <div className="poi-detail__section-divider" />
        <section className="poi-detail__tab-content" data-tab="취소 및 환불 규정">
          <div className="poi-detail__section-block">
            <div className="poi-detail__panel-title">예매 안내 사항</div>
            <div className="poi-detail__panel-text">
              도착 예정 시간 10분 전까지 도착해 주시고, 본인 확인용 신분증을 지참해
              주세요.
            </div>
          </div>
        </section>
        <div className="poi-detail__section-divider" />
        <section className="poi-detail__tab-content" data-tab="취소 및 환불 규정">
          <div className="poi-detail__section-block">
            <div className="poi-detail__panel-title">상품 · 기획사 · 판매자 정보</div>
            <div className="poi-detail__panel-text">
              상품 제공자는 CatchTable Lifestyle이며, 구매/환불 문의는 앱 내 고객센터를
              이용해 주세요.
            </div>
          </div>
        </section>
        <div className="poi-detail__section-divider" />
        <section className="poi-detail__tab-content" data-tab="취소 및 환불">
          <div className="poi-detail__section-block poi-detail__experience">
            <div className="poi-detail__experience-header">
              <span className="poi-detail__panel-title">함께 가볼 만한 곳</span>
            </div>
            <div className="poi-detail__experience-list">
              {nearbyRestaurants.map(place => {
                const locationArea = place.address.split(' ')[1] ?? place.address
                const placeRating = getExperienceRating(place.name)
                const placeType =
                  place.type ?? mapCategoryLabel(place.category as PoiCategory)
                return (
                  <article
                    key={place.name}
                    className="poi-detail__experience-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRecommendationSelect(place)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleRecommendationSelect(place)
                      }
                    }}
                  >
                    <div className="poi-detail__experience-media" />
                    <div className="poi-detail__experience-body">
                      <div className="poi-detail__experience-title-row">
                        <span className="poi-detail__experience-title">{place.name}</span>
                        <button type="button" aria-label="북마크">
                          <Bookmark size={18} />
                        </button>
                      </div>
                      <div className="poi-detail__experience-meta">
                        <Star size={14} />
                        <strong>{placeRating}</strong>
                        <span>
                          {placeType} · {locationArea}
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
        <div className="poi-detail__spacer" />
      </div>

      <footer className="poi-detail__bottom">
        <button type="button" className="poi-detail__bookmark">
          <Bookmark size={18} />
        </button>
        <button
          type="button"
          className="poi-detail__primary"
          onClick={handleOpenReservation}
        >
          예매하기
        </button>
      </footer>
      {reservationStage === 'selection' && (
        <ReservationSelectScreen
          selectedDate={selectedReservationDate}
          setSelectedDate={setSelectedReservationDate}
          adultCount={adultTicketCount}
          setAdultCount={setAdultTicketCount}
          youthCount={youthTicketCount}
          setYouthCount={setYouthTicketCount}
          adultPrice={basePrice}
          youthPrice={childPrice}
          discountAdultPrice={discountedAdultPrice}
          onClose={handleReservationClose}
          onProceedPayment={handleProceedToPayment}
        />
      )}
      {reservationStage === 'payment' && ticketSelection && (
        <div className="reservation-screen-overlay reservation-screen-overlay--light">
          <TicketPaymentScreen
            adult={ticketSelection.adultCount}
            youth={ticketSelection.youthCount}
            totalPrice={ticketSelection.totalPrice}
            visitDate={ticketSelection.selectedDate}
            onBack={handlePaymentBack}
            onPay={handlePaymentComplete}
          />
        </div>
      )}
      {reservationStage === 'success' && successSummary && (
        <div className="reservation-screen-overlay reservation-screen-overlay--light">
          <ReservationSuccessScreen
            summary={successSummary}
            basePoi={{
              id: poi.id,
              category: 'culture',
              lat: Number(poi.lat ?? 0),
              lng: Number(poi.lng ?? 0),
            }}
            myDiningPayload={{
              summary: successSummary,
              poiId: poi.id,
              poiName: poi.name,
            }}
            onClose={handleSuccessClose}
            onSelectRecommendation={id => navigate(`/poi/${id}`)}
            onViewAll={category => navigate('/', { state: { filterCategory: category } })}
          />
        </div>
      )}
    </section>
  )
}

const DETAIL_TABS = ['상품 상세', '가격', '할인 정보', '취소 및 환불']
const CULTURE_CATEGORIES: LifestylePoi['category'][] = [
  'exhibition',
  'performance',
  'gallery',
  'popup',
  'class',
  'walk',
]

type RestaurantMapEntry = (typeof mapVisualizationData)[number]

type NearbyRestaurant = RestaurantMapEntry & {
  distance: number
}

function getExperienceRating(name: string) {
  const base = name ? name.charCodeAt(0) : 0
  const rating = 4 + (base % 6) / 10
  return rating.toFixed(1)
}
