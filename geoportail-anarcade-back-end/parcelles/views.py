
import json

from django.db import connection

import csv
from datetime import date

from django.db.models import Q
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse

from django.views.decorators.http import require_GET
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import (
    Region,
    Departement,
    SousPrefecture,
    Localite,
    Quartier,
    ParcelleCorrecte,
    District,
    Enquete,
    Georeferencement
)

from django.db.models import Func, TextField
from django.shortcuts import get_object_or_404
from parcelles.pagination import ParcellePagination
from decimal import Decimal, InvalidOperation
from django.db.models import Case, Count, DecimalField, Sum, Value, When
from django.db.models.functions import Cast, Replace
from django.db.models import BooleanField, FloatField

class AsGeoJSON(Func):
    function = "ST_AsGeoJSON"
    output_field = TextField()

@api_view(['GET'])
def district_avec_exploitants(request):
   districts=District.objects.filter(region__departement__sousprefecture__localite__quartier__menage__exploitant__isnull=False)\
                                    .annotate(geojson=AsGeoJSON("geo_dist"))\
                                    .values("id_dist", "lib_dist", "geo_dist","geojson")\
                                    .distinct()\
                                    .order_by("lib_dist")
   return Response([
       {
            "id_dist": district["id_dist"],
            "lib_dist": district["lib_dist"],
            # "geometry": json.loads(district["geojson"]) if district["geojson"] else None,
      }
    for district in districts
   ])

@api_view(['GET'])
def get_regions_from_district(request,id_dist):
    district= get_object_or_404(District,id_dist=id_dist)

    regions=Region.objects.filter(
         id_dist=district.id_dist,
         departement__sousprefecture__localite__quartier__menage__exploitant__isnull=False,
    ).annotate(geojson=AsGeoJSON("geom_reg"))\
    .values("id_reg", "lib_reg","geojson")\
    .distinct()\
    .order_by("lib_reg")

    return Response(

       {
        "district":{
            "id":district.id_dist,
            "nom":district.lib_dist
        },
        "regions":[{
        "id_reg":region["id_reg"],
        "lib_reg":region["lib_reg"],
        # "geometry":json.loads(region["geojson"]) if region["geojson"] else None
      }for region in regions]
      }
     

    )
@api_view(['GET'])
def get_departments_from_region(request,id_reg):

    region = get_object_or_404(Region,id_reg=id_reg)

    departements=Departement.objects.filter(
        id_reg=region.id_reg, 
        sousprefecture__localite__quartier__menage__exploitant__isnull=False,
    ).annotate(geojson=AsGeoJSON("geom_dept"))\
    .distinct()\
    .values("id_dept","lib_dept","geojson")

    return Response(
        
        {
            "region":{
                "id":region.id_reg,
                "nom":region.lib_reg
            },
            "departements":[
            {
            "id_dept": departement["id_dept"],
            "lib_dept":departement["lib_dept"],
        #   "geometry":json.loads(departement["geojson"]) if departement["geojson"] else None
          } for departement in departements
        ]}
    )
@api_view()
def get_sous_pref_from_departements(request,id_dept):
    departement = get_object_or_404(Departement, id_dept=id_dept)

    sousprefectures = (
        SousPrefecture.objects
        .filter(id_dept=departement.id_dept,
                localite__quartier__menage__exploitant__isnull=False,)
        .annotate(geojson=AsGeoJSON('geo_s_pref'))
        .distinct()
        .values("id_s_pref", "lib_s_pref","geojson")
        .order_by("lib_s_pref")
    )

    return Response({
        "departement": {
            "id": departement.id_dept,
            "nom": departement.lib_dept,
        },
        "sousprefectures": [{
            "id_sp":sousprefecture["id_s_pref"],
            "nom":sousprefecture["lib_s_pref"],
            # "geometry":json.loads(sousprefecture["geojson"]) if sousprefecture["geojson"] else None
        } for sousprefecture in sousprefectures 
        ],
    })

