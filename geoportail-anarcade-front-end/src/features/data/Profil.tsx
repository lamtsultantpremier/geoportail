import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { titleCase } from '../../lib/format'
import { useFilters } from '../filters/useFilters'
import { useProfil, type Slice } from './useProfil'


const nf = new Intl.NumberFormat('fr-FR')
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const PAL_AGE = ['#06b6d4', '#3b82f6', '#a855f7', '#f43f5e']
const PAL_INSTR = ['#f97316', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6', '#eab308', '#ef4444']
const PAL_SIT = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#3b82f6', '#22c55e']
const PAL_ENF = ['#f43f5e']

const pct = (n: number, t: number) => (t ? nf1.format((100 * n) / t) : '0')
const sum = (l: Slice[]) => l.reduce((s, r) => s + r.exploitants, 0)

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

function Columns({ data, palette }: { data: Slice[]; palette: string[] }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e6df" />
          <XAxis dataKey="label" tickLine={false} interval={0} tick={{ fontSize: 11, fill: '#6b766f' }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b766f' }}
            tickFormatter={(v) => nf.format(v)} />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            formatter={(v) => [nf.format(Number(v)), 'Exploitants']} />
          <Bar dataKey="exploitants" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            <LabelList dataKey="exploitants" position="top" fontSize={11} fill="#1c2a22"
              formatter={(v: number) => nf.format(v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Donut({ data }: { data: Slice[] }) {
  const total = sum(data)
  const rows = data.map((d) => ({ ...d, name: titleCase(d.label) }))
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="exploitants" nameKey="name" innerRadius={60} outerRadius={95}
            paddingAngle={2} stroke="#fff" strokeWidth={2}>
            {rows.map((_, i) => <Cell key={i} fill={PAL_INSTR[i % PAL_INSTR.length]} />)}
          </Pie>
          <Tooltip formatter={(v, n) => [`${nf.format(Number(v))} (${pct(Number(v), total)} %)`, n]} />
          <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle"
            wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function HBars({ data, palette }: { data: Slice[]; palette: string[] }) {
  const total = sum(data)
  const rows = data.map((d) => ({ ...d, name: titleCase(d.label) }))
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const part = total ? (100 * r.exploitants) / total : 0
        const color = palette[i % palette.length]
        return (
          <li key={r.name}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="flex items-center gap-2 font-medium">
                <span className="size-2.5 rounded-full" style={{ background: color }} />{r.name}
              </span>
              <span className="text-muted">
                <strong className="text-ink">{nf.format(r.exploitants)}</strong> · {nf1.format(part)} %
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full" style={{ width: `${Math.max(part, 0.6)}%`, background: color }} />
            </div>
          </li>
        )
      })}
      {rows.length === 0 && <li className="text-sm text-muted">Aucune donnée.</li>}
    </ul>
  )
}

export default function Profil() {
  const { filters } = useFilters()
  const { data, isFetching, isError } = useProfil(filters)

  if (isError) {
    return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Impossible de charger le profil des exploitants.</p>
  }

  const age = data?.age ?? []
  const ageTotal = sum(age)
  const seniors = age[3]?.exploitants ?? 0
  const jeunes = age[0]?.exploitants ?? 0

  const instr = data?.instruction ?? []
  const instrTotal = sum(instr)
  const analpha = instr
    .filter((i) => /analphab/i.test(i.label))
    .reduce((s, i) => s + i.exploitants, 0)

  const enfants = data?.enfants ?? []

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card busy={isFetching} title="Âge des exploitants"
          subtitle="Exploitants par tranche d'âge. Les dates de naissance invalides sont ignorées."
          insight={ageTotal
            ? `${pct(seniors, ageTotal)} % des exploitants ont 60 ans. Seuls ${pct(jeunes, ageTotal)} % ont moins de 30 ans.`
            : undefined}>
          <Columns data={age} palette={PAL_AGE} />
        </Card>

        <Card busy={isFetching} title="Niveau d'instruction"
          subtitle="Répartition des exploitants selon leur niveau d'études."
          insight={instrTotal
            ? `${pct(analpha, instrTotal)} % des exploitants sont analphabètes.`
            : undefined}>
          <Donut data={instr} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card busy={isFetching} title="Situation matrimoniale"
          subtitle="Répartition des exploitants.">
          <HBars data={data?.situation ?? []} palette={PAL_SIT} />
        </Card>

        <Card busy={isFetching} title="Taille du ménage"
          subtitle="Exploitants selon le nombre d'enfants du ménage."
          insight={data?.enfants_moyenne != null
            ? `Un ménage compte en moyenne ${nf1.format(data.enfants_moyenne)} enfants.`
            : undefined}>
          <Columns data={enfants} palette={PAL_ENF} />
        </Card>
      </div>
    </>
  )
}