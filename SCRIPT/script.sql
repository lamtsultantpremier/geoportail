-- 1. Districts
CREATE TABLE district (
    id_dist SERIAL PRIMARY KEY,
    lib_dist VARCHAR(150) NOT NULL,
    geo_dist GEOMETRY(MultiPolygon, 4326)
);

-- 2. Milieu de résidence
CREATE TABLE milieu_residence (
    id_milieu SERIAL PRIMARY KEY,
    lib_mil VARCHAR(100) NOT NULL
);

-- 3. Niveau d'instruction
CREATE TABLE niveau_instruction (
    id_niv SERIAL PRIMARY KEY,
    lib_niv VARCHAR(100) NOT NULL
);

-- 4. Mode de faire valoir
CREATE TABLE mode_faire_valoir (
    id_mode SERIAL PRIMARY KEY,
    lib_mode VARCHAR(100) NOT NULL
);

-- 5. Enquêteurs
CREATE TABLE enqueteur (
    id_enqt SERIAL PRIMARY KEY,
    nom_pren_enqt VARCHAR(150) NOT NULL,
    cont_enqt VARCHAR(50)
);

-- 6. Campagnes agricoles
CREATE TABLE campagne (
    id_campag SERIAL PRIMARY KEY,
    annee VARCHAR(20) NOT NULL
);
-- 7. Régions (Dépend de DISTRICT)
CREATE TABLE region (
    id_reg SERIAL PRIMARY KEY,
    lib_reg VARCHAR(150) NOT NULL,
    geom_reg GEOMETRY(MultiPolygon, 4326),
    id_dist INT NOT NULL REFERENCES district(id_dist) ON DELETE CASCADE
);

-- 8. Départements (Dépend de REGION)
CREATE TABLE departement (
    id_dept SERIAL PRIMARY KEY,
    lib_dept VARCHAR(150) NOT NULL,
    geom_dept GEOMETRY(MultiPolygon, 4326),
    id_reg INT NOT NULL REFERENCES region(id_reg) ON DELETE CASCADE
);

-- 9. Sous-Préfectures (Dépend de DEPARTEMENT)
CREATE TABLE sous_prefecture (
    id_s_pref SERIAL PRIMARY KEY,
    lib_s_pref VARCHAR(150) NOT NULL,
    geo_s_pref GEOMETRY(MultiPolygon, 4326),
    id_dept INT NOT NULL REFERENCES departement(id_dept) ON DELETE CASCADE
);

-- 10. Localités (Dépend de SOUS_PREFECTURE)
CREATE TABLE localite (
    id_loc SERIAL PRIMARY KEY,
    lib_loc VARCHAR(150) NOT NULL,
    geo_loc GEOMETRY(Geometry, 4326),
    id_s_pref INT NOT NULL REFERENCES sous_prefecture(id_s_pref) ON DELETE CASCADE
);
-- 11. Zones de dénombrement (Dépend de LOCALITE et MILIEU_RESIDENCE)
CREATE TABLE zone_denombrement (
    id_zone SERIAL PRIMARY KEY,
    code_zone VARCHAR(50) NOT NULL,
    id_loc INT NOT NULL REFERENCES localite(id_loc) ON DELETE CASCADE,
    id_milieu INT NOT NULL REFERENCES milieu_residence(id_milieu) ON DELETE RESTRICT
);

-- 12. Ménages (Dépend de ZONE_DENOMBREMENT)
CREATE TABLE menage (
    id_men SERIAL PRIMARY KEY,
    code_men VARCHAR(50) NOT NULL,
    nom_chef VARCHAR(100) NOT NULL,
    pren_chef VARCHAR(100) NOT NULL,
    cont_chef VARCHAR(50),
    nb_enfant INT DEFAULT 0,
    nb_femme INT DEFAULT 0,
    id_zone INT NOT NULL REFERENCES zone_denombrement(id_zone) ON DELETE CASCADE
);

-- 13. Exploitants (Dépend de MENAGE et NIVEAU_INSTRUCTION)
CREATE TABLE exploitant (
    id_expl SERIAL PRIMARY KEY,
    code_expl VARCHAR(50) NOT NULL,
    nom_expl VARCHAR(100) NOT NULL,
    pren_expl VARCHAR(100) NOT NULL,
    date_nais DATE,
    pays_nais VARCHAR(100),
    lieu_nais VARCHAR(100),
    situa_mat VARCHAR(50),
    profession VARCHAR(100),
    nationalite VARCHAR(100),
    contacts VARCHAR(50),
    lien_photo VARCHAR(255), -- Chemin ou URL vers la photo d'identité
    id_men INT NOT NULL REFERENCES menage(id_men) ON DELETE CASCADE,
    id_niv INT REFERENCES niveau_instruction(id_niv) ON DELETE SET NULL
);

-- 14. Enquêtes (Dépend de ENQUETEUR et EXPLOITANT)
CREATE TABLE enquete (
    id_enq SERIAL PRIMARY KEY,
    date_enq DATE DEFAULT CURRENT_DATE,
    id_enqt INT NOT NULL REFERENCES enqueteur(id_enqt) ON DELETE RESTRICT,
    id_expl INT NOT NULL REFERENCES exploitant(id_expl) ON DELETE CASCADE
);
-- 15. Parcelles (Dépend de EXPLOITANT, MODE_FAIRE_VALOIR et ENQUETE)
CREATE TABLE parcelle (
    id_parc SERIAL PRIMARY KEY,
    code_parc VARCHAR(50) NOT NULL,
    annee_mise_place INT,
    geom_parc GEOMETRY(Polygon, 4326) NOT NULL, -- Polygone de la parcelle
    superficie_tracee NUMERIC(10, 2),
    id_expl INT NOT NULL REFERENCES exploitant(id_expl) ON DELETE CASCADE,
    id_mode INT REFERENCES mode_faire_valoir(id_mode) ON DELETE SET NULL,
    id_enq INT REFERENCES enquete(id_enq) ON DELETE SET NULL
);

-- Index spatial indispensable pour accélérer les requêtes géographiques sur les parcelles
CREATE INDEX idx_parcelle_geom ON parcelle USING GIST (geom_parc);

-- 16. Géoréférencement (Dépend de PARCELLE)
CREATE TABLE georeferencement (
    id_geor SERIAL PRIMARY KEY,
    date_geor DATE,
    id_parc INT NOT NULL REFERENCES parcelle(id_parc) ON DELETE CASCADE
);

-- 17. Produire - Table associative avec attributs (Dépend de PARCELLE et CAMPAGNE)
CREATE TABLE produire (
    id_parc INT NOT NULL REFERENCES parcelle(id_parc) ON DELETE CASCADE,
    id_campag INT NOT NULL REFERENCES campagne(id_campag) ON DELETE CASCADE,
    sup_prod NUMERIC(10, 2),
    quantite_kg NUMERIC(10, 2),
    prix_vente NUMERIC(12, 2),
    PRIMARY KEY (id_parc, id_campag) -- Clé primaire composée
);