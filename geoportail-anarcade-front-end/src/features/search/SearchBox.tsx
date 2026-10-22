import { useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useUi } from '../../lib/store'
import { useDebounced } from '../../lib/useDebounced'
import { fullName, titleCase } from '../../lib/format'
import { useFilters } from '../filters/useFilters'
import { useParcelSearch, type SearchResult } from './useParcelSearch'

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)

export default function SearchBox() {
  const { filters } = useFilters()
  const { setSelected, requestFlyTo } = useUi()

  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const query = useDebounced(text.trim(), 250)
  const { data, isFetching, isError } = useParcelSearch(query, filters)
  const results = data?.results ?? []
  const waiting = text.trim().length >= 2 && (text.trim() !== query || isFetching)

  // Raccourci ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fermer en cliquant à l'extérieur
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const choose = (r: SearchResult) => {
    setSelected(String(r.id))
    if (r.lng != null && r.lat != null) requestFlyTo(r.lng, r.lat)
    setText(r.code)
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showPanel = open && text.trim().length >= 2

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
        {waiting
          ? <Loader2 size={16} className="animate-spin text-muted" />
          : <Search size={16} className="text-muted" />}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => { setText(e.target.value); setActive(0); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          placeholder="Exploitant, code parcelle ou localité…"
          aria-label="Rechercher une parcelle"
        />
        <kbd className="rounded bg-canvas px-1.5 py-0.5 text-[10px] text-muted">
          {isMac ? '⌘ K' : 'Ctrl K'}
        </kbd>
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          {isError && (
            <p className="p-4 text-sm text-red-700">Recherche indisponible.</p>
          )}

          {!isError && !waiting && results.length === 0 && (
            <p className="p-4 text-sm text-muted">Aucune parcelle trouvée.</p>
          )}

          {results.length > 0 && (
            <ul role="listbox">
              {results.map((r, i) => {
                const name = fullName(r.nom, r.prenom)
                return (
                  <li key={r.id} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(r)}
                      className={`block w-full px-4 py-2.5 text-left ${
                        i === active ? 'bg-brand-50' : ''
                      }`}
                    >
                      <div className="break-all font-mono text-[12px] font-semibold">{r.code}</div>
                      <div className="text-[12px] text-muted">
                        {name || 'Exploitant non renseigné'}
                        {r.localite && ` · ${titleCase(r.localite)}`}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="border-t border-line px-4 py-2 text-[11px] text-muted">
            ↑ ↓ pour naviguer · Entrée pour ouvrir · la recherche respecte les filtres
          </div>
        </div>
      )}
    </div>
  )
}