@api_view(['GET'])
def get_loc_from_sous_pref(request,id_spf):
    sous_prefecture = get_object_or_404(SousPrefecture,id_s_pref=id_spf)

    localites = Localite.objects\
                        .filter(id_s_pref=sous_prefecture.id_s_pref,
                                quartier__menage__exploitant__isnull=False)\
                        .annotate(geojson=AsGeoJSON("geo_loc"))\
                        .distinct()\
                        .values("id_loc",
                                "lib_loc",
                                "geojson",
                                "id_zone_denombrement",
                                "id_zone_denombrement__code_zone")\
                        .order_by("lib_loc")
    resultat = [
        {
            "id": localite["id_loc"],
            "nom": localite["lib_loc"],
            "code_zone_denombrement" : localite["id_zone_denombrement__code_zone"] if localite["id_zone_denombrement"] else None
        } for localite in localites
    ]
    return Response({
        "sous_prefecture":{
            "id":sous_prefecture.id_s_pref,
            "nom": sous_prefecture.lib_s_pref,
            },
        "localites":[
            {
                "id": localite["id_loc"],
                "nom": localite["lib_loc"],
                "code_zone_denombrement" : localite["id_zone_denombrement__code_zone"] if localite["id_zone_denombrement"] else None
            } for localite in localites
            ]      
    }
    )
@api_view(["GET"])
def quarter_from_locality(request, localite_id):
    localite = get_object_or_404(Localite, id_loc=localite_id)

    quartiers = (
        Quartier.objects
        .filter(
            id_loc=localite.id_loc,
            menage__exploitant__isnull=False,
        )
        .values("id_quar", "lib_quar")
        .distinct()
        .order_by("lib_quar")
    )

    return Response({
        "localite": {
            "id": localite.id_loc,
            "nom": localite.lib_loc,
        },
        "quartiers": list(quartiers),
    })

@api_view(["GET"])
def districts_concerned(request):
      districts = (
        District.objects
        .filter(
            region__departement__sousprefecture__localite__quartier__menage__exploitant__parcellecorrecte__isnull=False
        )
        .values("id_dist", "lib_dist")
        .distinct()
        .order_by("lib_dist")
    )

      return Response(list(districts))



@api_view(["GET"])
def parcelles_par_district(request, district_id):
    district = get_object_or_404(District, id_dist=district_id)

    parcelles = (
        ParcelleCorrecte.objects
        .filter(
            id_expl__id_men__id_quar__id_loc__id_s_pref__id_dept__id_reg__id_dist=district.id_dist
        )
        .select_related(
            "id_expl",
            "id_enqt",
            "id_expl__id_men",
        )
        .order_by("id_parc")
    )

    resultat = [
        {
            "id": parcelle.id_parc,
            "code": parcelle.code_parc,
            "annee_mise_place": parcelle.annee_mise_place,
            "geom_parc": parcelle.geom_parc,
            "superficie_tracee": parcelle.superficie_tracee,
            "exploitant": {
                "id": parcelle.id_expl.id_expl,
                "code": parcelle.id_expl.code_expl,
                "nom": parcelle.id_expl.nom_expl,
                "prenom": parcelle.id_expl.pren_expl,
                "contacts": parcelle.id_expl.contacts,
            },
            "enqueteur": (
                {
                    "id": parcelle.id_enqt.id_enqt,
                    "nom": parcelle.id_enqt.nom_pren_enqt,
                    "contact": parcelle.id_enqt.cont_enqt,
                }
                if parcelle.id_enqt
                else None
            ),
        }
        for parcelle in parcelles
    ]

    return Response({
        "district": {
            "id": district.id_dist,
            "nom": district.lib_dist,
        },
        "parcelles": resultat,
    })




# Chemin depuis ParcelleCorrecte jusqu'à chaque niveau géographique.
# Chaque chemin mène à la clé primaire de l'objet géographique.
CHEMINS_GEO = {
    "region": (
        "id_expl__id_men__id_quar__id_loc__id_s_pref"
        "__id_dept__id_reg__id_reg"
    ),
    "departement": (
        "id_expl__id_men__id_quar__id_loc__id_s_pref"
        "__id_dept__id_dept"
    ),
    "sous_prefecture": (
        "id_expl__id_men__id_quar__id_loc__id_s_pref"
        "__id_s_pref"
    ),
    "localite": (
        "id_expl__id_men__id_quar__id_loc__id_loc"
    ),
    "quartier": (
        "id_expl__id_men__id_quar__id_quar"
    ),
}

