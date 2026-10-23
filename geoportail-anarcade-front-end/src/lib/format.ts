const nullish = (v?: string | null) => (v ?? '').trim()

// "KOUASSI ERICK" → "Kouassi Erick"   |   "KOUAKOU-N'GUESSAN" → "Kouakou-N'Guessan"
export const titleCase = (v?: string | null) =>
  nullish(v).toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, sep, c) => sep + c.toUpperCase())

// Dans ta base, `prenom` contient souvent déjà le nom : on évite le doublon
export function fullName(nom?: string | null, prenom?: string | null) {
  const n = nullish(nom)
  const p = nullish(prenom)
  if (!n && !p) return ''
  if (!n) return titleCase(p)
  if (!p) return titleCase(n)
  return titleCase(p.toLowerCase().startsWith(n.toLowerCase()) ? p : `${n} ${p}`)
}

// "0748093215" → "07 48 09 32 15"
export function formatPhone(v?: string | null) {
  const digits = nullish(v).replace(/\D/g, '')
  return digits.length === 10 ? digits.replace(/(\d{2})(?=\d)/g, '$1 ') : nullish(v)
}

export const formatDate = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(iso))
    : ''

export const formatHa = (n?: number | null) =>
  n == null
    ? ''
    : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n) + ' ha'

// 7.8993 → "7,89930° N"   |   -2.8658 → "2,86580° O"
export function formatCoord(value: number | null | undefined, axis: 'lat' | 'lng') {
  if (value == null) return ''
  const hemi = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'O'
  return `${Math.abs(value).toFixed(5).replace('.', ',')}° ${hemi}`
}
// Sépare nom et prénom(s) : dans ta base, `prenom` commence parfois par le nom
export function splitName(nom?: string | null, prenom?: string | null) {
  const n = titleCase(nom)
  let p = titleCase(prenom)
  if (n && p.toLowerCase().startsWith(n.toLowerCase() + ' ')) p = p.slice(n.length).trim()
  return { n, p }
}