import { useFilters } from '../filters/useFilters'
import { useGeoOptions, type GeoOption } from '../filters/useGeoOptions'

function Select({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  options?: GeoOption[]; placeholder: string
}) {
  return (
    <label className="block min-w-[180px]">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
      >
        <option value="">{placeholder}</option>
        {options?.map((o) => <option key={o.id} value={String(o.id)}>{o.nom}</option>)}
      </select>
    </label>
  )
}

export default function DataFilters() {
  const { filters, setFilters, reset, isFiltered } = useFilters()
  const regions = useGeoOptions('regions')
  const departments = useGeoOptions('departements', { region_id: filters.region || undefined })
  const subPrefs = useGeoOptions('sous-prefectures', {
    region_id: filters.region || undefined,
    departement_id: filters.department || undefined,
  })

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-white p-4">
      <Select label="Région" placeholder="Toutes les régions" value={filters.region}
        options={regions.data}
        onChange={(v) => setFilters({ ...filters, region: v, department: '', subPrefecture: '', locality: '' })} />
      <Select label="Département" placeholder="Tous les départements" value={filters.department}
        options={departments.data}
        onChange={(v) => setFilters({ ...filters, department: v, subPrefecture: '', locality: '' })} />
      <Select label="Sous-préfecture" placeholder="Toutes les sous-préfectures" value={filters.subPrefecture}
        options={subPrefs.data}
        onChange={(v) => setFilters({ ...filters, subPrefecture: v, locality: '' })} />
      {isFiltered && (
        <button onClick={reset} className="pb-2 text-xs text-brand-600 underline">Réinitialiser</button>
      )}
    </div>
  )
}