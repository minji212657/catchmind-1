import culturePin from '@/assets/culturePin.svg'
import restaurantPin from '@/assets/restaurantPin.svg'
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
    if (!marker) {
      return
    }

    this.infoWindow?.close()
    this.map.setCenter(marker.getPosition())
  }

  private createMarkerImage(category: PoiCategory) {
    if (!this.kakaoMaps) {
      return undefined
    }
    const asset = this.getMarkerAsset(category)
    return new this.kakaoMaps.MarkerImage(asset.src, asset.size, {
      offset: asset.offset,
    })
  }

  private getMarkerAsset(category: PoiCategory) {
    const diningCategories: PoiCategory[] = ['cafe', 'wineBar', 'popup', 'class', 'restaurant']
    const isDining = diningCategories.includes(category)
    return {
      src: isDining ? restaurantPin : culturePin,
      size: new this.kakaoMaps!.Size(32, 32),
      offset: new this.kakaoMaps!.Point(16, 16),
    }
  }
}
