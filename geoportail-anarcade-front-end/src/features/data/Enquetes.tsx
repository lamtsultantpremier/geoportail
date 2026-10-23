import { useMemo } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { titleCase } from '../../lib/format'
import { useFilters } from '../filters/useFilters'
import { useEnquetes } from './useEnquetes'

const nf = new Intl.NumberFormat('fr-FR')
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

const PAL = ['#2563eb', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4',
  '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#e11d48']

const monthLong = (m: string) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(`${m}-01T00:00:00`))
const monthShort = (m: string) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(new Date(`${m}-01T00:00:00`))

function Card({ title, subtitle, insight, busy, children }: {
  title: string; subtitle: string; insight?: string; busy: boolean; children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
      <div className={`mt-4 ${busy ? 'opacity-60' : ''}`}>{children}</div>
      {insight && <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[13px] leading-snug">{insight}</p>}
    </section>
  )
}

export default function Enquetes() {
  const { filters } = useFilters()
  const { data, isFetching, isError } = useEnquetes(filters)

  const mois = data?.par_mois ?? []
  const enqueteurs = data?.enqueteurs ?? []
  const resume = data?.resume
  const totalParcelles = resume?.parcelles_avec_enqueteur ?? 0

  const top10 = useMemo(
    () => enqueteurs.slice(0, 10).map((e) => ({
      ...e,
      name: titleCase(e.nom) || e.code || `Enquêteur ${e.id}`,
    })),
    [enqueteurs],
  )

  const pic = mois.reduce((best, m) => (m.enquetes > (best?.enquetes ?? -1) ? m : best), mois[0])
  const top5 = enqueteurs.slice(0, 5).reduce((s, e) => s + e.parcelles, 0)

  if (isError) {
    return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Impossible de charger le suivi des enquêtes.</p>
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          busy={isFetching}
          title="Enquêtes par mois"
          subtitle="Rythme de l'activité de terrain. Les dates d'enquête invalides sont ignorées."
          insight={pic && resume
            ? `${nf.format(resume.enquetes)} enquêtes au total, avec un pic en ${monthLong(pic.mois)} (${nf.format(pic.enquetes)}). Les mois à zéro signalent des interruptions de collecte à expliquer.`
            : undefined}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mois} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEnq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e6df" />
                <XAxis dataKey="mois" tickLine={false} minTickGap={24}
                  tickFormatter={monthShort} tick={{ fontSize: 11, fill: '#6b766f' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b766f' }}
                  tickFormatter={(v) => nf.format(v)} />
                <Tooltip labelFormatter={(m) => monthLong(String(m))}
                  formatter={(v) => [nf.format(Number(v)), 'Enquêtes']} />
                <Area type="monotone" dataKey="enquetes" stroke="#2563eb" strokeWidth={2.5}
                  fill="url(#gEnq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {mois.length === 0 && !isFetching && (
            <p className="text-center text-sm text-muted">Aucune enquête datée pour ces filtres.</p>
          )}
        </Card>

        <Card
          busy={isFetching}
          title="Parcelles par enquêteur"
          subtitle="Les 10 enquêteurs qui ont relevé le plus de parcelles."
          insight={totalParcelles
            ? `${nf.format(resume!.enqueteurs)} enquêteurs ont relevé ${nf.format(totalParcelles)} parcelles, soit ${nf1.format(totalParcelles / resume!.enqueteurs)} en moyenne. Les 5 premiers en ont relevé ${nf1.format((100 * top5) / totalParcelles)} % : une forte concentration rend la collecte dépendante de quelques personnes.`
            : undefined}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e3e6df" />
                <XAxis type="number" tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fill: '#6b766f' }} tickFormatter={(v) => nf.format(v)} />
                <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fill: '#1c2a22' }}
                  tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  formatter={(v) => [nf.format(Number(v)), 'Parcelles']} />
                <Bar dataKey="parcelles" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {top10.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                  <LabelList dataKey="parcelles" position="right" fontSize={11} fill="#1c2a22"
                    formatter={(v: number) => nf.format(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-sm font-semibold">Détail par enquêteur</h2>
        <p className="mt-1 text-[13px] text-muted">
          Les {enqueteurs.length} premiers enquêteurs selon le nombre de parcelles relevées.
        </p>
        <div className={`mt-4 max-h-[420px] overflow-auto rounded-xl border border-line ${isFetching ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 bg-brand-50 text-left text-[12px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Enquêteur</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Parcelles</th>
                <th className="px-4 py-3 font-semibold">Exploitants</th>
                <th className="px-4 py-3 font-semibold">Superficie (ha)</th>
                <th className="px-4 py-3 font-semibold">Part</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {enqueteurs.map((e, i) => {
                const part = totalParcelles ? (100 * e.parcelles) / totalParcelles : 0
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-2.5 font-medium">
                      <span className="mr-2 inline-block size-2.5 rounded-full"
                        style={{ background: PAL[i % PAL.length] }} />
                      {titleCase(e.nom) || <span className="italic text-muted">Nom non renseigné</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-muted">{e.code ?? '—'}</td>
                    <td className="px-4 py-2.5">{nf.format(e.parcelles)}</td>
                    <td className="px-4 py-2.5">{nf.format(e.exploitants)}</td>
                    <td className="px-4 py-2.5">{nf2.format(e.hectares)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-line">
                          <div className="h-full rounded-full" style={{ width: `${part}%`, background: PAL[i % PAL.length] }} />
                        </div>
                        <span className="w-12 text-[12px] text-muted">{nf1.format(part)} %</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {enqueteurs.length === 0 && !isFetching && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Aucun enquêteur pour ces filtres.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}