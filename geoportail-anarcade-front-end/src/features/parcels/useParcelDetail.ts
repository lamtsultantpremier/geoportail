import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'

export interface ParcelDetail {
  parcelle: {
    id: number
    code: string
    annee_mise_place: number | null
    superficie_ha: number | null
    mode_faire_valoir: string | null
    date_georeferencement: string | null
    lng: number | null
    lat: number | null
    geometrie: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  }
  localisation: {
    district: string | null
    region: string | null
    departement: string | null
    sous_prefecture: string | null
    localite: string | null
    quartier: string | null
  }
  exploitant: {
    id: number
    code: string
    nom: string | null
    prenom: string | null
    date_naissance: string | null
    lieu_naissance: string | null
    pays_naissance: string | null
    situation_matrimoniale: string | null
    profession: string | null
    nationalite: string | null
    contacts: string | null
    niveau_instruction: string | null
    code_menage: string | null
    photo_url: string | null
  }
  enqueteur: {
    id: number
    code: string | null
    nom_complet: string | null
    contact: string | null
  } | null
  enquete: {
    date: string | null
    numero_questionnaire: string | null
  } | null
}

export function useParcelDetail(id: string | null) {
  return useQuery({
    queryKey: ['parcel-detail', id],
    enabled: Boolean(id),
    queryFn: ({ signal }) => apiGet<ParcelDetail>(`/parcelles/${id}/`, {}, signal),
    staleTime: 1000 * 60 * 5,
  })
}