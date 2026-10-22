import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  Layer, NavigationControl, Popup, ScaleControl, Source,
  type MapLayerMouseEvent, type MapRef,
} from 'react-map-gl/maplibre'
import { LngLatBounds, type GeoJSONSource } from 'maplibre-gl'
import { Loader2, MapPin } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useUi } from '../../lib/store'
import type { Filters } from '../filters/useFilters'
import { useParcelPoints, useParcelPolygons, type Bbox } from './useMapData'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const MAX_BOUNDS: Bbox = [-12, 1.5, 1, 13.5]
const CI_BOUNDS: Bbox = [-8.6, 4.3, -2.5, 10.75]

// En dessous de ce zoom : pastilles. À partir de ce zoom : polygones.
const POLYGON_ZOOM = 14

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
const NOT_CLUSTER: any = ['!', ['has', 'point_count']]
const IS_CLUSTER: any = ['has', 'point_count']

interface Props { filters: Filters; isFiltered: boolean }

interface HoverInfo { id: string; code: string; lng: number; lat: number }

// ── Composant MapView ───────────────────────────────────────────────
export default function MapView({ filters, isFiltered }: Props) {
  const ref = useRef<MapRef>(null)
  const { hoveredId, selectedId, flyTo,setHovered, setSelected, layers } = useUi()
  const [cursor, setCursor] = useState<[number, number] | null>(null)
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)
  const [overCluster, setOverCluster] = useState(false)
  const [view, setView] = useState<{ bbox: Bbox; zoom: number } | null>(null)

  // ── Données ───────────────────────────────────────────────
  const points = useParcelPoints(filters)
  const showPolygons = (view?.zoom ?? 0) >= POLYGON_ZOOM
  const polygons = useParcelPolygons(view?.bbox ?? null, filters, showPolygons)

  const pointsGeojson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: (points.data?.points ?? []).map(([id, code, lng, lat]) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { id, code },
    })),
  }), [points.data])

  // ── Zone visible (arrondie pour limiter les requêtes) ─────
  const syncView = useCallback(() => {
    const map = ref.current
    if (!map) return
    const b = map.getBounds()
    const down = (v: number) => Math.floor(v * 100) / 100
    const up = (v: number) => Math.ceil(v * 100) / 100
    setView({
      bbox: [down(b.getWest()), down(b.getSouth()), up(b.getEast()), up(b.getNorth())],
      zoom: map.getZoom(),
    })
  }, [])

  // ── Cadrage : pays entier par défaut, parcelles filtrées sinon ──
  useEffect(() => {
    const map = ref.current
    const rows = points.data?.points
    if (!map || !rows) return
    if (!isFiltered || rows.length === 0) {
      map.fitBounds(CI_BOUNDS, { padding: 20, duration: 800 })
      return
    }
    const b = new LngLatBounds()
    rows.forEach((r) => b.extend([r[2], r[3]]))
    map.fitBounds(b, { padding: 90, duration: 800, maxZoom: 15 })
  }, [points.data, isFiltered])
// ___ Reduuction de la taille de la carte apres affichage des informations
  useEffect(() => {
      const t = setTimeout(() => ref.current?.resize(), 50)
      return () => clearTimeout(t)
}, [selectedId])

