import type { LifestylePoi, PoiCategory } from '@/types/poi'

import { loadKakaoMapsSdk } from './kakaoLoader'

export interface MapViewport {
  lat: number
  lng: number
  zoom: number
}

export interface MapClientConfig {
  containerId: string
  provider: 'kakao' | 'naver' | 'google'
  defaultViewport: MapViewport
}

interface RenderOptions {
  onPoiSelect?: (poi: LifestylePoi) => void
  activePoiId?: string
}

export class MapClient {
  private readonly config: MapClientConfig
  private map?: kakao.maps.Map
  private kakaoMaps?: typeof kakao.maps
  private markers: kakao.maps.Marker[] = []
  private markerMap = new Map<string, kakao.maps.Marker>()
  private poiMap = new Map<string, LifestylePoi>()
  private infoWindow?: kakao.maps.InfoWindow

  constructor(config: MapClientConfig) {
    this.config = config
  }

  async initialize() {
    if (this.map) {
      return
    }

    if (typeof window === 'undefined') {
      throw new Error('브라우저 환경에서만 지도를 초기화할 수 있습니다.')
    }

    const container = document.getElementById(this.config.containerId)

    if (!container) {
      throw new Error(`ID가 ${this.config.containerId}인 지도 컨테이너를 찾을 수 없습니다.`)
    }

    this.kakaoMaps = await loadKakaoMapsSdk()

    const center = new this.kakaoMaps.LatLng(
      this.config.defaultViewport.lat,
      this.config.defaultViewport.lng,
    )

    this.map = new this.kakaoMaps.Map(container, {
      center,
      level: this.normalizeZoom(this.config.defaultViewport.zoom),
    })
  }

  renderPois(pois: LifestylePoi[], options: RenderOptions = {}) {
    if (!this.map || !this.kakaoMaps) {
      return
    }

    this.clearMarkers()
    this.poiMap.clear()
    this.markerMap.clear()

    pois.forEach(poi => this.poiMap.set(poi.id, poi))

    this.markers = pois.map(poi => {
      const marker = new this.kakaoMaps!.Marker({
        position: new this.kakaoMaps!.LatLng(poi.lat, poi.lng),
        image: this.createMarkerImage(poi.category),
      })
      marker.setMap(this.map!)

      kakao.maps.event.addListener(marker, 'click', () => {
        this.focusMarker(poi.id)
        options.onPoiSelect?.(poi)
      })

      this.markerMap.set(poi.id, marker)
      return marker
    })

    if (pois[0]) {
      const anchor = new this.kakaoMaps.LatLng(pois[0].lat, pois[0].lng)
      this.map.setCenter(anchor)
    }

    const targetPoiId = options.activePoiId ?? pois[0]?.id
    if (targetPoiId) {
      this.focusMarker(targetPoiId)
    }
  }

  destroy() {
    this.clearMarkers()
    this.infoWindow?.close()
    this.map = undefined
    this.kakaoMaps = undefined
  }

  private clearMarkers() {
    this.markers.forEach(marker => {
      marker.setMap(null)
    })
    this.markers = []
    this.markerMap.clear()
    this.poiMap.clear()
    this.infoWindow?.close()
  }

  private normalizeZoom(zoom: number) {
    if (!Number.isFinite(zoom)) return 5
    return Math.min(13, Math.max(1, Math.round(zoom)))
  }

  private focusMarker(poiId: string) {
    if (!this.map || !this.kakaoMaps) {
      return
    }

    const marker = this.markerMap.get(poiId)
    const poi = this.poiMap.get(poiId)

    if (!marker || !poi) {
      return
    }

    if (!this.infoWindow) {
      this.infoWindow = new this.kakaoMaps.InfoWindow({
        removable: false,
      })
    }

    const content = `
      <div class="poi-infowindow">
        <strong>${poi.name}</strong>
        <span>${this.getCategoryLabel(poi.category)}</span>
      </div>
    `

    this.infoWindow.setContent(content)
    this.infoWindow.open(this.map, marker)
    this.map.setCenter(marker.getPosition())
  }

  private createMarkerImage(category: PoiCategory) {
    if (!this.kakaoMaps) {
      return undefined
    }
    const presentation = this.getMarkerPresentation(category)
    const svg = `<svg width="40" height="56" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C8.954 0 0 8.954 0 20C0 35 20 56 20 56C20 56 40 35 40 20C40 8.954 31.046 0 20 0Z" fill="${presentation.color}"/>
      <circle cx="20" cy="20" r="12" fill="white" />
      <text x="20" y="24" text-anchor="middle" font-size="12" font-weight="700" fill="${presentation.color}">
        ${presentation.glyph}
      </text>
    </svg>`
    const imageSrc = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
    return new this.kakaoMaps.MarkerImage(
      imageSrc,
      new this.kakaoMaps.Size(40, 56),
      {
        offset: new this.kakaoMaps.Point(20, 56),
      },
    )
  }

  private getCategoryLabel(category: PoiCategory) {
    const labels: Record<PoiCategory, string> = {
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
    return labels[category] ?? category
  }

  private getMarkerPresentation(category: PoiCategory) {
    const diningCategories: PoiCategory[] = ['cafe', 'wineBar', 'popup', 'class', 'restaurant']
    const isDining = diningCategories.includes(category)
    return {
      color: isDining ? '#ff6b3b' : '#8cc341',
      glyph: isDining ? '식' : '문',
    }
  }
}