# Champs utilisés pour retrouver le nom et l'identifiant de chaque niveau.
MODELES_GEO = {
    "region": (Region, "id_reg", "lib_reg"),
    "departement": (Departement, "id_dept", "lib_dept"),
    "sous_prefecture": (SousPrefecture, "id_s_pref", "lib_s_pref"),
    "localite": (Localite, "id_loc", "lib_loc"),
    "quartier": (Quartier, "id_quar", "lib_quar"),
}

# Pour chaque filtre fourni, le chemin partant de ParcelleCorrecte.
CHEMINS_FILTRES = {
    "region_id": "id_expl__id_men__id_quar__id_loc__id_s_pref__id_dept__id_reg__id_reg",
    "departement_id": "id_expl__id_men__id_quar__id_loc__id_s_pref__id_dept__id_dept",
    "sous_prefecture_id": "id_expl__id_men__id_quar__id_loc__id_s_pref__id_s_pref",
    "localite_id": "id_expl__id_men__id_quar__id_loc__id_loc",
    "quartier_id": "id_expl__id_men__id_quar__id_quar",
}

SUPERFICIE_VALIDE = r"^[0-9]+([.,][0-9]+)?$"
DECIMAL_HA = DecimalField(max_digits=14, decimal_places=6)
def avec_superficie(queryset):
    """
    Ajoute `superficie_ha` : le texte "0,357" converti en nombre.
    Les valeurs absentes ou illisibles donnent NULL (pas d'erreur SQL).
    """
    return queryset.annotate(
        superficie_ha=Case(
            When(
                superficie_tracee__regex=SUPERFICIE_VALIDE,
                then=Cast(
                    Replace("superficie_tracee", Value(","), Value(".")),
                    DECIMAL_HA,
                ),
            ),
            default=None,
            output_field=DECIMAL_HA,
        )
    )


def lire_decimal(valeur):
    """Convertit un paramètre d'URL en Decimal, ou None s'il est invalide."""
    try:
        return Decimal(str(valeur).replace(",", "."))
    except (InvalidOperation, TypeError):
        return None



def parcelles_filtrees(params):
    """Renvoie les parcelles correspondant aux filtres géographiques reçus."""
    queryset = ParcelleCorrecte.objects.select_related(
        "id_expl",
        "id_expl__id_men",
        "id_expl__id_men__id_quar",
        "id_expl__id_men__id_quar__id_loc",
        "id_expl__id_men__id_quar__id_loc__id_s_pref",
        "id_expl__id_men__id_quar__id_loc__id_s_pref__id_dept",
        "id_expl__id_men__id_quar__id_loc__id_s_pref__id_dept__id_reg",
        "id_enqt",
    )

    for parametre, chemin in CHEMINS_FILTRES.items():
        valeur = params.get(parametre)
        if valeur:
            queryset = queryset.filter(**{chemin: valeur})

    queryset = avec_superficie(queryset)
    sup_min = lire_decimal(params.get("superficie_min"))
    sup_max = lire_decimal(params.get("superficie_max"))
    if sup_min is not None:
        queryset = queryset.filter(superficie_ha__gte=sup_min)
    if sup_max is not None:
        queryset = queryset.filter(superficie_ha__lte=sup_max)

    return queryset


def options_geographiques(request, niveau):
    """
    Endpoint interne commun aux listes de régions, départements,
    sous-préfectures, localités et quartiers.
    """
    if niveau not in MODELES_GEO:
        return Response({"detail": "Niveau géographique inconnu."}, status=400)

    # Les options sont calculées à partir des parcelles qui correspondent
    # aux filtres déjà sélectionnés.
    parcelles = parcelles_filtrees(request.query_params)
    chemin = CHEMINS_GEO[niveau]

    ids = (
        parcelles
        .values_list(chemin, flat=True)
        .distinct()
    )

    modele, champ_id, champ_nom = MODELES_GEO[niveau]

    objets = (
        modele.objects
        .filter(**{f"{champ_id}__in": ids})
        .values(champ_id, champ_nom)
        .order_by(champ_nom)
    )

    return Response([
        {
            "id": objet[champ_id],
            "nom": objet[champ_nom],
        }
        for objet in objets
    ])


