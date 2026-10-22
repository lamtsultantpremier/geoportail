import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { parcels as mock } from '../../mocks/data'
import type { Filters } from '../filters/useFilters'

// Plus tard : remplacer par un vrai fetch('/api/parcels')
export function useFilteredParcels(f: Filters) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['parcels'],
    queryFn: async () => mock,
  })

  const parcels = useMemo(
    () =>
      data.filter(
      (p) => p.areaHa >= f.min && p.areaHa <= f.max),
      [data, f],
  )

  return { parcels, all: data, isLoading }
}