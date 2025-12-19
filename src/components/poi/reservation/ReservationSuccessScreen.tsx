import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import type { PoiCategory } from '@/types/poi'
import { GAEvent, trackEvent } from '@/utils/ga'
import { mapCategoryLabel } from '@/utils/poi'

import mapVisualizationData from '../../../../Map Visualization Data.json'

import './ReservationSelectScreen.css'

export interface SuccessSummary {
  title: string
  dateText: string
  timeText: string
  peopleText: string
}

interface Recommendation {
  id: string
  name: string
  rating: string
  meta: string
}

interface SuccessScreenProps {
  summary: SuccessSummary
  basePoi: {
    id: string
    category: 'culture' | 'restaurant'
    lat: number
    lng: number
  }
  myDiningPayload?: {
    summary: SuccessSummary
    poiId?: string
    poiName?: string
  }
  onClose: () => void
  onSelectRecommendation: (id: string) => void
  onViewAll: (category: 'culture' | 'restaurant') => void
  onViewReservationDetail?: () => void
  onSendInvite?: () => void
  onShareTicket?: () => void
}

export function ReservationSuccessScreen({
  summary,
  basePoi,
  myDiningPayload,
  onClose,
  onSelectRecommendation,
  onViewAll,
  onViewReservationDetail,
  onSendInvite,
  onShareTicket,
}: SuccessScreenProps) {
  const navigate = useNavigate()
  const hasTrackedConversion = useRef(false)
  const recommendations = useMemo<Recommendation[]>(() => {
    const targetCategory = basePoi.category === 'restaurant' ? 'culture' : 'restaurant'
    const targetPlaces = mapVisualizationData
      .filter(entry => entry.category === targetCategory)
      .map(entry => {
        const entryLat = Number(entry.lat)
        const entryLng = Number(entry.lng)
        const distance = Math.hypot(basePoi.lat - entryLat, basePoi.lng - entryLng)
        return {
          ...entry,
          distance,
        }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)

    return targetPlaces.map(place => {
      const locationArea = place.address.split(' ')[1] ?? place.address
      const placeType = place.type ?? mapCategoryLabel(place.category as PoiCategory)
      return {
        id: place.id,
        name: place.name,
        rating: getRecommendationRating(place.name),
        meta: `${placeType} · ${locationArea}`,
      }
    })
  }, [basePoi])

  const { title, dateText, timeText, peopleText } = summary
  const detailButtonLabel =
    basePoi.category === 'restaurant' ? '예약 정보 자세히 보기' : '예매 정보 자세히 보기'
  const footerButtonLabel =
    basePoi.category === 'restaurant' ? '초대장 보내기' : '공유하기'

  useEffect(() => {
    if (hasTrackedConversion.current) {
      return
    }
    hasTrackedConversion.current = true
    trackEvent(GAEvent.PLACE_POI_CONVERSION, {
      poi_id: basePoi.id,
      poi_category: basePoi.category,
    })
  }, [basePoi])

  const handleDetailClick = () => {
    if (basePoi.category === 'culture' && myDiningPayload) {
      navigate('/my-dining', { state: { cultureReservation: myDiningPayload } })
      return
    }
    if (onViewReservationDetail) {
      onViewReservationDetail()
      return
    }
    onClose()
  }

  const handleFooterClick = () => {
    if (basePoi.category === 'restaurant') {
      if (onSendInvite) {
        onSendInvite()
        return
      }
      onClose()
      return
    }

    if (onShareTicket) {
      onShareTicket()
      return
    }
    onClose()
  }

  const handleSelectRecommendation = (id: string) => {
    trackEvent(GAEvent.CLICK_PLACE_POI, {
      poi_id: id,
      source: 'reservation_success_recommendation',
      anchor_poi_id: basePoi.id,
      anchor_poi_category: basePoi.category,
    })
    onSelectRecommendation(id)
  }

  return (
    <div className="reservation-screen success-screen">
      <header className="success-header">
        <button className="ghost" type="button" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </header>

      <main className="success-content">
        <h1 className="success-title">
          {basePoi.category === 'restaurant'
            ? '예약을 완료했습니다.'
            : '예매를 완료했습니다.'}
        </h1>

        <div className="success-card">
          <div className="success-card__info">
            <div className="success-thumb" />
            <div className="success-meta-group">
              <p className="success-meta-title">{title}</p>
              <p className="success-meta-sub">{dateText}</p>
              <p className="success-meta-sub">{timeText}</p>
              <p className="success-meta-sub">{peopleText}</p>
            </div>
          </div>
          <button
            type="button"
            className="success-detail-btn"
            onClick={handleDetailClick}
          >
            {detailButtonLabel}
          </button>
        </div>

        <section className="recommend-section">
          <div className="recommend-header">
            <p className="recommend-title">
              {basePoi.category === 'restaurant'
                ? '주변에 이런 곳이 있어요'
                : '식사는 이런 곳 어때요?'}
            </p>
            <button
              className="recommend-see-all"
              type="button"
              onClick={() =>
                onViewAll(basePoi.category === 'restaurant' ? 'culture' : 'restaurant')
              }
            >
              전체 보기 <span className="chevron">›</span>
            </button>
          </div>

          <div className="poi-detail__experience-list success-recommend-list">
            {recommendations.map(item => (
              <article
                key={item.id}
                className="poi-detail__experience-card"
                role="button"
                tabIndex={0}
                onClick={() => handleSelectRecommendation(item.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleSelectRecommendation(item.id)
                  }
                }}
              >
                <div className="poi-detail__experience-media" />
                <div className="poi-detail__experience-body">
                  <div className="poi-detail__experience-title-row">
                    <span className="poi-detail__experience-title">{item.name}</span>
                  </div>
                  <div className="poi-detail__experience-meta">
                    <span>⭐ {item.rating}</span>
                    <span>{item.meta}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="success-footer">
        <button type="button" className="success-footer__cta" onClick={handleFooterClick}>
          {footerButtonLabel}
        </button>
      </footer>
    </div>
  )
}

function getRecommendationRating(name: string) {
  const base = name ? name.charCodeAt(0) : 0
  const rating = 4 + (base % 6) / 10
  return rating.toFixed(1)
}
