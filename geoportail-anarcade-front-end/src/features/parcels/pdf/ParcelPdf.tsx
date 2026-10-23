import {
  Circle, Document, Font, Image, Page, Path, Polygon, StyleSheet, Svg, Text, View,
} from '@react-pdf/renderer'
import type { ParcelDetail } from '../useParcelDetail'
import {
  formatCoord, formatDate, formatHa, formatPhone, fullName, titleCase,
} from '../../../lib/format'

// Pas de coupure de mot automatique (les codes doivent rester entiers)
Font.registerHyphenationCallback((word) => [word])

export const C = {
  brand: '#1f6b45', dark: '#14472d', ink: '#1c2a22', muted: '#6b766f',
  line: '#e3e6df', canvas: '#f6f6f2', soft: '#eaf4ee',
}

export const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: C.ink, paddingBottom: 48 },

  header: {
    backgroundColor: C.dark, paddingHorizontal: 36, paddingTop: 28, paddingBottom: 22,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  kicker: { fontSize: 7.5, letterSpacing: 1.6, color: '#9fd0b0', fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 22, color: '#ffffff', fontFamily: 'Helvetica-Bold', marginTop: 5 },
  subtitle: { fontSize: 9, color: '#cfe6d7', marginTop: 3 },
  headRight: { alignItems: 'flex-end' },
  headLabel: { fontSize: 7, letterSpacing: 1.2, color: '#9fd0b0' },
  headCode: { fontFamily: 'Courier-Bold', fontSize: 10.5, color: '#ffffff', marginTop: 3 },
  headDate: { fontSize: 8, color: '#cfe6d7', marginTop: 7 },
  accent: { height: 3, backgroundColor: C.brand },

  body: { paddingHorizontal: 36, paddingTop: 18 },
  section: { marginBottom: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionBar: { width: 3, height: 11, backgroundColor: C.brand, marginRight: 7 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1.2, color: C.dark },
  sectionLine: { flex: 1, height: 0.75, backgroundColor: C.line, marginLeft: 9 },

  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  field: { width: '50%', paddingRight: 10, marginBottom: 9 },
  fieldFull: { width: '100%' },
  label: { fontSize: 6.8, letterSpacing: 0.9, color: C.muted, marginBottom: 2.5 },
  value: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  mono: { fontFamily: 'Courier-Bold', fontSize: 9 },
  empty: { fontFamily: 'Helvetica-Oblique', color: '#9aa39d' },

  photo: {
    width: 92, height: 114, borderWidth: 0.75, borderColor: C.line, borderRadius: 4,
    backgroundColor: C.canvas, marginRight: 18, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  photoNote: { fontSize: 6.5, color: C.muted, marginTop: 5, letterSpacing: 0.8 },

  plan: {
    width: 190, height: 214, borderWidth: 0.75, borderColor: C.line, borderRadius: 4,
    backgroundColor: C.canvas, marginLeft: 16, overflow: 'hidden',
  },
  planCaption: { fontSize: 6.8, color: C.muted, marginTop: 5, lineHeight: 1.4 },
  scale: { position: 'absolute', left: 10, bottom: 9 },
  scaleBar: { height: 4, borderWidth: 0.75, borderColor: C.dark, borderTopWidth: 0 },
  scaleText: { fontSize: 6.5, color: C.dark, marginTop: 2 },
  north: { position: 'absolute', right: 10, top: 8, alignItems: 'center' },
  northText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 1 },

  footer: {
    position: 'absolute', left: 36, right: 36, bottom: 20, paddingTop: 7,
    borderTopWidth: 0.75, borderTopColor: C.line,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.muted },
})

// ── Utilitaires ───────────────────────────────────────────────

// Les espaces insécables de Intl ne sont pas dans la police PDF standard
export const t = (v?: string | null) => (v ?? '').replace(/[\u202f\u00a0]/g, ' ')

// Dans la base, `prenom` contient souvent déjà le nom : on les sépare proprement
function splitName(nom?: string | null, prenom?: string | null) {
  const n = titleCase(nom)
  let p = titleCase(prenom)
  if (n && p.toLowerCase().startsWith(n.toLowerCase() + ' ')) p = p.slice(n.length).trim()
  return { n, p }
}

