import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react'
import { titleCase } from '../../lib/format'
import { useFilters } from '../filters/useFilters'
import { useRecapitulatif, type RecapMetrics, type RecapRow } from './useRecapitulatif'

const nf = new Intl.NumberFormat('fr-FR')
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

type SortKey =
  | 'nom' | 'parcelles' | 'exploitants' | 'hectares' | 'moyenne'
  | 'ratio' | 'p_enqueteur' | 'p_superficie' | 'p_contact'

const pct = (n: number, t: number) => (t ? (100 * n) / t : 0)

// Valeurs dérivées d'une ligne
const derive = (m: RecapMetrics) => ({
  ratio: m.exploitants ? m.parcelles / m.exploitants : 0,
  p_enqueteur: pct(m.sans_enqueteur, m.parcelles),
  p_superficie: pct(m.sans_superficie, m.parcelles),
  p_contact: pct(m.sans_contact, m.exploitants),
})

const label = (r: RecapRow) => (r.nom ? titleCase(r.nom) : 'Non rattaché')

// Proportion de données manquantes : vert faible, orange moyen, rouge élevé
function Missing({ value }: { value: number }) {
  const tone =
    value < 5 ? 'bg-emerald-100 text-emerald-800'
      : value < 20 ? 'bg-amber-100 text-amber-800'
        : 'bg-rose-100 text-rose-700'
  return (
    <span className={`inline-block min-w-14 rounded-md px-2 py-0.5 text-center text-[12px] font-medium ${tone}`}>
      {nf1.format(value)} %
    </span>
  )
}

