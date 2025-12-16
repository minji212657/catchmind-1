declare global {
  namespace kakao {
    namespace maps {
      function load(callback: () => void): void

      class LatLng {
        constructor(lat: number, lng: number)
      }

      interface MapOptions {
        center: LatLng
        level: number
      }

      class Map {
        constructor(container: HTMLElement, options: MapOptions)
        setCenter(latlng: LatLng): void
      }

      interface MarkerOptions {
        position: LatLng
        image?: MarkerImage
      }

      class Marker {
        constructor(options: MarkerOptions)
        setMap(map: Map | null): void
        getPosition(): LatLng
      }

      class Size {
        constructor(width: number, height: number)
      }

      class Point {
        constructor(x: number, y: number)
      }

      interface InfoWindowOptions {
        content?: string
        removable?: boolean
      }

      class InfoWindow {
        constructor(options: InfoWindowOptions)
        open(map: Map, marker?: Marker): void
        close(): void
        setContent(content: string): void
      }

      class MarkerImage {
        constructor(src: string, size: Size, options?: { offset?: Point })
      }

      namespace event {
        function addListener(
          target: Marker,
          type: 'click',
          handler: () => void,
        ): void
      }
    }
  }

  interface Window {
    kakao?: typeof kakao
  }
}

export {}