const ECHELLES = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000]
const M_PAR_DEGRE = 111320

// ── Composants ────────────────────────────────────────────────

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead} wrap={false}>
        <View style={s.sectionBar} />
        <Text style={s.sectionTitle}>{title.toUpperCase()}</Text>
        <View style={s.sectionLine} />
      </View>
      {children}
    </View>
  )
}

export function Field({ label, value, mono = false, full = false }: {
  label: string; value?: string | null; mono?: boolean; full?: boolean
}) {
  const v = t(value)
  return (
    <View style={[s.field, full ? s.fieldFull : {}]} wrap={false}>
      <Text style={s.label}>{label.toUpperCase()}</Text>
      <Text style={[s.value, mono && v ? s.mono : {}, !v ? s.empty : {}]}>
        {v || 'Non renseigné'}
      </Text>
    </View>
  )
}

export function Silhouette() {
  return (
    <Svg width={46} height={56} viewBox="0 0 46 56">
      <Circle cx={23} cy={16} r={10} fill="#c9d3cc" />
      <Path d="M 3 54 C 3 38 12 31 23 31 C 34 31 43 38 43 54 Z" fill="#c9d3cc" />
    </Svg>
  )
}

// Plan : contour réel de la parcelle, mis à l'échelle dans le cadre
function Plan({ geometry, w, h }: {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null; w: number; h: number
}) {
  if (!geometry) {
    return (
      <View style={[s.plan, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[s.value, s.empty]}>Contour indisponible</Text>
      </View>
    )
  }

  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const pts = polys.flatMap((p) => p[0])
  const lat0 = pts.reduce((a, p) => a + p[1], 0) / pts.length
  const k = Math.cos((lat0 * Math.PI) / 180)

  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)

  const spanX = Math.max((maxX - minX) * k, 1e-9)
  const spanY = Math.max(maxY - minY, 1e-9)
  const pad = 34
  const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY)
  const ox = (w - spanX * scale) / 2
  const oy = (h - spanY * scale) / 2

  const px = (x: number) => (ox + (x - minX) * k * scale).toFixed(1)
  const py = (y: number) => (oy + (maxY - y) * scale).toFixed(1)

  const d = polys
    .map((rings) =>
      rings
        .map((ring) => 'M ' + ring.map(([x, y]) => `${px(x)} ${py(y)}`).join(' L ') + ' Z')
        .join(' '),
    )
    .join(' ')

  // Échelle graphique : plus grande valeur « ronde » qui tient dans 45 % du cadre
  const pxParMetre = scale / M_PAR_DEGRE
  const metres = [...ECHELLES].reverse().find((m) => m * pxParMetre <= w * 0.45) ?? ECHELLES[0]
  const largeurM = Math.round(spanX * M_PAR_DEGRE)
  const hauteurM = Math.round(spanY * M_PAR_DEGRE)

  return (
    <View>
      <View style={s.plan}>
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <Path d={d} fill={C.brand} fillOpacity={0.28} stroke={C.dark} strokeWidth={1.4} fillRule="evenodd" />
        </Svg>

        <View style={s.north}>
          <Text style={s.northText}>N</Text>
          <Svg width={12} height={16} viewBox="0 0 12 16">
            <Polygon points="6,0 11,15 6,11 1,15" fill={C.dark} />
          </Svg>
        </View>

        <View style={s.scale}>
          <View style={[s.scaleBar, { width: metres * pxParMetre }]} />
          <Text style={s.scaleText}>{metres >= 1000 ? `${metres / 1000} km` : `${metres} m`}</Text>
        </View>
      </View>
      <Text style={s.planCaption}>
        Plan schématique · emprise d'environ {largeurM} m × {hauteurM} m.{'\n'}
        Document indicatif.
      </Text>
    </View>
  )
}

// ── Document ──────────────────────────────────────────────────

interface Props {
  d: ParcelDetail
  photo: string | null          // image déjà convertie en data URL (ou null)
  generatedAt: Date
}

