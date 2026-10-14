create schema IF NOT exists stagging;

CREATE TABLE stagging.denombrements(
id_stagging BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "UUID" TEXT,
    "Q.1 Date de l'enquete" TEXT,
    "Q.2 Numero du questionnaire" TEXT,
    "Q.3 Nom et Prenom(s) de l'Enqueteur" TEXT,
    "Q.4 Coordonnees GPS" TEXT,
    "Q.5 Contact de l'enqueteur" TEXT,
    "Q.6 District" TEXT,
    "Q.7 Region" TEXT,
    "Q.8 Departement" TEXT,
    "Q.9 Sous-prefecture" TEXT,
    "Q.10 Secteur administratif" TEXT,
    "Q.11 Numero ZD" TEXT,
    "Q.12 Localite" TEXT,
    "Q.13 Quartier/Campement" TEXT,
    "Q.14 Milieu de residence" TEXT,
    "Q.15 Numero du menage" TEXT,
    "Q.16 Y a-t-il des exploitants d'anacarde dans le menage ?" TEXT,
    "Q.17 Nom du chef de menage" TEXT,
    "Q.18 Prenom du chef de menage" TEXT,
    "Q.19 Contact du chef de menage" TEXT,
    "Q.20 Nombre d'exploitants d'anacarde" TEXT,
    "Q.21 Le(s) exploitant(s) est (sont) present(s) ?" TEXT,
    "Q.22 Y a-t-il un representant de l'exploitant ?" TEXT,
    "Q.23 Nom du representant" TEXT,
    "Q.24 Prenom du representant" TEXT,
    "Q.25 Contact du representant" TEXT,

    "Statut" TEXT,
    "Source" TEXT,
    "Cree le" TEXT,

    date_import TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);