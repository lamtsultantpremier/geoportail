import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'

export interface Slice { label: string; exploitants: number }

export interface Profil {
  age: Slice[]
  instruction: Slice[]
  situation: Slice[]
  enfants: Slice[]
  enfants_moyenne: number | null
}

export function useProfil(filters: Filters) {
  const params = toApiParams(filters)
  return useQuery({
    queryKey: ['donnees-profil', params],
    queryFn: ({ signal }) => apiGet<Profil>('/donnees/profil/', params, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}