from parcelles import views
from parcelles.views import (
    liste_regions_avec_parcelles,
    liste_departements_avec_parcelles,
    liste_sous_prefectures_avec_parcelles,
    liste_localites_avec_parcelles,
    liste_quartiers_avec_parcelles,
    liste_parcelles,
    stats_parcelles,
    points_parcelles,
    polygones_parcelles,
    fiche_parcelle,
    recherche_parcelles,
    export_parcelles,
    liste_exploitants_api,
    fiche_exploitant
)
"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path

urlpatterns = [
    # Filtres
    path(
        "filtres/regions/",
        liste_regions_avec_parcelles,
        name="regions-avec-parcelles",
    ),
    path(
        "filtres/departements/",
        liste_departements_avec_parcelles,
        name="departements-avec-parcelles",
    ),
    path(
        "filtres/sous-prefectures/",
        liste_sous_prefectures_avec_parcelles,
        name="sous-prefectures-avec-parcelles",
    ),
    path(
        "filtres/localites/",
        liste_localites_avec_parcelles,
        name="localites-avec-parcelles",
    ),
    path(
        "filtres/quartiers/",
        liste_quartiers_avec_parcelles,
        name="quartiers-avec-parcelles",
    ),
    path("parcelles/stats/", stats_parcelles, name="stats-parcelles"),
    path(
        "parcelles/",
        liste_parcelles,
        name="liste-parcelles",
    ),
    path("parcelles/points/", points_parcelles, name="points-parcelles"),
    path("parcelles/geojson/", polygones_parcelles, name="polygones-parcelles"),
    path("parcelles/<int:id_parc>/",fiche_parcelle,name="fiche-parcelle"),
    path("parcelles/recherche/",recherche_parcelles,name="recherche-parcelles"),
    path("parcelles/export/",export_parcelles,name="export-parcelles"),
    path("exploitants/", liste_exploitants_api, name="liste-exploitants"),
    path("exploitants/<int:id_expl>/", fiche_exploitant, name="fiche-exploitant"),



    # path('exploitants/<int:id>/',views.detail_exploitant,name="detail_exploitant")

]
