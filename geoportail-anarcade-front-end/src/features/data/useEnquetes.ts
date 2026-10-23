import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'

export interface EnquetesData {
  resume: { enquetes: number; enqueteurs: number; parcelles_avec_enqueteur: number }
  par_mois: { mois: string; enquetes: number }[]
  enqueteurs: {
    id: number
    nom: string | null
    code: string | null
    parcelles: number
    exploitants: number
    hectares: number
  }[]
}

export function useEnquetes(filters: Filters) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['donnees-enquetes', params],
    queryFn: ({ signal }) => apiGet<EnquetesData>('/donnees/enquetes/', params, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}