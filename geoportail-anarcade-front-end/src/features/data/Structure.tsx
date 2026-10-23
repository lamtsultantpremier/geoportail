import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useFilters } from '../filters/useFilters'
import { useStructure } from './useStructure'

const nf = new Intl.NumberFormat('fr-FR')
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

// Palettes vives, une par graphique
const PAL_TAILLE = ['#06b6d4', '#2563eb', '#8b5cf6', '#ec4899', '#ef4444']
const PAL_EXPL = ['#f59e0b', '#fb7185', '#a855f7', '#3b82f6', '#14b8a6']
const PAL_AGE = ['#22d3ee', '#facc15', '#fb923c', '#e11d48']
const PAL_FONCIER = ['#2563eb', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444']

function Card({ title, subtitle, insight, children, busy }: {
  title: string; subtitle: string; insight?: string; children: React.ReactNode; busy: boolean
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
      <div className={`mt-4 ${busy ? 'opacity-60' : ''}`}>{children}</div>
      {insight && (
        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[13px] leading-snug">{insight}</p>
      )}
    </section>
  )
}

function ColorBars({ data, dataKey, palette, unit }: {
  data: { label: string }[]; dataKey: string; palette: string[]; unit: string
}) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e6df" />
          <XAxis dataKey="label" tickLine={false} interval={0} tick={{ fontSize: 11, fill: '#6b766f' }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b766f' }}
            tickFormatter={(v) => nf.format(v)} />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            formatter={(v) => [nf.format(Number(v)), unit]} />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={64}>
            {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            <LabelList dataKey={dataKey} position="top" fontSize={11} fill="#1c2a22"
              formatter={(v: number) => nf.format(v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Structure() {
  const { filters } = useFilters()
  const { data, isFetching, isError } = useStructure(filters)

  if (isError) {
    return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Impossible de charger la structure des exploitations.</p>
  }

  const sup = data?.superficie ?? []
  const supTotal = sup.reduce((s, r) => s + r.parcelles, 0)
  const petites = sup.slice(0, 2).reduce((s, r) => s + r.parcelles, 0)
  const grandes = sup[4]?.parcelles ?? 0

  const expl = data?.parcelles_par_exploitant ?? []
  const explTotal = expl.reduce((s, r) => s + r.exploitants, 0)
  const unique = expl[0]?.exploitants ?? 0

  const age = data?.age_vergers ?? []
  const ageTotal = age.reduce((s, r) => s + r.parcelles, 0)
  const vieux = age[3]?.parcelles ?? 0
  const jeunes = age[0]?.parcelles ?? 0

  const foncier = data?.foncier ?? []
  const foncierTotal = foncier.reduce((s, r) => s + r.parcelles, 0)

  const pct = (n: number, t: number) => (t ? nf1.format((100 * n) / t) : '0')

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          busy={isFetching}
          title="Taille des parcelles"
          subtitle="Nombre de parcelles par classe de superficie."
          insight={supTotal
            ? `${pct(petites, supTotal)} % des parcelles font moins de 3 ha ; ${pct(grandes, supTotal)} % dépassent 10 ha.`
            : undefined}
        >
          <ColorBars data={sup} dataKey="parcelles" palette={PAL_TAILLE} unit="Parcelles" />
        </Card>

        <Card
          busy={isFetching}
          title="Parcelles par exploitant"
          subtitle="Nombre d'exploitants selon le nombre de parcelles qu'ils exploitent."
          insight={explTotal
            ? `${pct(unique, explTotal)} % des exploitants n'ont qu'une seule parcelle.`
            : undefined}
        >
          <ColorBars data={expl} dataKey="exploitants" palette={PAL_EXPL} unit="Exploitants" />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          busy={isFetching}
          title="Âge des vergers"
          subtitle="Parcelles par ancienneté de plantation."
          insight={ageTotal
            ? `${pct(vieux, ageTotal)} % des vergers ont plus de 30 ans : candidats au renouvellement, car leur rendement baisse. ${pct(jeunes, ageTotal)} % ont moins de 5 ans.`
            : undefined}
        >
          <ColorBars data={age} dataKey="parcelles" palette={PAL_AGE} unit="Parcelles" />
        </Card>

        <Card
          busy={isFetching}
          title="Statut foncier"
          subtitle="Comment les parcelles sont exploitées."
          insight={foncier.length > 1
            ? 'Les catégories minoritaires (fermage, métayage, planter-partager) concernent des producteurs sans titre de propriété : ils investissent souvent moins dans la durée.'
            : undefined}
        >
          <ul className="space-y-3">
            {foncier.map((f, i) => {
              const part = foncierTotal ? (100 * f.parcelles) / foncierTotal : 0
              const color = PAL_FONCIER[i % PAL_FONCIER.length]
              return (
                <li key={f.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="size-2.5 rounded-full" style={{ background: color }} />
                      {f.label}
                    </span>
                    <span className="text-muted">
                      <strong className="text-ink">{nf.format(f.parcelles)}</strong> parcelles · {nf1.format(part)} %
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(part, 0.6)}%`, background: color }} />
                  </div>
                </li>
              )
            })}
            {foncier.length === 0 && <li className="text-sm text-muted">Aucune donnée.</li>}
          </ul>
        </Card>
      </div>
    </>
  )
}