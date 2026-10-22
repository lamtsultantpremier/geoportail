export const BASE = import.meta.env.VITE_API_URL ?? '/api'
type Params = Record<string, string | number | undefined>

export async function apiGet<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  })
  const query = qs.toString()
  const res = await fetch(`${BASE}${path}${query ? `?${query}` : ''}`, { signal })
  if (!res.ok) throw new Error(`API ${res.status} sur ${path}`)
  return res.json() as Promise<T>
}

