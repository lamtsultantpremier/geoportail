import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { BASE } from '../../lib/api'
import { toApiParams, type Filters } from '../filters/useFilters'
import { useParcelStats } from '../parcels/useParcelStats'

const fmtInt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

export default function ExportMenu({ filters }: { filters: Filters }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const stats = useParcelStats(filters)
  const count = stats.data?.parcelles ?? 0

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const href = (fmt: 'csv' | 'geojson') =>
    `${BASE}/parcelles/export/?${new URLSearchParams({ ...toApiParams(filters), fmt })}`

  const itemCls = 'flex items-start gap-3 px-4 py-3 text-left hover:bg-canvas'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={count === 0}
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={16} /> Exporter les résultats <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          <div className="border-b border-line px-4 py-2.5 text-[12px] text-muted">
            {fmtInt(count)} parcelles selon les filtres actuels
          </div>

          <a href={href('csv')} download onClick={() => setOpen(false)} className={itemCls}>
            <FileSpreadsheet size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>
              <span className="block text-[13px] font-medium">Tableur (CSV)</span>
              <span className="block text-[11px] text-muted">
                Toutes les parcelles, avec exploitant, enquêteur et localisation. S'ouvre dans Excel.
              </span>
            </span>
          </a>

          <a href={href('geojson')} download onClick={() => setOpen(false)} className={`${itemCls} border-t border-line`}>
            <FileJson size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>
              <span className="block text-[13px] font-medium">Données SIG (GeoJSON)</span>
              <span className="block text-[11px] text-muted">
                Avec les contours, pour QGIS. Limité à 5 000 parcelles : affinez les filtres au-delà.
              </span>
            </span>
          </a>
        </div>
      )}
    </div>
  )
}