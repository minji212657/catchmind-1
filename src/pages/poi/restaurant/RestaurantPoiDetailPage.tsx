import {
  ArrowLeft,
  Bookmark,
  CircleDollarSign,
  Clock4,
  Home,
  MapPin,
  Phone,
  Search,
  Share2,
  Star,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  RestaurantReserveBottomSheet,
  type RestaurantReservationSelection,
  type SerializedRestaurantReservationSelection,
} from '@/components/poi/reservation/RestaurantReserveBottomSheet'
import { RestaurantBottomSheet } from '@/components/poi/RestaurantBottomSheet'
import { fetchPoiById } from '@/services/poi/poiApi'
import { poiService } from '@/services/poi/poiService'
import type { LifestylePoi, PoiCategory } from '@/types/poi'
import { getMockRating, mapCategoryLabel } from '@/utils/poi'

import mapVisualizationData from '../../../../Map Visualization Data.json'

import './RestaurantPoiDetailPage.css'

export function RestaurantPoiDetailPage() {
  const { poiId } = useParams<{ poiId: string }>()
  const navigate = useNavigate()
  const [poi, setPoi] = useState<LifestylePoi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(1)
  const [activeTab, setActiveTab] = useState(DETAIL_TABS[0])
  const carouselTrackRef = useRef<HTMLDivElement | null>(null)
  const carouselContainerRef = useRef<HTMLDivElement | null>(null)
  const [isReserveSheetOpen, setReserveSheetOpen] = useState(false)

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

  const nearbyCulturePlaces = useMemo(() => {
    if (!poi) {
      return []
    }
    const baseLat = Number(poi.lat ?? '0')
    const baseLng = Number(poi.lng ?? '0')
    return mapVisualizationData
      .filter(entry => entry.category === 'culture')
      .map(
        (entry): NearbyRestaurant => ({
          ...entry,
          distance: Math.hypot(baseLat - Number(entry.lat), baseLng - Number(entry.lng)),
        }),
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
  }, [poi])

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

  const handleProceedReservation = (selection: RestaurantReservationSelection) => {
    setReserveSheetOpen(false)
    if (poiId) {
      const serializedSelection: SerializedRestaurantReservationSelection = {
        ...selection,
        date: selection.date.toISOString(),
      }
      navigate(`/poi/${poiId}/reservation/confirm`, {
        state: { selection: serializedSelection },
      })
    }
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
          <div className="poi-detail__info-title-row">
            <div className="restaurant-info-title-group">
              <div className="poi-detail__info-title">{poi.name}</div>
            </div>
            <button type="button" className="restaurant-info-call">
              <Phone size={16} />
              전화
            </button>
          </div>
          <div className="poi-detail__info-rating">
            <Star size={14} />
            <strong>{rating}</strong>
            <span>리뷰 {reviews}개</span>
            <button type="button" className="poi-detail__info-link">
              리뷰 보기 ▸
            </button>
          </div>
          <div className="poi-detail__info-body">
            <div className="poi-detail__info-line">
              <MapPin size={16} />
              <span>{poi.address}</span>
              <button type="button" className="poi-detail__info-link">
                위치 ▾
              </button>
            </div>
            <div className="poi-detail__info-line">
              <CircleDollarSign size={16} />
              <span>점심·저녁 동일가 · 1~5만원</span>
            </div>
            <div className="poi-detail__info-line">
              <Clock4 size={16} />
              <span>오늘(수) · {poi.openHours}</span>
            </div>
          </div>
          <div className="restaurant-info-actions">
            <button type="button" className="restaurant-pill">
              최대 4명 예약
            </button>
            <button type="button" className="restaurant-pill">
              cpay 예약금 0원
            </button>
            <button type="button" className="restaurant-pill">
              룸
            </button>
            <button type="button" className="restaurant-pill">
              발렛
            </button>
            <button type="button" className="restaurant-pill">
              콜키지
            </button>
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

        <section className="poi-detail__tab-content" data-tab="홈">
          <div className="restaurant-home-section">
            <div className="restaurant-home-card restaurant-home-card--news">
              <img
                className="restaurant-home-card__icon"
                src="/assets/notification.svg"
                alt="소식"
              />
              <div>
                <p className="restaurant-home-card__title">소식</p>
                <p className="restaurant-home-card__text">주말 영업시간 안내</p>
              </div>
            </div>
            <div className="restaurant-home-card restaurant-home-card--coupon">
              <img
                className="restaurant-home-card__icon"
                src="/assets/coupon.svg"
                alt="쿠폰"
              />
              <div className="restaurant-home-card__content">
                <p className="restaurant-home-card__title">점심 첫타임 30% 할인 쿠폰</p>
                <p className="restaurant-home-card__text">매장에서 확인 후 사용</p>
              </div>
              <button type="button" className="restaurant-home-card__cta">
                전체 보기
              </button>
            </div>
            <div className="restaurant-reservation">
              <p className="restaurant-reservation__title">예약</p>
              <button type="button" className="restaurant-reservation__field">
                날짜 · 인원 · 시간
              </button>
              <div className="restaurant-reservation__slots">
                {[
                  { label: '오늘(수)', status: '예약 마감', disabled: true },
                  { label: '내일(목)', status: '예약 마감', disabled: true },
                  { label: '12.12(금)', status: '예약 가능', disabled: false },
                  { label: '12.13(토)', status: '예약 가능', disabled: false },
                  { label: '12.14(일)', status: '예약 가능', disabled: false },
                ].map(slot => (
                  <button
                    key={slot.label}
                    type="button"
                    className={`restaurant-reservation__slot ${slot.label === '12.12(금)' ? 'restaurant-reservation__slot--active' : ''}`}
                    disabled={slot.disabled}
                  >
                    <span className="restaurant-reservation__date">{slot.label}</span>
                    <span
                      className={`restaurant-reservation__status ${
                        slot.status === '예약 가능'
                          ? 'restaurant-reservation__status--available'
                          : ''
                      }`}
                    >
                      {slot.status}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="poi-detail__outline-button restaurant-reservation__action"
              >
                예약 가능 날짜 찾기
              </button>
            </div>
          </div>
        </section>
        <div className="poi-detail__section-divider" />

        <section className="poi-detail__tab-content" data-tab="메뉴">
          <div className="restaurant-menu">
            <div className="restaurant-menu__header">
              <span className="restaurant-menu__title">메뉴</span>
            </div>
            {[1, 2, 3].map(item => (
              <article key={item} className="restaurant-menu__item">
                <div className="restaurant-menu__meta">
                  <div className="restaurant-menu__tag-row">
                    <span className="restaurant-menu__pill">대표</span>
                  </div>
                  <div className="restaurant-menu__name">영국식 3단 브런치</div>
                  <div className="restaurant-menu__desc">
                    영국식 아침식사, 해산물 샐러드, 오늘의 디저트
                  </div>
                  <div className="restaurant-menu__price">49,000원</div>
                </div>
                <div className="restaurant-menu__thumb" />
              </article>
            ))}
            <button
              type="button"
              className="poi-detail__outline-button restaurant-menu__cta"
            >
              메뉴 전체 보기
            </button>
          </div>
        </section>
        <div className="poi-detail__section-divider" />

        <section className="poi-detail__tab-content" data-tab="할인 정보">
          <div className="poi-detail__section-block poi-detail__photo-gallery">
            <div className="poi-detail__panel-title">사진</div>
            <div className="poi-detail__photo-grid">
              {Array.from({ length: 6 }, (_, idx) => (
                <div key={`photo-${idx}`} className="poi-detail__photo-tile" />
              ))}
            </div>
            <button
              type="button"
              className="poi-detail__outline-button poi-detail__gallery-cta"
            >
              사진 213개 전체보기
            </button>
          </div>
        </section>
        <div className="poi-detail__section-divider" />

        <section className="poi-detail__tab-content" data-tab="취소 및 환불">
          <div className="poi-detail__section-block poi-detail__reviews">
            <div className="poi-detail__reviews-header">
              <span className="poi-detail__panel-title">추천 리뷰</span>
            </div>
            <div className="poi-detail__ratings">
              <Star size={16} />
              <strong>4.6</strong>
              <span>(124)</span>
            </div>
            <div className="poi-detail__review-list">
              {[1, 2].map(index => (
                <article key={index} className="poi-detail__review-card">
                  <div className="poi-detail__review-media" />
                  <div className="poi-detail__review-body">
                    <div className="poi-detail__review-meta">
                      <span className="poi-detail__review-author">김제헌</span>
                      <span className="poi-detail__review-date">2025.12.08</span>
                    </div>
                    <p className="poi-detail__review-text">
                      비프 웰링턴이랑 미트파이 최고입니다...정말 추천해요.
                    </p>
                    <div className="poi-detail__review-rating">
                      <Star size={14} />
                      <strong>5.0</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="poi-detail__outline-button poi-detail__reviews-cta"
            >
              리뷰 전체 보기
            </button>
          </div>
        </section>
        <div className="poi-detail__section-divider" />
        <section className="poi-detail__tab-content" data-tab="취소 및 환불">
          <div className="poi-detail__section-block poi-detail__experience">
            <div className="poi-detail__experience-header">
              <span className="poi-detail__panel-title">함께 가볼 만한 곳</span>
              <button type="button" className="poi-detail__experience-link">
                전체 보기 ▸
              </button>
            </div>
            <div className="poi-detail__experience-list">
              {nearbyCulturePlaces.map(place => {
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
                    onClick={() => navigate(`/poi/${place.id}`)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/poi/${place.id}`)
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

      <RestaurantBottomSheet
        onBookmark={() => {}}
        onPrimaryAction={() => setReserveSheetOpen(true)}
      />
      <RestaurantReserveBottomSheet
        open={isReserveSheetOpen}
        onClose={() => setReserveSheetOpen(false)}
        onProceed={handleProceedReservation}
      />
    </section>
  )
}

const DETAIL_TABS = ['상품 상세', '메뉴', '할인 정보']

type RestaurantMapEntry = (typeof mapVisualizationData)[number]

type NearbyRestaurant = RestaurantMapEntry & {
  distance: number
}

function getExperienceRating(name: string) {
  const base = name ? name.charCodeAt(0) : 0
  const rating = 4 + (base % 6) / 10
  return rating.toFixed(1)
}
