import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'


export type Bbox = [number, number, number, number] // ouest, sud, est, nord
export type PointRow = [number, string, number, number]

export interface PointsResponse {
  count: number
  points: PointRow[]
}

export interface PolygonsResponse extends GeoJSON.FeatureCollection {
  truncated: boolean
}

export function useParcelPoints(filters: Filters) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['parcel-points', params],
    queryFn: ({ signal }) => apiGet<PointsResponse>('/parcelles/points/', params, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

export function useParcelPolygons(bbox: Bbox | null, filters: Filters, enabled: boolean) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['parcel-polygons', bbox, params],
    enabled: enabled && bbox !== null,
    queryFn: ({ signal }) =>
      apiGet<PolygonsResponse>('/parcelles/geojson/', { ...params, bbox: bbox!.join(',') }, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  })
}