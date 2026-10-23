import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'

export interface Structure {
  superficie: { label: string; parcelles: number }[]
  parcelles_par_exploitant: { label: string; exploitants: number }[]
  age_vergers: { label: string; parcelles: number }[]
  foncier: { label: string; parcelles: number; hectares: number }[]
}

export function useStructure(filters: Filters) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['donnees-structure', params],
    queryFn: ({ signal }) => apiGet<Structure>('/donnees/structure/', params, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}