// CSV lisible par Excel français : BOM, séparateur ;, virgule décimale
function exportCsv(libelle: string, rows: RecapRow[], total: RecapMetrics) {
  const head = [
    libelle, 'Parcelles', 'Exploitants', 'Superficie (ha)', 'Superficie moyenne (ha)',
    'Parcelles par exploitant', '% sans enquêteur', '% sans superficie', '% exploitants sans contact',
  ]
  const num = (n: number, d = 2) => n.toFixed(d).replace('.', ',')
  const cell = (v: string) => {
    const safe = /^[=+\-@]/.test(v) ? `'${v}` : v
    return `"${safe.replace(/"/g, '""')}"`
  }
  const line = (name: string, m: RecapMetrics) => {
    const d = derive(m)
    return [
      cell(name), m.parcelles, m.exploitants, num(m.hectares), num(m.moyenne),
      num(d.ratio), num(d.p_enqueteur, 1), num(d.p_superficie, 1), num(d.p_contact, 1),
    ].join(';')
  }
  const csv = '\ufeff' + [
    head.map(cell).join(';'),
    ...rows.map((r) => line(label(r), r)),
    line('Total', total),
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `recapitulatif_${libelle.toLowerCase().replace(/[^a-z]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export default function Recapitulatif() {
  const { filters } = useFilters()
  const { data, isFetching, isError } = useRecapitulatif(filters)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'parcelles', dir: -1 })

  const rows = data?.rows ?? []

  const sorted = useMemo(() => {
    const { key, dir } = sort
    const value = (r: RecapRow) =>
      key === 'nom' ? label(r)
        : key in r ? (r as unknown as Record<string, number>)[key]
          : (derive(r) as Record<string, number>)[key]
    return [...rows].sort((a, b) => {
      const x = value(a), y = value(b)
      return typeof x === 'string' ? dir * x.localeCompare(String(y), 'fr') : dir * (Number(x) - Number(y))
    })
  }, [rows, sort])

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'nom' ? 1 : -1 }))

  const Head = ({ k, children, right = true }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th className={`px-3 py-3 ${right ? 'text-right' : 'text-left'}`}>
      <button onClick={() => toggle(k)}
        className={`inline-flex items-center gap-1.5 font-semibold ${right ? 'flex-row-reverse' : ''}`}>
        {children}
        {sort.key !== k ? <ArrowUpDown size={12} className="opacity-40" />
          : sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      </button>
    </th>
  )

  if (isError) {
    return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Impossible de charger le tableau récapitulatif.</p>
  }

  const t = data?.total
  const td = t ? derive(t) : null

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Tableau récapitulatif par {data ? data.libelle.toLowerCase() : 'zone'}
          </h2>
          <p className="mt-1 max-w-3xl text-[13px] text-muted">
            Volumes et qualité des données pour chaque zone. Les pourcentages en
            orange ou rouge indiquent les zones où il manque le plus d'informations
            (enquêteur, superficie, contact) : ce sont les premières à compléter.
          </p>
        </div>
        <button
          onClick={() => data && exportCsv(data.libelle, sorted, data.total)}
          disabled={!data || rows.length === 0}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} /> Exporter en CSV
        </button>
      </div>

      <div className={`mt-4 max-h-[520px] overflow-auto rounded-xl border border-line ${isFetching ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[920px] text-sm">
          <thead className="sticky top-0 z-10 bg-brand-50 text-[12px]">
            <tr>
              <Head k="nom" right={false}>{data?.libelle ?? 'Zone'}</Head>
              <Head k="parcelles">Parcelles</Head>
              <Head k="exploitants">Exploitants</Head>
              <Head k="hectares">Superficie (ha)</Head>
              <Head k="moyenne">Moy. (ha)</Head>
              <Head k="ratio">Parc. / expl.</Head>
              <Head k="p_enqueteur">Sans enquêteur</Head>
              <Head k="p_superficie">Sans superficie</Head>
              <Head k="p_contact">Sans contact</Head>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((r, i) => {
              const d = derive(r)
              return (
                <tr key={r.id ?? `n${i}`} className="hover:bg-canvas/60">
                  <td className="px-3 py-2.5 font-medium">
                    {r.nom ? label(r) : <span className="italic text-muted">Non rattaché</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">{nf.format(r.parcelles)}</td>
                  <td className="px-3 py-2.5 text-right">{nf.format(r.exploitants)}</td>
                  <td className="px-3 py-2.5 text-right">{nf2.format(r.hectares)}</td>
                  <td className="px-3 py-2.5 text-right">{nf2.format(r.moyenne)}</td>
                  <td className="px-3 py-2.5 text-right">{nf2.format(d.ratio)}</td>
                  <td className="px-3 py-2.5 text-right"><Missing value={d.p_enqueteur} /></td>
                  <td className="px-3 py-2.5 text-right"><Missing value={d.p_superficie} /></td>
                  <td className="px-3 py-2.5 text-right"><Missing value={d.p_contact} /></td>
                </tr>
              )
            })}
            {rows.length === 0 && !isFetching && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted">Aucune donnée pour ces filtres.</td></tr>
            )}
          </tbody>
          {t && td && rows.length > 0 && (
            <tfoot className="sticky bottom-0 bg-white text-[13px] font-semibold shadow-[0_-1px_0_0_#e3e6df]">
              <tr>
                <td className="px-3 py-3">Total</td>
                <td className="px-3 py-3 text-right">{nf.format(t.parcelles)}</td>
                <td className="px-3 py-3 text-right">{nf.format(t.exploitants)}</td>
                <td className="px-3 py-3 text-right">{nf2.format(t.hectares)}</td>
                <td className="px-3 py-3 text-right">{nf2.format(t.moyenne)}</td>
                <td className="px-3 py-3 text-right">{nf2.format(td.ratio)}</td>
                <td className="px-3 py-3 text-right"><Missing value={td.p_enqueteur} /></td>
                <td className="px-3 py-3 text-right"><Missing value={td.p_superficie} /></td>
                <td className="px-3 py-3 text-right"><Missing value={td.p_contact} /></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="mt-3 text-[12px] text-muted">
        <span className="mr-3"><Missing value={2} /> moins de 5 % manquant</span>
        <span className="mr-3"><Missing value={10} /> de 5 à 20 %</span>
        <span><Missing value={30} /> plus de 20 %</span>
      </p>
    </section>
  )
}