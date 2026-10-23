import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'

export type Niveau = 'region' | 'departement' | 'sous_prefecture' | 'localite'

export interface RepartitionRow {
  id: number | null
  nom: string | null
  parcelles: number
  exploitants: number
  hectares: number
}

export interface Repartition {
  niveau: Niveau
  libelle: string
  rows: RepartitionRow[]
}

export function useRepartition(filters: Filters) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['donnees-repartition', params],
    queryFn: ({ signal }) => apiGet<Repartition>('/donnees/repartition/', params, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}