@api_view(["GET"])
def liste_regions_avec_parcelles(request):
    return options_geographiques(request, "region")


@api_view(["GET"])
def liste_departements_avec_parcelles(request):
    return options_geographiques(request, "departement")


@api_view(["GET"])
def liste_sous_prefectures_avec_parcelles(request):
    return options_geographiques(request, "sous_prefecture")


@api_view(["GET"])
def liste_localites_avec_parcelles(request):
    return options_geographiques(request, "localite")


@api_view(["GET"])
def liste_quartiers_avec_parcelles(request):
    return options_geographiques(request, "quartier")


@api_view(["GET"])
def liste_parcelles(request):
    """
    Renvoie les parcelles correspondant aux filtres, avec les informations
    de l'exploitant, de l'enquêteur et la géométrie.
    """
    parcelles = (
        parcelles_filtrees(request.query_params)
        .annotate(geojson=AsGeoJSON("geom_parc"))
        .order_by("id_parc")
    )

    resultat = []

    pagination = ParcellePagination()
    page = pagination.paginate_queryset(parcelles,request)

    for parcelle in page:
        # ST_AsGeoJSON renvoie du JSON sous forme de texte.
        # json.loads le convertit en objet JSON dans la réponse de l'API.
        try:
            geometrie = json.loads(parcelle.geojson) if parcelle.geojson else None
        except (TypeError, json.JSONDecodeError):
            geometrie = None

        exploitant = parcelle.id_expl
        enqueteur = parcelle.id_enqt

        resultat.append({
            "id": parcelle.id_parc,
            "code": parcelle.code_parc,
            "annee_mise_place": parcelle.annee_mise_place,
            "superficie_tracee": parcelle.superficie_tracee,
            "geometry": geometrie,
            "exploitant": {
                "id": exploitant.id_expl,
                "code": exploitant.code_expl,
                "nom": exploitant.nom_expl,
                "prenom": exploitant.pren_expl,
                "contacts": exploitant.contacts,
            },
            "enqueteur": (
                {
                    "id": enqueteur.id_enqt,
                    "nom": enqueteur.nom_pren_enqt,
                    "contact": enqueteur.cont_enqt,
                }
                if enqueteur
                else None
            ),
        })

    return pagination.get_paginated_response(resultat)

@api_view(["GET"])
def stats_parcelles(request):
    """Compteurs globaux pour les filtres reçus."""
    resume = parcelles_filtrees(request.query_params).aggregate(
        parcelles=Count("id_parc"),
        exploitants=Count("id_expl", distinct=True),
        hectares=Sum("superficie_ha"),
    )
    return Response({
        "parcelles": resume["parcelles"],
        "exploitants": resume["exploitants"],
        "hectares": round(float(resume["hectares"] or 0), 2),
    })

# ── Carte ──────────────────────────────────────────────────────────

class CoordX(Func):
    """Longitude d'un point situé à l'intérieur de la parcelle."""
    template = "ST_X(ST_PointOnSurface(%(expressions)s))"
    output_field = FloatField()


class CoordY(Func):
    """Latitude d'un point situé à l'intérieur de la parcelle."""
    template = "ST_Y(ST_PointOnSurface(%(expressions)s))"
    output_field = FloatField()


class GeoJSONSimplifie(Func):
    """Géométrie allégée (tolérance ≈ 2 m, 6 décimales) pour l'affichage."""
    template = "ST_AsGeoJSON(ST_SimplifyPreserveTopology(%(expressions)s, 0.00002), 6)"
    output_field = TextField()


LIMITE_POLYGONES = 1500


