import type { Farmer, Parcel,Surveyor } from '../types'

const poly = (lng: number, lat: number, r = 0.0035): GeoJSON.Polygon => {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i
    return [lng + r * Math.cos(a), lat + r * 0.8 * Math.sin(a)]
  })
  return { type: 'Polygon', coordinates: [[...pts, pts[0]]] }
}

export const farmers: Farmer[] = [
  { id: 'EX-0087', name: 'Adama Koné', activity: "Producteur d'anacarde", phone: '+225 07 00 00 00 87', cooperative: 'Coopérative Anacarde du Poro', village: 'Kaforo' },
  { id: 'EX-0091', name: 'Fatou Ouattara', activity: "Producteur d'anacarde", phone: '+225 07 00 00 00 87', cooperative: 'Coopérative Anacarde du Poro', village: 'Napié' },
  { id: 'EX-0102', name: 'Seydou Traoré', activity: "Producteur d'anacarde",  phone: '+225 07 00 00 00 87',cooperative: 'Coopérative Anacarde du Poro', village: 'Nangounkaha' },
  { id: 'EX-0110', name: 'Issouf Coulibaly', activity: "Producteur d'anacarde",  phone: '+225 07 00 00 00 87',cooperative: 'Coopérative Anacarde du Poro', village: 'Tioroniaradougou' },
]

export const farmersById: Record<string, Farmer> = Object.fromEntries(
  farmers.map((f) => [f.id, f]),
)

const mk = (
  id: string, farmerId: string, areaHa: number,
  region: string, department: string, locality: string,
  lng: number, lat: number,
): Parcel => ({
  id, farmerId, areaHa, region, department,
  subPrefecture: locality, locality,
  crop: 'Anacarde', status: 'valide',
  source: 'Relevé GNSS terrain', collectedAt: '2026-09-12',
  geometry: poly(lng, lat),
})

export const parcels: Parcel[] = [
  mk('P-0142', 'EX-0087', 4.8,  'Poro',     'Korhogo',     'Kaforo',      -5.60, 9.32),
  mk('P-0143', 'EX-0087', 3.1,  'Poro',     'Korhogo',     'Kaforo',      -5.59, 9.31),
  mk('P-0201', 'EX-0091', 5.6,  'Poro',     'Korhogo',     'Napié',       -5.58, 9.33),
  mk('P-0301', 'EX-0102', 7.2,  'Gontougo', 'Bondoukou',   'Tanda',       -3.17, 7.80),
  mk('P-0302', 'EX-0110', 3.6,  'Gontougo', 'Bondoukou',   'Bondoukou',   -2.80, 8.04),
  mk('P-0401', 'EX-0087', 6.4,  'Gbêkê',    'Bouaké',      'Bouaké',      -5.03, 7.69),
  mk('P-0402', 'EX-0091', 4.1,  'Gbêkê',    'Béoumi',      'Béoumi',      -5.67, 7.67),
  mk('P-0501', 'EX-0102', 5.0,  'Worodougou','Séguéla',    'Séguéla',     -6.67, 7.96),
  mk('P-0601', 'EX-0110', 8.3,  'Tonkpi',   'Man',         'Man',         -7.55, 7.41),
  mk('P-0701', 'EX-0087', 4.4,  'Kabadougou','Odienné',    'Odienné',     -7.56, 9.51),
  mk('P-0801', 'EX-0091', 3.9,  'Haut-Sassandra','Daloa',  'Daloa',       -6.45, 6.88),
  mk('P-0901', 'EX-0102', 6.0,  'Bélier',   'Yamoussoukro','Yamoussoukro',-5.28, 6.82),
]
export const surveyors: Surveyor[] = [
  { id: 'ENQ-012', lastName: 'Kouassi', firstName: 'Brice', phone: '+225 05 00 00 00 12', email: 'enqueteur12@exemple.ci', organization: 'Équipe SIG', zone: 'Poro · Tchologo' },
  { id: 'ENQ-018', lastName: 'Yao', firstName: 'Marie', phone: '+225 01 00 00 00 18', organization: 'ANADER', zone: 'Gontougo · Bounkani' },
  { id: 'ENQ-025', lastName: 'Diabaté', firstName: 'Salif', organization: 'Équipe SIG', zone: 'Gbêkê · Worodougou' },
]

export const surveyorsById: Record<string, Surveyor> = Object.fromEntries(
  surveyors.map((s) => [s.id, s]),
)
const mk1 = (
  id: string, farmerId: string, areaHa: number,
  region: string, department: string, locality: string,
  lng: number, lat: number,
  surveyorId?: string,
): Parcel => ({
  id, farmerId, areaHa, region, department,
  subPrefecture: locality, locality,
  crop: 'Anacarde', status: 'valide',
  source: 'Relevé GNSS terrain', collectedAt: '2026-09-12',
  surveyorId, surveyDate: '2026-09-12',
  geometry: poly(lng, lat),
})
mk1('P-0142', 'EX-0087', 4.8, 'Poro',     'Korhogo',   'Kaforo', -5.60, 9.32, 'ENQ-012'),
mk1('P-0143', 'EX-0087', 3.1, 'Poro',     'Korhogo',   'Kaforo', -5.59, 9.31, 'ENQ-012'),
mk1('P-0201', 'EX-0091', 5.6, 'Poro',     'Korhogo',   'Napié',  -5.58, 9.33),            // sans enquêteur
mk1('P-0301', 'EX-0102', 7.2, 'Gontougo', 'Bondoukou', 'Tanda',  -3.17, 7.80, 'ENQ-018'),
mk1('P-0302', 'EX-0110', 3.6, 'Gontougo', 'Bondoukou', 'Bondoukou', -2.80, 8.04, 'ENQ-018'),
mk1('P-0401', 'EX-0087', 6.4, 'Gbêkê',    'Bouaké',    'Bouaké', -5.03, 7.69, 'ENQ-025')