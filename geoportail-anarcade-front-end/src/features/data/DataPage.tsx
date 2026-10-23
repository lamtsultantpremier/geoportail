import { AlertTriangle, Layers, Ruler, Sprout, Users } from 'lucide-react'
import { useFilters } from '../filters/useFilters'
import DataFilters from './DataFilters'
import { useSynthese } from './useSynthese'
import Repartition from './Repartition'
import Structure from './Structure'
import Profil from './Profil'
import Enquetes from './Enquetes'
import Recapitulatif from './Recapitulatif'

const nf = new Intl.NumberFormat('fr-FR')
const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

function Kpi({ icon, label, value, unit, caption }: {
  icon: React.ReactNode; label: string; value?: string; unit?: string; caption: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
        <div className="mt-1 text-3xl font-medium leading-none">
          {value ?? '…'}{unit && <span className="ml-1 text-base text-muted">{unit}</span>}
        </div>
        <div className="mt-1.5 text-[12px] text-muted">{caption}</div>
      </div>
    </div>
  )
}

// Barre de complétude : plus c'est plein, mieux c'est
function Completeness({ label, missing, total }: { label: string; missing: number; total: number }) {
  const ok = total > 0 ? 100 * (1 - missing / total) : 0
  const tone = ok >= 95 ? 'bg-brand-600' : ok >= 80 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <li className="py-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-medium">{label}</span>
        <span className="text-muted">
          <strong className="font-semibold text-ink">{nf2.format(ok)} %</strong> complet · {nf.format(missing)} manquant{missing > 1 ? 's' : ''}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${ok}%` }} />
      </div>
    </li>
  )
}

export default function DataPage() {
  const { filters } = useFilters()
  const { data, isError, isFetching } = useSynthese(filters)
  const i = data?.indicateurs
  const q = data?.qualite
  const v = data?.validation

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-3xl font-normal">Données</h1>
        <p className="text-sm text-muted">
          Vue d'ensemble du registre des parcelles d'anacarde validées
        </p>
      </div>

      <DataFilters />

      {isError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Impossible de charger les données. Le serveur Django est-il lancé ?
        </p>
      )}

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isFetching ? 'opacity-60' : ''}`}>
        <Kpi icon={<Layers size={20} />} label="Parcelles validées"
          value={i && nf.format(i.parcelles)} caption="selon les filtres" />
        <Kpi icon={<Users size={20} />} label="Exploitants"
          value={i && nf.format(i.exploitants)}
          caption={i && i.exploitants ? `${nf2.format(i.parcelles / i.exploitants)} parcelle(s) en moyenne` : ' '} />
        <Kpi icon={<Sprout size={20} />} label="Superficie totale"
          value={i && nf2.format(i.hectares)} unit="ha" caption="culture anacarde" />
        <Kpi icon={<Ruler size={20} />} label="Superficie moyenne"
          value={i && nf2.format(i.superficie_moyenne)} unit="ha" caption="par parcelle" />
      </div>

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <h2 className="text-sm font-semibold">Fiabilité des données</h2>
        </div>
        <p className="text-[13px] text-muted">
          Ce qui manque dans le registre pour la zone sélectionnée. Un taux bas signale
          où il faut compléter ou refaire des enquêtes avant de s'appuyer sur les chiffres.
        </p>

        <div className="mt-4 grid gap-x-10 lg:grid-cols-2">
          <ul className="divide-y divide-line">
            <Completeness label="Parcelles avec superficie lisible" missing={q?.sans_superficie ?? 0} total={q?.parcelles ?? 0} />
            <Completeness label="Parcelles avec enquêteur" missing={q?.sans_enqueteur ?? 0} total={q?.parcelles ?? 0} />
            <Completeness label="Parcelles avec contour" missing={q?.sans_geometrie ?? 0} total={q?.parcelles ?? 0} />
          </ul>
          <ul className="divide-y divide-line">
            <Completeness label="Exploitants avec nom" missing={q?.sans_nom ?? 0} total={q?.exploitants ?? 0} />
            <Completeness label="Exploitants avec contact" missing={q?.sans_contact ?? 0} total={q?.exploitants ?? 0} />
            <Completeness label="Exploitants rattachés à un ménage" missing={q?.sans_menage ?? 0} total={q?.exploitants ?? 0} />
          </ul>
        </div>

        {v && (
          <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">
            Sur l'ensemble du pays, <strong className="text-ink">{nf.format(v.correctes)}</strong> parcelles
            sont validées et <strong className="text-ink">{nf.format(v.incorrectes)}</strong> ont été
            rejetées, soit un taux de validation de <strong className="text-ink">{nf2.format(v.taux)} %</strong>.
          </p>
        )}
      </section>
       <Repartition />
       <Structure/>
       <Profil/>
       <Enquetes/>
       <Recapitulatif/>
    </div>
  )
}