export default function ParcelPdf({ d, photo, generatedAt }: Props) {
  const { parcelle: p, localisation: l, exploitant: e, enqueteur: s2, enquete } = d
  const { n, p: prenom } = splitName(e.nom, e.prenom)

  const edition = t(formatDate(generatedAt.toISOString()))
  const heure = generatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Document
      title={`Fiche parcellaire ${p.code}`}
      author="Géoportail Anacarde"
      subject="Fiche récapitulative de parcelle"
    >
      <Page size="A4" style={s.page}>
        {/* Bandeau */}
        <View style={s.header}>
          <View>
            <Text style={s.kicker}>GÉOPORTAIL ANACARDE</Text>
            <Text style={s.title}>Fiche parcellaire</Text>
            <Text style={s.subtitle}>Registre cartographique · Côte d'Ivoire</Text>
          </View>
          <View style={s.headRight}>
            <Text style={s.headLabel}>CODE PARCELLE</Text>
            <Text style={s.headCode}>{p.code}</Text>
            <Text style={s.headDate}>Édité le {edition} à {heure}</Text>
          </View>
        </View>
        <View style={s.accent} />

        <View style={s.body}>
          {/* ───── Exploitant ───── */}
          <Section title="Information sur l'exploitant">
            <View style={s.row}>
              <View>
                <View style={s.photo}>
                  {photo ? (
                    <Image src={photo} style={{ width: 92, height: 114, objectFit: 'cover' }} />
                  ) : (
                    <Silhouette />
                  )}
                </View>
                {!photo && <Text style={[s.photoNote, { textAlign: 'center', marginRight: 18 }]}>PHOTO NON DISPONIBLE</Text>}
              </View>

              <View style={[s.grid, { flex: 1 }]}>
                <Field label="Nom" value={n} />
                <Field label="Prénom(s)" value={prenom} />
                <Field label="Code exploitant" value={e.code} mono />
                <Field label="Téléphone" value={formatPhone(e.contacts)} />
                <Field label="Date de naissance" value={formatDate(e.date_naissance)} />
                <Field label="Lieu de naissance" value={titleCase(e.lieu_naissance)} />
                <Field label="Nationalité" value={titleCase(e.nationalite)} />
                <Field label="Situation matrimoniale" value={titleCase(e.situation_matrimoniale)} />
                <Field label="Profession" value={titleCase(e.profession)} />
                <Field label="Niveau d'instruction" value={titleCase(e.niveau_instruction)} />
              </View>
            </View>
          </Section>

          {/* ───── Parcelle ───── */}
          <Section title="Information sur la parcelle">
            <View style={s.row}>
              <View style={[s.grid, { flex: 1 }]}>
                <Field label="Code de la parcelle" value={p.code} mono full />
                <Field label="Superficie tracée" value={formatHa(p.superficie_ha)} />
                <Field label="Année de mise en place" value={p.annee_mise_place?.toString()} />
                <Field label="Mode de faire-valoir" value={titleCase(p.mode_faire_valoir)} />
                <Field label="Géoréférencée le" value={formatDate(p.date_georeferencement)} />
                <Field label="Région" value={titleCase(l.region)} />
                <Field label="Département" value={titleCase(l.departement)} />
                <Field label="Sous-préfecture" value={titleCase(l.sous_prefecture)} />
                <Field label="Localité" value={titleCase(l.localite)} />
                <Field label="Quartier" value={titleCase(l.quartier)} />
                <Field label="Latitude" value={formatCoord(p.lat, 'lat')} mono />
                <Field label="Longitude" value={formatCoord(p.lng, 'lng')} mono />
              </View>

              <Plan geometry={p.geometrie} w={190} h={214} />
            </View>
          </Section>

          {/* ───── Enquêteur ───── */}
          <Section title="Information sur l'enquêteur">
            {s2 ? (
              <View style={s.grid}>
                <Field label="Nom et prénom(s)" value={titleCase(s2.nom_complet)} full />
                <Field label="Code enquêteur" value={s2.code} mono />
                <Field label="Téléphone" value={formatPhone(s2.contact)} />
                <Field label="Date de l'enquête" value={formatDate(enquete?.date)} />
                <Field label="N° de questionnaire" value={enquete?.numero_questionnaire} mono />
              </View>
            ) : (
              <Text style={[s.value, s.empty]}>Aucun enquêteur n'est renseigné pour cette parcelle.</Text>
            )}
          </Section>
        </View>

        {/* Pied de page, répété sur chaque page */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Document généré automatiquement depuis la base du géoportail · {p.code}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}