// Déplacement demandé par la recherche
useEffect(() => {
  if (!flyTo) return
  ref.current?.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 16, duration: 1200 })
}, [flyTo])

  // ── Interactions ──────────────────────────────────────────
  const onMove = (e: MapLayerMouseEvent) => {
    setCursor([e.lngLat.lat, e.lngLat.lng])
    const f = e.features?.[0]

    if (!f) {
      setHovered(null); setHoverInfo(null); setOverCluster(false)
      return
    }
    if (f.properties?.point_count !== undefined) {
      setHovered(null); setHoverInfo(null); setOverCluster(true)
      return
    }

    setOverCluster(false)
    const id = String(f.properties?.id)
    setHovered(id)
    setHoverInfo((prev) => {
      if (prev?.id === id) return prev            // évite que le popup suive la souris
      const [lng, lat] = f.geometry.type === 'Point'
        ? (f.geometry.coordinates as [number, number])
        : [e.lngLat.lng, e.lngLat.lat]
      return { id, code: String(f.properties?.code ?? id), lng, lat }
    })
  }

  const onLeave = () => { setHovered(null); setHoverInfo(null); setOverCluster(false) }

  const onClick = async (e: MapLayerMouseEvent) => {
    const map = ref.current
    const f = e.features?.[0]
    if (!map) return
    if (!f) { setSelected(null); return }

    // Clic sur un regroupement : on zoome dessus
    if (f.properties?.point_count !== undefined) {
      const source = map.getSource('parcel-points') as GeoJSONSource | undefined
      const zoom = await source?.getClusterExpansionZoom(f.properties.cluster_id)
      if (zoom != null && f.geometry.type === 'Point') {
        map.easeTo({ center: f.geometry.coordinates as [number, number], zoom: zoom + 0.5 })
      }
      return
    }

    // Clic sur une parcelle : sélection + zoom dessus
    setSelected(String(f.properties?.id))
    const center: [number, number] = f.geometry.type === 'Point'
      ? (f.geometry.coordinates as [number, number])
      : [e.lngLat.lng, e.lngLat.lat]
    map.flyTo({ center, zoom: Math.max(map.getZoom(), 15), duration: 900 })
  }

  // ── Styles ────────────────────────────────────────────────
  const isActive: any = [
    'any',
    ['==', ['to-string', ['get', 'id']], hoveredId ?? '__none__'],
    ['==', ['to-string', ['get', 'id']], selectedId ?? '__none__'],
  ]
  const visibility = layers.parcels ? 'visible' : 'none'
  const pointer = Boolean(hoverInfo) || overCluster

  return (
    <div className="relative size-full">
      <Map
        ref={ref}
        mapStyle={MAP_STYLE}
        initialViewState={{ bounds: CI_BOUNDS, fitBoundsOptions: { padding: 20 } }}
        minZoom={4}
        maxBounds={MAX_BOUNDS}
        interactiveLayerIds={['clusters', 'parcels-dots', 'parcels-fill']}
        cursor={pointer ? 'pointer' : 'grab'}
        onLoad={syncView}
        onMoveEnd={syncView}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        <NavigationControl position="top-right" showCompass />
        <ScaleControl position="bottom-right" unit="metric" />

        {/* Contour de la Côte d'Ivoire */}
        <Source id="ci" type="geojson" data="/data/ci.geojson">
          <Layer id="ci-fill" type="fill" paint={{ 'fill-color': '#000000', 'fill-opacity': 0.08 }} />
          <Layer id="ci-line" type="line" paint={{ 'line-color': '#305CDE', 'line-width': 3, 'line-opacity': 0.9 }} />
        </Source>

        {/* Polygones : seulement la zone visible, à fort zoom */}
        <Source id="parcels" type="geojson" data={polygons.data ?? EMPTY_FC}>
          <Layer
            id="parcels-fill" type="fill" minzoom={POLYGON_ZOOM}
            layout={{ visibility }}
            paint={{
              'fill-color': ['case', isActive, '#1f6b45', '#4f9a68'],
              'fill-opacity': ['case', isActive, 0.95, 0.65],
            }}
          />
          <Layer
            id="parcels-line" type="line" minzoom={POLYGON_ZOOM}
            layout={{ visibility }}
            paint={{
              'line-color': '#14472d',
              'line-width': ['case', isActive, 3, 1.2],
            }}
          />
          <Layer
            id="parcels-label" type="symbol" minzoom={16}
            layout={{
              visibility,
              'text-field': ['get', 'code'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 11,
            }}
            paint={{ 'text-color': '#fff', 'text-halo-color': '#1f6b45', 'text-halo-width': 1.5 }}
          />
        </Source>

        {/* Un point par parcelle, regroupés quand ils sont proches */}
        <Source
          id="parcel-points" type="geojson" data={pointsGeojson}
          cluster clusterMaxZoom={11} clusterRadius={45}
        >
          <Layer
            id="clusters" type="circle" filter={IS_CLUSTER}
            layout={{ visibility }}
            paint={{
              'circle-color': ['step', ['get', 'point_count'],
                '#6fae7f', 100, '#3f8f5d', 1000, '#1f6b45', 10000, '#14472d'],
              'circle-radius': ['step', ['get', 'point_count'], 14, 100, 18, 1000, 24, 10000, 30],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            }}
          />
          <Layer
            id="cluster-count" type="symbol" filter={IS_CLUSTER}
            layout={{
              visibility,
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 12,
            }}
            paint={{ 'text-color': '#ffffff' }}
          />
          <Layer
            id="parcels-dots" type="circle" maxzoom={POLYGON_ZOOM} filter={NOT_CLUSTER}
            layout={{ visibility }}
            paint={{
              'circle-color': ['case', isActive, '#14472d', '#1f6b45'],
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 10, 6, 14, 9],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.5,
            }}
          />
        </Source>

        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lng} latitude={hoverInfo.lat}
            anchor="bottom" offset={18}
            closeButton={false} closeOnClick={false} className="parcel-popup"
          >
            <div className="w-64 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Parcelle
              </div>
              <div className="mt-1 font-mono text-sm font-semibold">{hoverInfo.code}</div>
              <div className="mt-3 border-t border-line pt-2 text-xs text-brand-600">
                Cliquer pour consulter la fiche parcelle →
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Surcouches */}
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium shadow">
        <MapPin size={14} className="text-brand-600" /> Côte d'Ivoire
        {points.data && (
          <span className="text-muted">
            · {new Intl.NumberFormat('fr-FR').format(points.data.count)} parcelles
          </span>
        )}
      </div>

      {(points.isFetching || polygons.isFetching) && (
        <div className="pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs shadow">
          <Loader2 size={14} className="animate-spin text-brand-600" /> Chargement…
        </div>
      )}

      {points.isError && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          Impossible de charger les parcelles. Le serveur Django est-il lancé ?
        </div>
      )}

      {polygons.data?.truncated && (
        <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow">
          Zone très dense : zoomez pour afficher toutes les parcelles.
        </div>
      )}

      <div className="absolute bottom-10 left-4 rounded-xl bg-white p-3 text-xs shadow">
        <div className="mb-2 text-[10px] tracking-widest text-muted">LÉGENDE</div>
        {[
          ['#1f6b45', "Parcelles d'anacarde"],
          ['#3f8f5d', 'Groupe de parcelles'],
          ['#305CDE', 'Limite nationale'],
        ].map(([c, l]) => (
          <div key={l} className="mb-1 flex items-center gap-2">
            <span className="size-3 rounded-sm border border-black/20" style={{ background: c }} />
            {l}
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 px-4 py-1.5 text-[11px] text-muted">
        <span>Données validées · polygones à partir du zoom {POLYGON_ZOOM}</span>
        <span>{cursor ? `${cursor[0].toFixed(4)}° N · ${Math.abs(cursor[1]).toFixed(4)}° O` : ''}</span>
      </div>
    </div>
  )
}