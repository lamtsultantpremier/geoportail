import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, MousePointerClick } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { titleCase } from '../../lib/format'
import { useFilters, type Filters } from '../filters/useFilters'
import { useRepartition, type Niveau, type RepartitionRow } from './useRepartition'

const nf = new Intl.NumberFormat('fr-FR')
const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const MAX_BARS = 12
const DARK = '#1f6b45'
const LIGHT = '#b7dcc1'

type Metric = 'volume' | 'hectares'
type SortKey = 'nom' | 'parcelles' | 'exploitants' | 'hectares'

// Quel filtre fixer quand on clique sur une zone
const DRILL: Record<Niveau, ((f: Filters, id: string) => Filters) | null> = {
  region: (f, id) => ({ ...f, region: id, department: '', subPrefecture: '', locality: '' }),
  departement: (f, id) => ({ ...f, department: id, subPrefecture: '', locality: '' }),
  sous_prefecture: (f, id) => ({ ...f, subPrefecture: id, locality: '' }),
  localite: null,
}

const label = (r: RepartitionRow) => (r.nom ? titleCase(r.nom) : 'Non rattaché')

export default function Repartition() {
  const { filters, setFilters } = useFilters()
  const { data, isFetching, isError } = useRepartition(filters)
  const [metric, setMetric] = useState<Metric>('volume')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'parcelles', dir: -1 })

  const rows = data?.rows ?? []
  const total = rows.reduce((s, r) => s + r.parcelles, 0)
  const drill = data ? DRILL[data.niveau] : null

  const pick = (row?: RepartitionRow) => {
    if (row?.id != null && drill) setFilters(drill(filters, String(row.id)))
  }

  const chartData = useMemo(
    () => rows.slice(0, MAX_BARS).map((r) => ({ ...r, name: label(r) })),
    [rows],
  )

  const sorted = useMemo(() => {
    const { key, dir } = sort
    return [...rows].sort((a, b) =>
      key === 'nom' ? dir * label(a).localeCompare(label(b), 'fr') : dir * (a[key] - b[key]),
    )
  }, [rows, sort])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'nom' ? 1 : -1 }))

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key !== k ? <ArrowUpDown size={12} className="opacity-40" />
      : sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />

  const th = 'px-4 py-3 text-left'
  const btn = (k: SortKey, text: string) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1.5 font-semibold">
      {text} <SortIcon k={k} />
    </button>
  )

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Répartition par {data ? data.libelle.toLowerCase() : 'zone'}
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Où se concentrent les parcelles et les producteurs.
            {drill && (
              <span className="ml-1 inline-flex items-center gap-1 text-brand-700">
                <MousePointerClick size={12} /> Cliquez sur une barre pour zoomer sur la zone.
              </span>
            )}
          </p>
        </div>

        <div className="flex rounded-lg border border-line p-0.5 text-xs font-medium">
          {([['volume', 'Parcelles et exploitants'], ['hectares', 'Superficie (ha)']] as const).map(([k, t]) => (
            <button
              key={k}
              onClick={() => setMetric(k)}
              className={`rounded-md px-3 py-1.5 ${metric === k ? 'bg-brand-600 text-white' : 'text-muted hover:text-ink'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Impossible de charger la répartition.</p>}

      <div className={`mt-4 h-[360px] ${isFetching ? 'opacity-60' : ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e6df" />
            <XAxis
              dataKey="name" interval={0} height={70} tickLine={false}
              angle={-30} textAnchor="end" tick={{ fontSize: 11, fill: '#6b766f' }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b766f' }}
              tickFormatter={(v) => nf.format(v)} />
            <Tooltip
              cursor={{ fill: 'rgba(31,107,69,0.06)' }}
              formatter={(v, name) => [metric === 'hectares' ? `${nf2.format(Number(v))} ha` : nf.format(Number(v)), name]}
            />
            <Legend verticalAlign="top" align="right" iconType="square" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
            {metric === 'volume' ? (
              <>
                <Bar dataKey="parcelles" name="Parcelles" fill={DARK} radius={[3, 3, 0, 0]}
                  cursor={drill ? 'pointer' : 'default'} onClick={(d: any) => pick(d?.payload ?? d)} />
                <Bar dataKey="exploitants" name="Exploitants" fill={LIGHT} radius={[3, 3, 0, 0]}
                  cursor={drill ? 'pointer' : 'default'} onClick={(d: any) => pick(d?.payload ?? d)} />
              </>
            ) : (
              <Bar dataKey="hectares" name="Superficie (ha)" fill={DARK} radius={[3, 3, 0, 0]}
                cursor={drill ? 'pointer' : 'default'} onClick={(d: any) => pick(d?.payload ?? d)} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {rows.length > MAX_BARS && (
        <p className="text-[12px] text-muted">
          Le graphique montre les {MAX_BARS} premières zones sur {rows.length}. Le tableau les liste toutes.
        </p>
      )}

      <div className="mt-5 max-h-[420px] overflow-auto rounded-xl border border-line">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="sticky top-0 bg-brand-50 text-[12px]">
            <tr>
              <th className={th}>{btn('nom', data?.libelle ?? 'Zone')}</th>
              <th className={th}>{btn('parcelles', 'Parcelles')}</th>
              <th className={th}>{btn('exploitants', 'Exploitants')}</th>
              <th className={th}>{btn('hectares', 'Superficie (ha)')}</th>
              <th className={th}>Part des parcelles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((r, i) => {
              const part = total ? (100 * r.parcelles) / total : 0
              const clickable = drill && r.id != null
              return (
                <tr key={r.id ?? `n${i}`} className={clickable ? 'cursor-pointer hover:bg-canvas/60' : ''}
                  onClick={() => pick(r)}>
                  <td className="px-4 py-2.5 font-medium">
                    {r.nom ? label(r) : <span className="italic text-muted">Non rattaché</span>}
                  </td>
                  <td className="px-4 py-2.5">{nf.format(r.parcelles)}</td>
                  <td className="px-4 py-2.5">{nf.format(r.exploitants)}</td>
                  <td className="px-4 py-2.5">{nf2.format(r.hectares)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-brand-600" style={{ width: `${part}%` }} />
                      </div>
                      <span className="w-12 text-[12px] text-muted">{nf2.format(part)} %</span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && !isFetching && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Aucune donnée pour ces filtres.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}