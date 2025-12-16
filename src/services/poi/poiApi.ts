import type { LifestylePoi } from '@/types/poi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export interface PoiQueryParams {
  category: string
  radius: number
  time: string
  anchorLat?: number
  anchorLng?: number
}

export interface PoiApiResponse {
  items: LifestylePoi[]
  total: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL가 설정되지 않았습니다.')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`API 요청 실패 (${response.status})`)
  }

  return response.json() as Promise<T>
}

export async function fetchPois(query: PoiQueryParams, signal?: AbortSignal) {
  const params = new URLSearchParams()

  params.set('category', query.category)
  params.set('radius', String(query.radius))
  params.set('time', query.time)

  if (typeof query.anchorLat === 'number' && typeof query.anchorLng === 'number') {
    params.set('anchorLat', String(query.anchorLat))
    params.set('anchorLng', String(query.anchorLng))
  }

  return request<PoiApiResponse>(`/api/pois?${params.toString()}`, { signal })
}

export async function fetchPoiById(poiId: string, signal?: AbortSignal) {
  return request<LifestylePoi>(`/api/pois/${poiId}`, { signal })
}