@api_view(["GET"])
def points_parcelles(request):
    """
    Un point par parcelle (format compact) : [id, code, lng, lat].
    Respecte tous les filtres, sans pagination.
    """
    lignes = (
        parcelles_filtrees(request.query_params)
        .filter(geom_parc__isnull=False)
        .annotate(lng=CoordX("geom_parc"), lat=CoordY("geom_parc"))
        .values_list("id_parc", "code_parc", "lng", "lat")
        .order_by()
    )
    points = [
        [id_parc, code, round(lng, 5), round(lat, 5)]
        for id_parc, code, lng, lat in lignes
        if lng is not None and lat is not None
    ]
    return Response({"count": len(points), "points": points})


@api_view(["GET"])
def polygones_parcelles(request):
    """
    Polygones des parcelles qui touchent la zone `bbox=ouest,sud,est,nord`.
    Accepte les mêmes filtres que les autres endpoints.
    """
    try:
        ouest, sud, est, nord = (
            float(v) for v in request.query_params.get("bbox", "").split(",")
        )
    except ValueError:
        return Response({"detail": "bbox attendu : ouest,sud,est,nord"}, status=400)

    lignes = list(
        parcelles_filtrees(request.query_params)
        .filter(geom_parc__isnull=False)
        .extra(
            where=[
                "ST_Intersects(parcelle_correcte.geom_parc, "
                "ST_MakeEnvelope(%s, %s, %s, %s, 4326))"
            ],
            params=[ouest, sud, est, nord],
        )
        .annotate(geojson=GeoJSONSimplifie("geom_parc"))
        .values_list("id_parc", "code_parc", "geojson")
        .order_by("id_parc")[: LIMITE_POLYGONES + 1]
    )

    tronque = len(lignes) > LIMITE_POLYGONES
    features = [
        {
            "type": "Feature",
            "geometry": json.loads(geojson) if geojson else None,
            "properties": {"id": id_parc, "code": code},
        }
        for id_parc, code, geojson in lignes[:LIMITE_POLYGONES]
    ]
    return Response({
        "type": "FeatureCollection",
        "truncated": tronque,
        "features": features,
    })

# ── Fiche d'une parcelle ───────────────────────────────────────────

def _suivre(objet, *chemin):
    """Suit une chaîne d'attributs en s'arrêtant proprement sur un None."""
    for nom in chemin:
        if objet is None:
            return None
        objet = getattr(objet, nom, None)
    return objet


def _iso(date):
    return date.isoformat() if date else None


def _url_photo(lien):
    """Lien de photo utilisable par le navigateur (relatif à MEDIA_URL si besoin)."""
    if not lien or not lien.strip():
        return None
    lien = lien.strip()
    if lien.startswith(("http://", "https://")):
        return lien
    return settings.MEDIA_URL.rstrip("/") + "/" + lien.lstrip("/")


