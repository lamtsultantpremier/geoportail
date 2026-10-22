import { NavLink, Outlet } from 'react-router-dom'
import { Database, FlaskConical, Map as MapIcon, Sprout, Upload, Users } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { to: '/', label: 'Carte', icon: MapIcon },
  { to: '/exploitants', label: 'Exploitants', icon: Users },
  { to: '/data', label: 'Données', icon: Database },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-8 border-b border-line bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
            <Sprout size={20} />
          </div>
          <div className="leading-tight">
            {/* <div className="text-xl font-medium">noyau</div> */}
            <div className="text-[10px] tracking-widest text-muted">GÉOPORTAIL ANACARDE</div>
          </div>
        </div>

        <nav className="flex gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-canvas',
                )
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-canvas">
            <Upload size={16} /> Importer des données validées
          </button>
          <div className="flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-full bg-banner text-sm font-semibold text-banner-ink">AK</div>
            <div className="text-xs leading-tight">
              <div className="font-semibold">Équipe SIG</div>
              <div className="text-muted">Côte d'Ivoire</div>
            </div>
          </div>
        </div>
      </header>
{/* 
      <div className="flex items-center justify-between bg-banner px-6 py-2 text-xs text-banner-ink">
        <span className="flex items-center gap-2">
          <FlaskConical size={14} />
          DÉMONSTRATION · Identités, contacts, géométries et analyses fictifs. Aucune conclusion juridique de conformité.
        </span>
        <span className="hidden lg:block">Jeu de données validées · 18 sept. 2026</span>
      </div> */}

      <main className="flex-1 px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}