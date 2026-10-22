export type ParcelStatus = 'valide' | 'a_verifier' | 'vigilance'

export interface Farmer {
  id: string               // ex. "EX-0087"
  name: string
  activity: string
  phone?: string
  cooperative: string
  village: string
}

export interface Parcel {
  id: string               // ex. "ANC-GON-0009"
  farmerId: string
  crop: string
  areaHa: number
  status: ParcelStatus
  region: string
  department: string
  subPrefecture: string
  locality: string
  collectedAt: string      // ISO date
  source: string           // ex. "Relevé GNSS terrain"
  geometry: GeoJSON.Polygon
  surveyorId?: string
  surveyDate?:string
}

export interface Surveyor {
  id: string               // ex. "ENQ-012"
  lastName: string
  firstName: string
  phone?: string
  email?: string
  organization: string     // ex. "ANADER", "Coopérative", "Équipe SIG"
  zone: string             // zone d'intervention
}