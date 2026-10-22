# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Campagne(models.Model):
    id_campag = models.AutoField(primary_key=True)
    annee = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'campagne'


class Departement(models.Model):
    id_dept = models.AutoField(primary_key=True)
    lib_dept = models.CharField(max_length=150)
    geom_dept = models.TextField(blank=True, null=True)  # This field type is a guess.
    id_reg = models.ForeignKey('Region', models.DB_CASCADE, db_column='id_reg')

    class Meta:
        managed = False
        db_table = 'departement'


class District(models.Model):
    id_dist = models.AutoField(primary_key=True)
    lib_dist = models.CharField(max_length=150)
    geo_dist = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'district'


class Enquete(models.Model):
    id_enq = models.AutoField(primary_key=True)
    date_enq = models.DateField(blank=True, null=True)
    id_enqt = models.ForeignKey('Enqueteur', models.DO_NOTHING, db_column='id_enqt')
    id_expl = models.ForeignKey('Exploitant', models.DB_CASCADE, db_column='id_expl')
    num_questionnaire = models.CharField(unique=True, max_length=500, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'enquete'


class Enqueteur(models.Model):
    id_enqt = models.AutoField(primary_key=True)
    nom_pren_enqt = models.CharField(max_length=1000, blank=True, null=True)
    cont_enqt = models.CharField(max_length=50, blank=True, null=True)
    code_enqt = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'enqueteur'
        unique_together = (('code_enqt', 'nom_pren_enqt'),)


class Exploitant(models.Model):
    id_expl = models.AutoField(primary_key=True)
    code_expl = models.CharField(unique=True, max_length=50)
    nom_expl = models.CharField(max_length=100, blank=True, null=True)
    pren_expl = models.CharField(max_length=100, blank=True, null=True)
    date_nais = models.DateField(blank=True, null=True)
    pays_nais = models.CharField(max_length=100, blank=True, null=True)
    lieu_nais = models.CharField(max_length=100, blank=True, null=True)
    situa_mat = models.CharField(max_length=50, blank=True, null=True)
    profession = models.CharField(max_length=100, blank=True, null=True)
    nationalite = models.CharField(max_length=100, blank=True, null=True)
    contacts = models.CharField(max_length=50, blank=True, null=True)
    lien_photo = models.CharField(max_length=255, blank=True, null=True)
    id_men = models.ForeignKey('Menage', models.DB_CASCADE, db_column='id_men', blank=True, null=True)
    id_niv = models.ForeignKey('NiveauInstruction', models.DB_SET_NULL, db_column='id_niv', blank=True, null=True)
    nom_declare = models.CharField(max_length=150, blank=True, null=True)
    pren_declare = models.CharField(max_length=150, blank=True, null=True)
    cont_declare = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'exploitant'


class Georeferencement(models.Model):
    id_geor = models.AutoField(primary_key=True)
    date_geor = models.DateField(blank=True, null=True)
    id_parc = models.ForeignKey('ParcelleCorrecte', models.DO_NOTHING, db_column='id_parc')

    class Meta:
        managed = False
        db_table = 'georeferencement'


class Localite(models.Model):
    id_loc = models.AutoField(primary_key=True)
    lib_loc = models.CharField(max_length=150)
    geo_loc = models.TextField(blank=True, null=True)  # This field type is a guess.
    id_s_pref = models.ForeignKey('SousPrefecture', models.DB_CASCADE, db_column='id_s_pref')
    id_zone_denombrement = models.ForeignKey('ZoneDenombrement', models.DB_CASCADE, db_column='id_zone_denombrement', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'localite'


class Menage(models.Model):
    id_men = models.AutoField(primary_key=True)
    code_men = models.CharField(unique=True, max_length=50)
    nom_chef = models.CharField(max_length=100, blank=True, null=True)
    pren_chef = models.CharField(max_length=100, blank=True, null=True)
    cont_chef = models.CharField(max_length=50, blank=True, null=True)
    nb_enfant = models.CharField(max_length=50, blank=True, null=True)
    nb_femme = models.CharField(max_length=50, blank=True, null=True)
    id_quar = models.ForeignKey('Quartier', models.DB_CASCADE, db_column='id_quar', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'menage'


class MilieuResidence(models.Model):
    id_milieu = models.AutoField(primary_key=True)
    lib_mil = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = False
        db_table = 'milieu_residence'


class ModeFaireValoir(models.Model):
    id_mode = models.AutoField(primary_key=True)
    lib_mode = models.CharField(unique=True, max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'mode_faire_valoir'


class NiveauInstruction(models.Model):
    id_niv = models.AutoField(primary_key=True)
    lib_niv = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = False
        db_table = 'niveau_instruction'


class Parcelle(models.Model):
    id_parc = models.AutoField(primary_key=True)
    code_parc = models.CharField(max_length=50)
    annee_mise_place = models.IntegerField(blank=True, null=True)
    geom_parc = models.TextField()  # This field type is a guess.
    superficie_tracee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    id_expl = models.ForeignKey(Exploitant, models.DB_CASCADE, db_column='id_expl')
    id_mode = models.ForeignKey(ModeFaireValoir, models.DB_SET_NULL, db_column='id_mode', blank=True, null=True)
    id_enq = models.ForeignKey(Enquete, models.DB_SET_NULL, db_column='id_enq', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'parcelle'


class ParcelleCorrecte(models.Model):
    id_parc = models.AutoField(primary_key=True)
    code_parc = models.CharField(unique=True, max_length=50)
    annee_mise_place = models.IntegerField(blank=True, null=True)
    geom_parc = models.TextField(blank=True, null=True)  # This field type is a guess.
    superficie_tracee = models.TextField(blank=True, null=True)
    id_expl = models.ForeignKey(Exploitant, models.DB_CASCADE, db_column='id_expl')
    id_mode = models.ForeignKey(ModeFaireValoir, models.DB_SET_NULL, db_column='id_mode', blank=True, null=True)
    id_enqt = models.ForeignKey(Enqueteur, models.DO_NOTHING, db_column='id_enqt', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'parcelle_correcte'


class ParcelleIncorrecte(models.Model):
    id_parc = models.AutoField(primary_key=True)
    code_parc = models.CharField(unique=True, max_length=50)
    annee_mise_place = models.IntegerField(blank=True, null=True)
    geom_parc = models.TextField(blank=True, null=True)
    superficie_tracee = models.TextField(blank=True, null=True)
    id_expl = models.ForeignKey(Exploitant, models.DB_CASCADE, db_column='id_expl')
    id_mode = models.ForeignKey(ModeFaireValoir, models.DB_SET_NULL, db_column='id_mode', blank=True, null=True)
    id_enqt = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'parcelle_incorrecte'


class Produire(models.Model):
    pk = models.CompositePrimaryKey('id_parc', 'id_campag')
    id_parc = models.ForeignKey(Parcelle, models.DB_CASCADE, db_column='id_parc')
    id_campag = models.ForeignKey(Campagne, models.DB_CASCADE, db_column='id_campag')
    sup_prod = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    quantite_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    prix_vente = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'produire'


class Quartier(models.Model):
    id_quar = models.AutoField(primary_key=True)
    lib_quar = models.CharField(max_length=150)
    id_loc = models.ForeignKey(Localite, models.DB_CASCADE, db_column='id_loc', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'quartier'


class Region(models.Model):
    id_reg = models.AutoField(primary_key=True)
    lib_reg = models.CharField(max_length=150)
    geom_reg = models.TextField(blank=True, null=True)  # This field type is a guess.
    id_dist = models.ForeignKey(District, models.DB_CASCADE, db_column='id_dist')

    class Meta:
        managed = False
        db_table = 'region'


class SousPrefecture(models.Model):
    id_s_pref = models.AutoField(primary_key=True)
    lib_s_pref = models.CharField(max_length=150)
    geo_s_pref = models.TextField(blank=True, null=True)  # This field type is a guess.
    id_dept = models.ForeignKey(Departement, models.DB_CASCADE, db_column='id_dept')

    class Meta:
        managed = False
        db_table = 'sous_prefecture'


class SpatialRefSys(models.Model):
    srid = models.IntegerField(primary_key=True)
    auth_name = models.CharField(max_length=256, blank=True, null=True)
    auth_srid = models.IntegerField(blank=True, null=True)
    srtext = models.CharField(max_length=2048, blank=True, null=True)
    proj4text = models.CharField(max_length=2048, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'spatial_ref_sys'


class ZoneDenombrement(models.Model):
    id_zone = models.AutoField(primary_key=True)
    code_zone = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'zone_denombrement'
