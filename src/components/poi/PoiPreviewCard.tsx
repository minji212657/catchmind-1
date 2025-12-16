import { Link } from 'react-router-dom'

import type { LifestylePoi } from '@/types/poi'

import './PoiPreviewCard.css'

interface PoiPreviewCardProps {
  poi: LifestylePoi
}

export function PoiPreviewCard({ poi }: PoiPreviewCardProps) {
  const priceLabel =
    poi.isFree && !poi.isPaid ? '무료입장' : poi.sessions?.[0]?.price ? `₩${poi.sessions[0].price.toLocaleString()}` : '유료'

  return (
    <Link to={`/poi/${poi.id}`} className="poi-card" aria-label={`${poi.name} 상세 보기`}>
      <div className="poi-card__badge-group">
        <span className="poi-card__badge">{poi.category}</span>
        {poi.reservable && <span className="poi-card__badge poi-card__badge--accent">예약 가능</span>}
      </div>
      <h3>{poi.name}</h3>
      <p className="poi-card__address">{poi.address}</p>
      <dl className="poi-card__meta">
        <div>
          <dt>운영시간</dt>
          <dd>{poi.openHours}</dd>
        </div>
        <div>
          <dt>휴무일</dt>
          <dd>{poi.closedDays.length ? poi.closedDays.join(', ') : '연중무휴'}</dd>
        </div>
        <div>
          <dt>이용요금</dt>
          <dd>{priceLabel}</dd>
        </div>
      </dl>
    </Link>
  )
}
