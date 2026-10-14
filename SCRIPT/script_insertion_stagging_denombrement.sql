COPY stagging.denombrements(
"UUID" ,
    "Q.1 Date de l'enquete" ,
    "Q.2 Numero du questionnaire" ,
    "Q.3 Nom et Prenom(s) de l'Enqueteur" ,
    "Q.4 Coordonnees GPS" ,
    "Q.5 Contact de l'enqueteur" ,
    "Q.6 District" ,
    "Q.7 Region" ,
    "Q.8 Departement" ,
    "Q.9 Sous-prefecture" ,
    "Q.10 Secteur administratif" ,
    "Q.11 Numero ZD" ,
    "Q.12 Localite" ,
    "Q.13 Quartier/Campement" ,
    "Q.14 Milieu de residence" ,
    "Q.15 Numero du menage" ,
    "Q.16 Y a-t-il des exploitants d'anacarde dans le menage ?" ,
    "Q.17 Nom du chef de menage" ,
    "Q.18 Prenom du chef de menage" ,
    "Q.19 Contact du chef de menage" ,
    "Q.20 Nombre d'exploitants d'anacarde" ,
    "Q.21 Le(s) exploitant(s) est (sont) present(s) ?" ,
    "Q.22 Y a-t-il un representant de l'exploitant ?" ,
    "Q.23 Nom du representant" ,
    "Q.24 Prenom du representant" ,
    "Q.25 Contact du representant" ,

    "Statut" ,
    "Source" ,
    "Cree le"
)
FROM 'C:\tmp\denombrements.csv'
WITH(
	FORMAT csv,
	HEADER true,
	DELIMITER ';',
	ENCODING 'UTF-8'
);