@api_view(["GET"])
def fiche_parcelle(request, id_parc):
    """Parcelle + localisation + exploitant + enquêteur + enquête, en un appel."""
    queryset = (
        avec_superficie(ParcelleCorrecte.objects)
        .select_related(
            "id_mode",
            "id_enqt",
            "id_expl",
            "id_expl__id_niv",
            "id_expl__id_men",
            "id_expl__id_men__id_quar__id_loc__id_s_pref"
            "__id_dept__id_reg__id_dist",
        )
        .annotate(lng=CoordX("geom_parc"), lat=CoordY("geom_parc"),geojson=GeoJSONSimplifie("geom_parc"),)
    )
    parcelle = get_object_or_404(queryset, id_parc=id_parc)

    exploitant = parcelle.id_expl
    enqueteur = parcelle.id_enqt
    menage = exploitant.id_men
    quartier = _suivre(menage, "id_quar")
    localite = _suivre(quartier, "id_loc")
    sous_pref = _suivre(localite, "id_s_pref")
    departement = _suivre(sous_pref, "id_dept")
    region = _suivre(departement, "id_reg")
    district = _suivre(region, "id_dist")

    # Enquête menée auprès de cet exploitant (par cet enquêteur s'il est connu)
    enquetes = Enquete.objects.filter(id_expl=exploitant.id_expl)
    if enqueteur:
        enquetes = enquetes.filter(id_enqt=enqueteur.id_enqt)
    enquete = enquetes.order_by("-date_enq").first()

    georef = (
        Georeferencement.objects.filter(id_parc=parcelle.id_parc)
        .order_by("-date_geor")
        .first()
    )

    return Response({
        "parcelle": {
            "id": parcelle.id_parc,
            "code": parcelle.code_parc,
            "annee_mise_place": parcelle.annee_mise_place,
            "superficie_ha": (
                float(parcelle.superficie_ha)
                if parcelle.superficie_ha is not None else None
            ),
            "mode_faire_valoir": _suivre(parcelle, "id_mode", "lib_mode"),
            "date_georeferencement": _iso(georef.date_geor) if georef else None,
            "lng": parcelle.lng,
            "lat": parcelle.lat,
            "geometrie": json.loads(parcelle.geojson) if parcelle.geojson else None,
        },
        "localisation": {
            "district": _suivre(district, "lib_dist"),
            "region": _suivre(region, "lib_reg"),
            "departement": _suivre(departement, "lib_dept"),
            "sous_prefecture": _suivre(sous_pref, "lib_s_pref"),
            "localite": _suivre(localite, "lib_loc"),
            "quartier": _suivre(quartier, "lib_quar"),
        },
        "exploitant": {
            "id": exploitant.id_expl,
            "code": exploitant.code_expl,
            "nom": exploitant.nom_expl,
            "prenom": exploitant.pren_expl,
            "date_naissance": _iso(exploitant.date_nais),
            "lieu_naissance": exploitant.lieu_nais,
            "pays_naissance": exploitant.pays_nais,
            "situation_matrimoniale": exploitant.situa_mat,
            "profession": exploitant.profession,
            "nationalite": exploitant.nationalite,
            "contacts": exploitant.contacts,
            "niveau_instruction": _suivre(exploitant, "id_niv", "lib_niv"),
            "code_menage": _suivre(menage, "code_men"),
            "photo_url": _url_photo(exploitant.lien_photo),
        },
        "enqueteur": (
            {
                "id": enqueteur.id_enqt,
                "code": enqueteur.code_enqt,
                "nom_complet": enqueteur.nom_pren_enqt,
                "contact": enqueteur.cont_enqt,
            }
            if enqueteur else None
        ),
        "enquete": (
            {
                "date": _iso(enquete.date_enq),
                "numero_questionnaire": enquete.num_questionnaire,
            }
            if enquete else None
        ),
       
    })

# ── Recherche ──────────────────────────────────────────────────────

@api_view(["GET"])
def recherche_parcelles(request):
    """
    Cherche dans le code parcelle, le nom/prénom/code de l'exploitant et la localité.
    Chaque mot saisi doit se retrouver quelque part ("kouassi erick" fonctionne).
    Respecte les filtres reçus. 10 résultats au maximum.
    """
    terme = request.query_params.get("q", "").strip()
    if len(terme) < 2:
        return Response({"results": []})

    queryset = parcelles_filtrees(request.query_params).filter(geom_parc__isnull=False)
    for mot in terme.split()[:5]:
        queryset = queryset.filter(
            Q(code_parc__icontains=mot)
            | Q(id_expl__code_expl__icontains=mot)
            | Q(id_expl__nom_expl__icontains=mot)
            | Q(id_expl__pren_expl__icontains=mot)
            | Q(id_expl__id_men__id_quar__id_loc__lib_loc__icontains=mot)
        )

    lignes = (
        queryset
        .annotate(lng=CoordX("geom_parc"), lat=CoordY("geom_parc"))
        .values(
            "id_parc", "code_parc",
            "id_expl__nom_expl", "id_expl__pren_expl",
            "id_expl__id_men__id_quar__id_loc__lib_loc",
            "lng", "lat",
        )
        .order_by("code_parc")[:10]
    )

    return Response({
        "results": [
            {
                "id": l["id_parc"],
                "code": l["code_parc"],
                "nom": l["id_expl__nom_expl"],
                "prenom": l["id_expl__pren_expl"],
                "localite": l["id_expl__id_men__id_quar__id_loc__lib_loc"],
                "lng": l["lng"],
                "lat": l["lat"],
            }
            for l in lignes
        ]
    })

# ── Export ─────────────────────────────────────────────────────────

