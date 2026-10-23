import { useEffect, useState } from 'react'
import { Check, Download, Loader2,Minus, X } from 'lucide-react'
import { useUi } from '../../lib/store'
import { useParcelDetail, type ParcelDetail } from './useParcelDetail'
import {
  formatCoord, formatDate, formatHa, formatPhone, fullName, titleCase,
} from '../../lib/format'

import { downloadParcelPdf } from './pdf/generate'


type Tab = 'parcelle' | 'exploitant' | 'enqueteur' | 'fiche'

// ── Composants de présentation ────────────────────────────────

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string }[] = [
    { key: 'parcelle', label: 'Parcelle' },
    { key: 'exploitant', label: 'Exploitant'},
    { key: 'enqueteur', label: 'Enquêteur' },
    { key: 'fiche', label: 'Fiche' },
  ]
  return (
    <div className="flex gap-5 border-b border-line px-5">
      {items.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`-mb-px border-b-2 pb-3 pt-1 text-xs font-medium transition-colors ${
            tab === key
              ? 'border-brand-600 text-ink'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// Titre de section en petites majuscules
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </h3>
  )
}

// Phrase de synthèse en tête d'onglet
function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-relaxed text-ink/80">{children}</p>
}

// Liste « libellé → valeur », sans cadre, séparée par de fins traits
function Rows({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-line border-y border-line">{children}</dl>
}

function Row({ label, value, mono = false }: {
  label: string
  value?: string | number | null
  mono?: boolean
}) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2.5">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd
        className={`text-[13px] ${mono ? 'font-mono' : ''} ${
          empty ? 'italic text-muted' : 'font-medium'
        }`}
      >
        {empty ? 'Non renseigné' : value}
      </dd>
    </div>
  )
}

function IncludedRow({ label, detail, ok }: { label: string; detail: string; ok: boolean }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
          ok ? 'bg-brand-100 text-brand-700' : 'bg-line text-muted'
        }`}
      >
        {ok ? <Check size={12} /> : <Minus size={12} />}
      </span>
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[12px] text-muted">{detail}</div>
      </div>
    </li>
  )
}

// ── Phrases de synthèse ───────────────────────────────────────

function parcelSentence(d: ParcelDetail) {
  const { parcelle: p, localisation: l } = d
  const niveaux = [
    l.sous_prefecture && `sous-préfecture de ${titleCase(l.sous_prefecture)}`,
    l.departement && `département de ${titleCase(l.departement)}`,
    l.region && `région de ${titleCase(l.region)}`,
  ].filter(Boolean)

  const taille = p.superficie_ha != null ? ` de ${formatHa(p.superficie_ha)}` : ''
  const lieu = l.localite ? `à ${titleCase(l.localite)}` : ''
  const admin = niveaux.length ? ` (${niveaux.join(', ')})` : ''
  const situe = lieu || admin ? `, située ${lieu}${admin}` : ''
  return `Parcelle d'anacarde${taille}${situe}.`
}

function farmerSentence(d: ParcelDetail) {
  const e = d.exploitant
  const nom = fullName(e.nom, e.prenom) || 'Cet exploitant'
  const naissance = e.date_naissance
    ? `, né(e) le ${formatDate(e.date_naissance)}${
        e.lieu_naissance ? ` à ${titleCase(e.lieu_naissance)}` : ''
      }`
    : ''
  const metier = e.profession ? `, ${e.profession.toLowerCase()}` : ''
  return `${nom}${naissance}${metier}.`
}

function surveyorSentence(d: ParcelDetail) {
  const s = d.enqueteur
  if (!s) return ''
  const nom = titleCase(s.nom_complet) || 'Un enquêteur'
  const date = d.enquete?.date ? ` le ${formatDate(d.enquete.date)}` : ''
  const cible = fullName(d.exploitant.nom, d.exploitant.prenom)
  return `${nom} a mené l'enquête${date}${cible ? ` auprès de ${cible}` : ''}.`
}

// ── Panneau ───────────────────────────────────────────────────

