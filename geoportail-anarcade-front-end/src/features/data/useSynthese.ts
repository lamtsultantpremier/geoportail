import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'

export interface Synthese {
  indicateurs: { parcelles: number; exploitants: number; hectares: number; superficie_moyenne: number }
  qualite: {
    parcelles: number; sans_superficie: number; sans_enqueteur: number; sans_geometrie: number
    exploitants: number; sans_contact: number; sans_nom: number; sans_menage: number
  }
  validation: { correctes: number; incorrectes: number; taux: number }
}

export function useSynthese(filters: Filters) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['donnees-synthese', params],
    queryFn: ({ signal }) => apiGet<Synthese>('/donnees/synthese/', params, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}