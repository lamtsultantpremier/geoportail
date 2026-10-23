export type Bbox = [number, number, number, number] // ouest, sud, est, nord
type Geometry = GeoJSON.Polygon | GeoJSON.MultiPolygon

export function geometryBounds(g: Geometry | null): Bbox | null {
  if (!g) return null
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  const pts = polygons.flatMap((poly) => poly[0])
  if (pts.length === 0) return null
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

export function mergeBounds(list: (Bbox | null)[]): Bbox | null {
  const valid = list.filter((b): b is Bbox => b !== null)
  if (valid.length === 0) return null
  return [
    Math.min(...valid.map((b) => b[0])),
    Math.min(...valid.map((b) => b[1])),
    Math.max(...valid.map((b) => b[2])),
    Math.max(...valid.map((b) => b[3])),
  ]
}