import { X } from 'lucide-react'
import { useUi } from '../../lib/store'
import type { Parcel } from '../../types'

interface Props { parcels: Parcel[] }


function Field({ label, children, mono = false ,className = ''}: {
  label: string
  children: React.ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-[15px] font-medium ${mono ? 'font-mono' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line p-5">
      <h3 className="mb-4 text-base font-medium">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">{children}</div>
    </section>
  )
}

const formatHa = (n: number) =>
    new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + ' ha'


  // Centroïde du polygone (moyenne des sommets, sans le point de fermeture)
const getCentroid = (p: Parcel): [number, number] => {
  const ring = p.geometry.coordinates[0].slice(0, -1)
  return [
    ring.reduce((s, c) => s + c[0], 0) / ring.length, // longitude
    ring.reduce((s, c) => s + c[1], 0) / ring.length, // latitude
  ]
}

// 9.3186 → "9,3186° N"   |   -5.6024 → "5,6024° O"
const formatCoord = (value: number, axis: 'lat' | 'lng') => {
  const hemi = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'O'
  return `${Math.abs(value).toFixed(4).replace('.', ',')}° ${hemi}`
}

// "2026-09-12" → "12 septembre 2026"
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))

export default function ParcelPanel({ parcels }: Props) {
  const { selectedId, setSelected } = useUi()
  const parcel = parcels.find((p) => p.id === selectedId)

  if (!parcel) return null

  return (
    <aside className="h-fit overflow-hidden rounded-2xl border border-line bg-white">
      {/* En-tête */}
      <div className="bg-brand-50/60 p-5">
        <div className="flex items-start justify-between">
          <div className="text-[11px] font-semibold tracking-widest text-brand-700">
            FICHE PARCELLE
          </div>
          <div className="flex items-center gap-2">
            {/* <StatusBadge status={parcel.status} /> */}
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg p-1 text-muted hover:bg-white"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <h2 className="mt-3 font-mono text-3xl font-semibold">{parcel.id}</h2>
        <p className="mt-2 text-sm text-muted">
          {parcel.locality} · {parcel.subPrefecture} · Région du {parcel.region}
        </p>
      </div>

      {/* Culture et superficie */}
      <div className="grid grid-cols-2 gap-4 border-t border-line p-5">
    
        <Field label="Region">{parcel.region}</Field>
        <Field label="Sous-Prefecture">{parcel.subPrefecture}</Field>
        <Field label="Localité"> {parcel.locality}</Field>
        <Field label=""> </Field>
        
      </div>
    </aside>
  )
}