export default function ParcelPanel() {
  const { selectedId, setSelected } = useUi()
  const [tab, setTab] = useState<Tab>('parcelle')
  const { data, isLoading, isError } = useParcelDetail(selectedId)

  // Revenir sur l'onglet Parcelle à chaque nouvelle sélection
  useEffect(() => { setTab('parcelle') }, [selectedId])

  if (!selectedId) return null

  const farmerName = data ? fullName(data.exploitant.nom, data.exploitant.prenom) : ''

  return (
    <aside className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-line bg-white lg:sticky lg:top-4">
      {/* En-tête */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Fiche parcellaire
          </div>
          <button
            onClick={() => setSelected(null)}
            className="-mr-1 -mt-1 rounded-lg p-1 text-muted hover:bg-canvas"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {data ? (
          <>
            <h2 className="mt-3 break-all font-mono text-lg font-semibold">
              {data.parcelle.code}
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              {farmerName ? `Exploitant : ${farmerName}` : 'Exploitant non renseigné'}
              {data.parcelle.superficie_ha != null &&
                ` · ${formatHa(data.parcelle.superficie_ha)}`}
            </p>
          </>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="h-5 w-3/4 animate-pulse rounded bg-line" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
          </div>
        )}
      </div>

      <Tabs tab={tab} onChange={setTab} />

      <div className="p-5">
        {isLoading && <p className="text-sm text-muted">Chargement de la fiche…</p>}

        {isError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Impossible de charger cette parcelle. Le serveur Django est-il lancé ?
          </p>
        )}

        {data && tab === 'parcelle' && <ParcelleTab d={data} />}
        {data && tab === 'exploitant' && <ExploitantTab d={data} />}
        {data && tab === 'enqueteur' && <EnqueteurTab d={data} />}
        {data && tab === 'fiche' && <FicheTab d={data} />}
      </div>
    </aside>
  )
}

// ── Onglets ───────────────────────────────────────────────────

function ParcelleTab({ d }: { d: ParcelDetail }) {
  const { parcelle: p, localisation: l } = d
  return (
    <div className="space-y-6">
      <Lead>{parcelSentence(d)}</Lead>

      <section>
        <SectionTitle>Identification</SectionTitle>
        <Rows>
          <Row label="Code parcelle" value={p.code} mono />
          <Row label="Superficie tracée" value={formatHa(p.superficie_ha)} />
          <Row label="Mise en place" value={p.annee_mise_place ? `Année ${p.annee_mise_place}` : null} />
          <Row label="Faire-valoir" value={titleCase(p.mode_faire_valoir)} />
          <Row label="Géoréférencée le" value={formatDate(p.date_georeferencement)} />
        </Rows>
      </section>

      <section>
        <SectionTitle>Localisation</SectionTitle>
        <Rows>
          <Row label="District" value={titleCase(l.district)} />
          <Row label="Région" value={titleCase(l.region)} />
          <Row label="Département" value={titleCase(l.departement)} />
          <Row label="Sous-préfecture" value={titleCase(l.sous_prefecture)} />
          <Row label="Localité" value={titleCase(l.localite)} />
          <Row label="Quartier" value={titleCase(l.quartier)} />
        </Rows>
      </section>

      <section>
        <SectionTitle>Position indicative</SectionTitle>
        <Rows>
          <Row label="Latitude" value={formatCoord(p.lat, 'lat')} mono />
          <Row label="Longitude" value={formatCoord(p.lng, 'lng')} mono />
        </Rows>
      </section>
    </div>
  )
}

function ExploitantTab({ d }: { d: ParcelDetail }) {
  const e = d.exploitant
  const naissance = [formatDate(e.date_naissance), titleCase(e.lieu_naissance), titleCase(e.pays_naissance)]
    .filter(Boolean)
  return (
    <div className="space-y-6">
      <Lead>{farmerSentence(d)}</Lead>

      <section>
        <SectionTitle>Identité</SectionTitle>
        <Rows>
          <Row label="Code exploitant" value={e.code} mono />
          <Row label="Nom complet" value={fullName(e.nom, e.prenom)} />
          <Row label="Naissance" value={naissance.join(' · ')} />
          <Row label="Nationalité" value={titleCase(e.nationalite)} />
          <Row label="Situation" value={titleCase(e.situation_matrimoniale)} />
        </Rows>
      </section>

      <section>
        <SectionTitle>Activité et contact</SectionTitle>
        <Rows>
          <Row label="Profession" value={titleCase(e.profession)} />
          <Row label="Instruction" value={titleCase(e.niveau_instruction)} />
          <Row label="Téléphone" value={formatPhone(e.contacts)} />
          <Row label="Code ménage" value={e.code_menage} mono />
        </Rows>
      </section>
    </div>
  )
}

