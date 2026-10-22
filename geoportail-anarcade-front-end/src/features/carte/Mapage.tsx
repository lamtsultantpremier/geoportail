// import { Download, Search } from 'lucide-react'
import FilterSidebar from '../filters/FilterSidebar'
import MapView from './MapView'
import { useFilters } from '../filters/useFilters'

import SearchBox from '../search/SearchBox'
import ExportMenu from './ExportMenu'


import ParcelPanel from '../parcels/ParcelPanel'
import { useUi } from '../../lib/store'

import { useFilterLabels } from '../filters/useGeoOptions'

import { useParcelStats } from '../parcels/useParcelStats'
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

export default function MapPage() {

  
  const { filters,isFiltered } = useFilters()

  
  const labels = useFilterLabels(filters)

  const stats = useParcelStats(filters)
  const fmtInt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
  const { selectedId } = useUi()
  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-6 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-normal">Explorer les parcelles</h1>
          <p className="text-sm text-muted">
            Anacarde en Côte d'Ivoire
                {labels.region && ` / ${labels.region}`}
                {labels.department && ` / ${labels.department}`}
          </p>
        </div>

          <SearchBox />

        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
            <ExportMenu filters={filters} />
        </button>
      </div>

      <div className={
            selectedId
            ? 'grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_360px]'
            : 'grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]'}>
        <FilterSidebar />

        <section>
          <div className="mb-3 flex items-baseline gap-3 text-sm">
            {stats.isError ? (
              <span className="text-red-700">Impossible de charger les compteurs.</span>
            ) : (
            <>
              <strong className={`font-semibold ${stats.isFetching ? 'opacity-50' : ''}`}>
                {stats.data ? fmtInt(stats.data.parcelles) : '…'} parcelles ·{' '}
                {stats.data ? fmtInt(stats.data.exploitants) : '…'} exploitants
            </strong>
            <span className="text-muted">
            {stats.data ? fmt(stats.data.hectares) : '…'} ha
            </span>
            </>)}
        </div>
          <div className="h-[560px] overflow-hidden rounded-2xl border border-line bg-white">
              <MapView filters={filters} isFiltered={isFiltered} />
          </div>
        </section>
        <ParcelPanel/>
      </div>
    </div>
  )
}