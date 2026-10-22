import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'

export interface SearchResult {
  id: number
  code: string
  nom: string | null
  prenom: string | null
  localite: string | null
  lng: number | null
  lat: number | null
}

export function useParcelSearch(q: string, filters: Filters) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['parcel-search', q, params],
    enabled: q.length >= 2,
    queryFn: ({ signal }) =>
      apiGet<{ results: SearchResult[] }>('/parcelles/recherche/', { ...params, q }, signal),
    staleTime: 1000 * 60,
  })
}