LIMITE_EXPORT_GEOJSON = 5000
CHEMIN_LOC = "id_expl__id_men__id_quar__id_loc"
CHEMIN_SP = f"{CHEMIN_LOC}__id_s_pref"

ENTETES_CSV = [
    "Code parcelle", "Superficie (ha)", "Année de mise en place",
    "Code exploitant", "Nom", "Prénom", "Téléphone exploitant",
    "Enquêteur", "Téléphone enquêteur",
    "Région", "Département", "Sous-préfecture", "Localité", "Quartier",
]

CHAMPS_CSV = [
    "code_parc", "superficie_ha", "annee_mise_place",
    "id_expl__code_expl", "id_expl__nom_expl", "id_expl__pren_expl", "id_expl__contacts",
    "id_enqt__nom_pren_enqt", "id_enqt__cont_enqt",
    f"{CHEMIN_SP}__id_dept__id_reg__lib_reg",
    f"{CHEMIN_SP}__id_dept__lib_dept",
    f"{CHEMIN_SP}__lib_s_pref",
    f"{CHEMIN_LOC}__lib_loc",
    "id_expl__id_men__id_quar__lib_quar",
]


class _Echo:
    """Pseudo-fichier : csv.writer y 'écrit' et récupère la ligne formatée."""
    def write(self, valeur):
        return valeur


def _cellule(valeur):
    """Texte propre pour Excel ; neutralise les débuts de formule (= + - @)."""
    if valeur is None:
        return ""
    texte = str(valeur)
    return "'" + texte if texte[:1] in ("=", "+", "-", "@") else texte


@require_GET
def export_parcelles(request):
    """
    Export des parcelles filtrées.
    ?fmt=csv (défaut) : toutes les parcelles, en flux.
    ?fmt=geojson     : 5 000 parcelles au maximum, avec géométrie.
    Note : le paramètre ne s'appelle pas `format`, réservé par Django REST framework.
    """
    fmt = request.GET.get("fmt", "csv")
    queryset = parcelles_filtrees(request.GET).order_by("id_parc")
    jour = date.today().isoformat()

    if fmt == "geojson":
        lignes = list(
            queryset.filter(geom_parc__isnull=False)
            .annotate(geojson=AsGeoJSON("geom_parc"))
            .values_list(
                "code_parc", "superficie_ha", "annee_mise_place",
                "id_expl__code_expl", "id_expl__nom_expl", "id_expl__pren_expl",
                "geojson",
            )[: LIMITE_EXPORT_GEOJSON + 1]
        )
        tronque = len(lignes) > LIMITE_EXPORT_GEOJSON
        features = [
            {
                "type": "Feature",
                "geometry": json.loads(geojson) if geojson else None,
                "properties": {
                    "code": code,
                    "superficie_ha": float(sup) if sup is not None else None,
                    "annee_mise_place": annee,
                    "code_exploitant": code_expl,
                    "nom": nom,
                    "prenom": prenom,
                },
            }
            for code, sup, annee, code_expl, nom, prenom, geojson
            in lignes[:LIMITE_EXPORT_GEOJSON]
        ]
        reponse = HttpResponse(
            json.dumps({"type": "FeatureCollection", "truncated": tronque, "features": features}),
            content_type="application/geo+json",
        )
        reponse["Content-Disposition"] = f'attachment; filename="parcelles_anacarde_{jour}.geojson"'
        return reponse

    # CSV : séparateur ; et BOM UTF-8 pour qu'Excel (français) lise bien les accents
    lignes = queryset.values_list(*CHAMPS_CSV).iterator(chunk_size=2000)

    def flux():
        ecrivain = csv.writer(_Echo(), delimiter=";")
        yield "\ufeff"
        yield ecrivain.writerow(ENTETES_CSV)
        for ligne in lignes:
            ligne = list(ligne)
            if ligne[1] is not None:
                ligne[1] = str(ligne[1]).replace(".", ",")   # superficie : virgule décimale
            yield ecrivain.writerow([_cellule(v) for v in ligne])

    reponse = StreamingHttpResponse(flux(), content_type="text/csv; charset=utf-8")
    reponse["Content-Disposition"] = f'attachment; filename="parcelles_anacarde_{jour}.csv"'
    return reponse