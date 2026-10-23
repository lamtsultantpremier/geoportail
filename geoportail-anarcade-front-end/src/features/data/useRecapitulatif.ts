import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'

export interface RecapMetrics {
  parcelles: number
  exploitants: number
  hectares: number
  moyenne: number
  sans_enqueteur: number
  sans_superficie: number
  sans_contact: number
}

export interface RecapRow extends RecapMetrics {
  id: number | null
  nom: string | null
}

export interface Recapitulatif {
  niveau: string
  libelle: string
  rows: RecapRow[]
  total: RecapMetrics
}

export function useRecapitulatif(filters: Filters) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['donnees-recap', params],
    queryFn: ({ signal }) => apiGet<Recapitulatif>('/donnees/recapitulatif/', params, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}