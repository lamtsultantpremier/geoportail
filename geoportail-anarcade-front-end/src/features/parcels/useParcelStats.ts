import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'

export interface ParcelStats {
  parcelles: number
  exploitants: number
  hectares: number
}

export function useParcelStats(filters: Filters) {
  return useQuery({
    queryKey: ['parcel-stats', filters],
    queryFn: ({ signal }) =>
      apiGet<ParcelStats>('/parcelles/stats/', toApiParams(filters), signal),
    placeholderData: keepPreviousData,   // garde l'ancien chiffre pendant le rechargement
  })
}