function EnqueteurTab({ d }: { d: ParcelDetail }) {
  const s = d.enqueteur
  if (!s) {
    return (
      <p className="text-sm text-muted">
        Aucun enquêteur n'est renseigné pour cette parcelle.
      </p>
    )
  }
  return (
    <div className="space-y-6">
      <Lead>{surveyorSentence(d)}</Lead>

      <section>
        <SectionTitle>Enquêteur</SectionTitle>
        <Rows>
          <Row label="Nom complet" value={titleCase(s.nom_complet)} />
          <Row label="Code enquêteur" value={s.code} mono />
          <Row label="Téléphone" value={formatPhone(s.contact)} />
        </Rows>
      </section>

      <section>
        <SectionTitle>Enquête</SectionTitle>
        <Rows>
          <Row label="Date" value={formatDate(d.enquete?.date)} />
          <Row label="N° questionnaire" value={d.enquete?.numero_questionnaire} mono />
          <Row label="Exploitant enquêté" value={fullName(d.exploitant.nom, d.exploitant.prenom)} />
          <Row label="Parcelle relevée" value={d.parcelle.code} mono />
        </Rows>
      </section>
    </div>
  )
}

function FicheTab({ d }: { d: ParcelDetail }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const farmer = fullName(d.exploitant.nom, d.exploitant.prenom)

  const onDownload = async () => {
    setBusy(true)
    setError(null)
    try {
      await downloadParcelPdf(d)
    } catch (err) {
      console.error(err)
      setError('La génération du PDF a échoué. Réessayez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Fiche récapitulative</SectionTitle>
        <Lead>
          Document PDF d'une page regroupant les informations de cette parcelle,
          de son exploitant et de l'enquêteur.
        </Lead>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          <IncludedRow label="Exploitant" ok={Boolean(farmer)}
            detail={farmer ? `${farmer} · ${d.exploitant.code}` : 'Nom non renseigné'} />
          <IncludedRow label="Photo de l'exploitant" ok={Boolean(d.exploitant.photo_url)}
            detail={d.exploitant.photo_url ? 'Photo disponible' : 'Une silhouette sera affichée'} />
          <IncludedRow label="Parcelle" ok
            detail={`${d.parcelle.code}${d.parcelle.superficie_ha != null ? ` · ${formatHa(d.parcelle.superficie_ha)}` : ''}`} />
          <IncludedRow label="Plan de la parcelle" ok={Boolean(d.parcelle.geometrie)}
            detail={d.parcelle.geometrie ? 'Contour, nord et échelle' : 'Contour indisponible'} />
          <IncludedRow label="Localisation" ok={Boolean(d.localisation.region)}
            detail={[d.localisation.region, d.localisation.departement, d.localisation.sous_prefecture]
              .filter(Boolean).map(titleCase).join(' · ') || 'Non renseignée'} />
          <IncludedRow label="Enquêteur" ok={Boolean(d.enqueteur)}
            detail={d.enqueteur ? titleCase(d.enqueteur.nom_complet) : 'Non renseigné'} />
        </ul>
      </section>

      <div>
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
        >
          {busy
            ? <><Loader2 size={16} className="animate-spin" /> Génération du PDF…</>
            : <><Download size={16} /> Télécharger la fiche PDF</>}
        </button>
        {error && <p className="mt-2 text-center text-[12px] text-red-700">{error}</p>}
        <p className="mt-2 text-center text-[11px] text-muted">
          Format A4 · fiche_parcelle_{d.parcelle.code}.pdf
        </p>
      </div>
    </div>
  )
}