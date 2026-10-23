export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </h3>
  )
}

export function Rows({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-line border-y border-line">{children}</dl>
}

export function Row({ label, value, mono = false }: {
  label: string
  value?: string | number | null
  mono?: boolean
}) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2.5">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd
        className={`break-words text-[13px] ${mono ? 'break-all font-mono text-[12px]' : ''} ${
          empty ? 'italic text-muted' : 'font-medium'
        }`}
      >
        {empty ? 'Non renseigné' : value}
      </dd>
    </div>
  )
}