import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { poiService } from '@/services/poi/poiService'

import { CulturePoiDetailPage } from './culture/CulturePoiDetailPage'
import { RestaurantPoiDetailPage } from './restaurant/RestaurantPoiDetailPage'

export function PoiDetailPage() {
  const { poiId } = useParams<{ poiId: string }>()
  const navigate = useNavigate()
  const poi = useMemo(() => (poiId ? poiService.findPoiById(poiId) : undefined), [poiId])

  if (!poi) {
    return (
      <section className="poi-detail poi-detail--empty">
        <div>해당 POI를 찾을 수 없습니다.</div>
        <button type="button" onClick={() => navigate('/')}>
          홈으로 돌아가기
        </button>
      </section>
    )
  }

  if (poi.category === 'culture') {
    return <CulturePoiDetailPage />
  }

  return <RestaurantPoiDetailPage />
}
