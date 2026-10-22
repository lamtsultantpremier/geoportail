import { useState } from 'react'
import { Filter, SlidersHorizontal, Sprout } from 'lucide-react'
import { EMPTY_FILTERS, toApiParams, useFilters, type Filters } from './useFilters'
import { useGeoOptions, type GeoOption } from './useGeoOptions'
import { useUi } from '../../lib/store'

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1.5 mt-4 block text-xs text-muted">{children}</label>
)

const selectCls = 'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm'

function FilterSelect({ label, value, onChange, options, loading, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  options?: GeoOption[]
  loading: boolean
  placeholder: string
}) {
  return (
    <>
      <Label>{label}</Label>
      <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{loading ? 'Chargement…' : placeholder}</option>
        {options?.map((o) => (
          <option key={o.id} value={String(o.id)}>{o.nom}</option>
        ))}
      </select>
    </>
  )
}

export default function FilterSidebar() {
  const { filters, setFilters, reset } = useFilters()
  const [draft, setDraft] = useState<Filters>(filters)
  const { layers, toggleLayer } = useUi()

  // Chaque liste dépend des choix faits au-dessus d'elle
  const { region_id, departement_id, sous_prefecture_id } = toApiParams(draft)
  const regions = useGeoOptions('regions')
  const departments = useGeoOptions('departements', { region_id })
  const subPrefs = useGeoOptions('sous-prefectures', { region_id, departement_id })
  const localities = useGeoOptions('localites', { region_id, departement_id, sous_prefecture_id })

  const set = (patch: Partial<Filters>) => setDraft({ ...draft, ...patch })

  const layerList = [
    { key: 'parcels', label: "Parcelles d'anacarde", sub: 'Données validées' },
    { key: 'admin', label: 'Limites administratives', sub: 'Régions et départements' },
    { key: 'protected', label: 'Zones protégées', sub: 'Illustratif (démo)' },
    { key: 'base', label: 'Fond de carte', sub: 'Schématique' },
  ]

  return (
    <aside className="h-fit rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <SlidersHorizontal size={16} /> Filtres
        </span>
        <button
          onClick={() => { reset(); setDraft(EMPTY_FILTERS) }}
          className="text-xs text-brand-600"
        >
          Réinitialiser
        </button>
      </div>

      {regions.isError && (
        <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
          Impossible de joindre l'API. Le serveur Django est-il lancé ?
        </p>
      )}

      <FilterSelect
        label="Région" placeholder="Toutes les régions"
        value={draft.region} options={regions.data} loading={regions.isLoading}
        onChange={(v) => set({ region: v, department: '', subPrefecture: '', locality: '' })}
      />
      <FilterSelect
        label="Département" placeholder="Tous les départements"
        value={draft.department} options={departments.data} loading={departments.isLoading}
        onChange={(v) => set({ department: v, subPrefecture: '', locality: '' })}
      />
      <FilterSelect
        label="Sous-préfecture" placeholder="Toutes les sous-préfectures"
        value={draft.subPrefecture} options={subPrefs.data} loading={subPrefs.isLoading}
        onChange={(v) => set({ subPrefecture: v, locality: '' })}
      />
      <FilterSelect
        label="Localité" placeholder="Toutes les localités"
        value={draft.locality} options={localities.data} loading={localities.isLoading}
        onChange={(v) => set({ locality: v })}
      />

      <Label>Superficie (ha)</Label>
      <div className="flex gap-2">
        <input type="number" className={selectCls} value={draft.min}
          onChange={(e) => set({ min: Number(e.target.value) })} />
        <input type="number" className={selectCls} value={draft.max}
          onChange={(e) => set({ max: Number(e.target.value) })} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Sprout size={14} className="text-brand-600" /> Culture
        <span className="rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">Anacarde</span>
      </div>

      <button
        onClick={() => setFilters(draft)}
        className="mt-5 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        <Filter size={16} /> Appliquer les filtres
      </button>

      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-3 flex justify-between text-sm">
          <span className="font-medium">Couches SIG</span>
          <span className="text-xs text-muted">{layerList.length} couches</span>
        </div>
        {layerList.map((l) => (
          <label key={l.key} className="mb-3 flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 accent-[#1f6b45]"
              checked={layers[l.key]} onChange={() => toggleLayer(l.key)} />
            <span className="text-sm leading-tight">
              {l.label}
              <span className="block text-xs text-muted">{l.sub}</span>
            </span>
          </label>
        ))}
      </div>
    </aside>
  )
}