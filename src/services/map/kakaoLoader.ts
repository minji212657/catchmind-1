type KakaoMaps = typeof kakao.maps

let kakaoMapsPromise: Promise<KakaoMaps> | null = null

export function loadKakaoMapsSdk(): Promise<KakaoMaps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 지도를 불러올 수 있습니다.'))
  }

  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao.maps)
  }

  if (kakaoMapsPromise) {
    return kakaoMapsPromise
  }

  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY

  if (!appKey) {
    return Promise.reject(
      new Error('VITE_KAKAO_MAP_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.'),
    )
  }

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${appKey}`
    script.onload = () => {
      if (!window.kakao?.maps) {
        kakaoMapsPromise = null
        reject(new Error('Kakao Maps SDK가 로드되지 않았습니다.'))
        return
      }

      window.kakao.maps.load(() => resolve(window.kakao!.maps))
    }
    script.onerror = () => {
      kakaoMapsPromise = null
      reject(new Error('Kakao Maps SDK 스크립트 로딩에 실패했습니다.'))
    }

    document.head.appendChild(script)
  })

  return kakaoMapsPromise
}
