# -*- coding: utf-8 -*-
"""
models.py — Modèles SQLAlchemy ORM (miroir de migrations/schema.sql).
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship

from db import Base


def _uuid():
    return str(uuid.uuid4())


class Institution(Base):
    """Tenant — établissement/organisation propriétaire d'un ensemble
    d'utilisateurs et de patients. Toute donnée patient est rattachée à
    exactement une institution ; aucune requête ne doit pouvoir traverser
    cette frontière (voir deps.get_scoped_patient, seul point d'accès patient
    qui applique cette règle — voir tenancy.py pour la création)."""
    __tablename__ = "institutions"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    # "personal" (créée automatiquement pour un utilisateur seul, voir
    # tenancy.py::create_personal_institution) vs "organization" (créée
    # explicitement, plusieurs utilisateurs invités à la rejoindre).
    kind = Column(String(32), nullable=False, default="personal")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="institution")
    patients = relationship("Patient", back_populates="institution")
    license = relationship("InstitutionLicense", back_populates="institution", uselist=False,
                            cascade="all, delete-orphan")


class InstitutionLicense(Base):
    """Terme commercial d'une institution — séparé d'Institution (identité du
    tenant) exprès : un tenant peut exister brièvement sans licence assignée
    (le temps d'un provisioning), et changer de plan ne doit jamais recréer le
    tenant ni ses données. Voir licensing.py pour le catalogue de plans et les
    fonctions de vérification, deps.require_module pour l'application aux
    endpoints.

    1:1 avec Institution (une seule licence active par tenant — un modèle plus
    riche à plusieurs licences superposées n'est pas nécessaire tant qu'aucun
    besoin réel ne le justifie)."""
    __tablename__ = "institution_licenses"

    id = Column(String(36), primary_key=True, default=_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"),
                             nullable=False, unique=True)
    plan = Column(String(32), nullable=False, default="trial")
    max_seats = Column(Integer, nullable=False, default=1)
    # Modules activés pour ce plan — voir licensing.PLAN_CATALOG pour les
    # valeurs par défaut par plan ; stocké explicitement (pas seulement dérivé
    # du plan à la volée) pour permettre un ajustement ponctuel par
    # institution sans changer son plan nominal (ex. accès anticipé à un
    # module en pilote).
    enabled_modules = Column(JSON, nullable=False, default=list)
    expires_at = Column(DateTime, nullable=True)  # None = sans expiration (ex. trial illimité de démo)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    institution = relationship("Institution", back_populates="license")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, nullable=True)
    role = Column(String(32), nullable=False, default="surgeon")
    hashed_password = Column(Text, nullable=False)
    rpps = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True)

    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    institution = relationship("Institution", back_populates="users")

    # 2FA (TOTP)
    totp_secret = Column(String(64), nullable=True)            # actif une fois activé
    totp_pending_secret = Column(String(64), nullable=True)    # en attente de confirmation
    totp_enabled = Column(Boolean, default=False)
    totp_recovery_codes = Column(JSON, default=list)           # codes de secours (hashés)

    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(32), primary_key=True)
    nom = Column(String(128), nullable=False)
    age = Column(Integer, nullable=False)
    sexe = Column(String(1), nullable=False)
    poids_kg = Column(Float, nullable=False)
    taille_cm = Column(Float, nullable=False)
    diagnostic = Column(Text, nullable=False)
    chirurgien = Column(String(128), nullable=False)
    specialty = Column(String(32), nullable=False, default="hbp")
    urgence = Column(String(16), default="vert")
    note = Column(Text, nullable=True)
    status = Column(String(32), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Toujours hérité de l'institution du créateur à la création (voir
    # routers/patients.py) — jamais fourni par le client, pour qu'un
    # utilisateur ne puisse pas créer un patient dans une institution qui
    # n'est pas la sienne. Voir deps.get_scoped_patient pour l'application de
    # l'isolation en lecture/écriture.
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    institution = relationship("Institution", back_populates="patients")

    segments = relationship("Segment", back_populates="patient", cascade="all, delete-orphan")

    @property
    def bsa_m2(self):
        if not self.poids_kg or not self.taille_cm:
            return None
        return round((self.poids_kg * self.taille_cm / 3600) ** 0.5, 3)


class Segment(Base):
    __tablename__ = "segments"

    id = Column(String(64), primary_key=True)
    patient_id = Column(String(32), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(32), nullable=False)
    volume_ml = Column(Float, nullable=False)
    label = Column(String(128), nullable=True)
    color_hex = Column(String(7), default="#ff0000")
    mesh_ref = Column(Text, nullable=True)     # chemin/URL du maillage STL/GLB réel
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="segments")


class PreanesthesiaAssessment(Base):
    """Dossier & évaluation pré-anesthésique — un dossier courant par patient."""
    __tablename__ = "preanesthesia_assessments"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(32), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, unique=True)
    asa_score = Column(Integer, nullable=True)
    asa_urgence = Column(Boolean, default=False)
    mallampati_score = Column(Integer, nullable=True)
    antecedents = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    traitement_chronique = Column(Text, nullable=True)
    jeune_solide_h = Column(Float, nullable=True)
    jeune_liquide_h = Column(Float, nullable=True)
    intubation_difficile_prevue = Column(Boolean, default=False)
    intubation_difficile_notes = Column(Text, nullable=True)
    checklist_json = Column("checklist", JSON, default=list)
    anesthesiste = Column(String(128), nullable=True)
    conclusion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient")


class IcuFollowUp(Base):
    """Suivi réanimation/USI — un patient peut avoir plusieurs évaluations dans le temps
    (contrairement au dossier pré-anesthésique, qui est un état courant unique)."""
    __tablename__ = "icu_followups"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(32), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    # SOFA — 6 sous-scores 0-4 (Sepsis-related Organ Failure Assessment), total calculé serveur
    sofa_respiration = Column(Integer, nullable=True)
    sofa_coagulation = Column(Integer, nullable=True)
    sofa_hepatique = Column(Integer, nullable=True)
    sofa_cardiovasculaire = Column(Integer, nullable=True)
    sofa_neurologique = Column(Integer, nullable=True)
    sofa_renal = Column(Integer, nullable=True)
    sofa_total = Column(Integer, nullable=True)

    # APACHE II — score total renseigné (0-71) ; non recalculé ici à partir des variables
    # physiologiques brutes (formule complète non implémentée dans ce prototype).
    apache2_score = Column(Integer, nullable=True)

    # Glasgow (GCS) — 3 sous-scores, total calculé serveur
    glasgow_oculaire = Column(Integer, nullable=True)
    glasgow_verbale = Column(Integer, nullable=True)
    glasgow_motrice = Column(Integer, nullable=True)
    glasgow_total = Column(Integer, nullable=True)

    # RASS — Richmond Agitation-Sedation Scale (-5 à +4)
    rass_score = Column(Integer, nullable=True)

    # Ventilation mécanique
    vent_mode = Column(String(32), nullable=True)
    vent_fio2_pct = Column(Float, nullable=True)
    vent_peep_cmh2o = Column(Float, nullable=True)
    vent_vt_ml = Column(Float, nullable=True)
    vent_fr_rpm = Column(Float, nullable=True)

    # Bilan entrées/sorties (ml), bilan net calculé serveur
    bilan_entrees_ml = Column(Float, nullable=True)
    bilan_sorties_ml = Column(Float, nullable=True)
    bilan_net_ml = Column(Float, nullable=True)

    # NEWS2 — constantes vitales (saisie) + score total calculé serveur
    resp_rate_rpm = Column(Integer, nullable=True)
    spo2_pct = Column(Integer, nullable=True)
    supplemental_o2 = Column(Boolean, default=False)
    systolic_bp_mmhg = Column(Integer, nullable=True)
    heart_rate_bpm = Column(Integer, nullable=True)
    temperature_c = Column(Float, nullable=True)
    avpu = Column(String(8), nullable=True)          # A / V / P / U
    news2_total = Column(Integer, nullable=True)

    # Alerte Sepsis-3 : dysfonction organique si SOFA >= 2 (calculée serveur)
    sepsis_alert = Column(Boolean, default=False)

    # Lien de traçabilité vers le plan chirurgical VALIDÉ (post-op en USI)
    plan_id = Column(String(36), ForeignKey("surgical_plans.id", ondelete="SET NULL"),
                     nullable=True, index=True)

    notes = Column(Text, nullable=True)
    auteur = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    plan = relationship("SurgicalPlan")


class TwinBiomech(Base):
    """Propriétés mécaniques d'un tissu pour le jumeau numérique déformable —
    voir feuille de route "Jumeau numérique réel" (README/ARCHITECTURE_CAHIER_DES_CHARGES
    §2.2.1 twin-service, §3.3 TwinBiomech). Une ligne par (patient, tissue_type) :
    soit une valeur par défaut issue de la littérature (source="literature_atlas",
    voir twin_biomech_atlas.py), soit une valeur réelle patiente (source=
    "patient_elastography" ou "clinician_override") saisie une fois l'élastographie
    disponible — non implémenté ici, cette table ne fait qu'ouvrir la place.
    """
    __tablename__ = "twin_biomech"
    __table_args__ = (UniqueConstraint("patient_id", "tissue_type", name="uq_twin_biomech_patient_tissue"),)

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(32), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    tissue_type = Column(String(32), nullable=False)   # ex. "liver_parenchyma", "liver_tumor", "vessel_wall"
    model = Column(String(32), nullable=False, default="mooney_rivlin")  # linear | mooney_rivlin | ogden | neo_hookean
    parameters_json = Column("parameters", JSON, default=dict)  # ex. {"C10_kpa": 2.1, "C01_kpa": 0.3}
    source = Column(String(32), nullable=False, default="literature_atlas")
    validation_dataset_ref = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient")


class DicomSeries(Base):
    __tablename__ = "dicom_series"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(32), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    study_uid = Column(String(256), nullable=False)
    series_uid = Column(String(256), unique=True, nullable=False)
    modality = Column(String(8), nullable=False)
    slice_thickness_mm = Column(Float, nullable=True)
    rows = Column(Integer, nullable=True)
    cols = Column(Integer, nullable=True)
    num_slices = Column(Integer, nullable=True)
    sha256 = Column(String(16), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    filename = Column(String(256), nullable=True)
    local_path = Column(String(512), nullable=True)  # dossier disque contenant les fichiers .dcm réels (si sauvegardés)
    imported_at = Column(DateTime, default=datetime.utcnow)


class SurgicalPlan(Base):
    """Plan chirurgical versionné (cycle de planification réelle).

    Objet persistant par patient, versionné (UNIQUE(patient_id, version)),
    qui suit un cycle de validation : draft → reviewed → validated (signé,
    figé, source de vérité pour le bloc) | rejected. Contrairement au
    prototype (plan volatil perdu au rafraîchissement), une modification
    d'un plan validé se traduit par la création d'une nouvelle version.
    Miroir de migrations/versions/e5f6a7b8c9d0_add_surgical_plans.py.
    """
    __tablename__ = "surgical_plans"
    __table_args__ = (UniqueConstraint("patient_id", "version", name="uq_surgical_plans_patient_version"),)

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(32), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False, default="draft")
    procedure = Column(String(256), nullable=True)
    author_id = Column(Integer, nullable=True)
    author_name = Column(String(128), nullable=True)
    snapshot_json = Column("snapshot", JSON, default=dict)
    source_series_id = Column(String(36), nullable=True)
    notes = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    signed_by = Column(String(128), nullable=True)
    signed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(128), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient")


class VolumetrieResult(Base):
    __tablename__ = "volumetrie_results"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    organ_volume_ml = Column(Float, nullable=False)
    lesion_volume_ml = Column(Float, nullable=False)
    ratio_lesion_organe_pct = Column(Float, nullable=True)
    volume_resection_ml = Column(Float, nullable=True)
    remnant_pct = Column(Float, nullable=False)
    flr_threshold_pct = Column(Float, nullable=True)
    flr_safe = Column(Boolean, nullable=True)
    flr_bw_pct = Column(Float, nullable=True)
    bsa_m2 = Column(Float, nullable=True)
    margin_cm = Column(Float, default=1.0)
    is_cirrhotic = Column(Boolean, default=False)
    computed_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    """Traçabilité complète : qui, quand, quoi, sur quel patient."""
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(Integer, nullable=True)
    username = Column(String(64), nullable=True)
    patient_id = Column(String(32), nullable=True)
    action = Column(String(256), nullable=False)
    resource = Column(String(64), nullable=True)
    method = Column(String(8), nullable=True)
    path = Column(String(256), nullable=True)
    status_code = Column(Integer, nullable=True)
    ip_address = Column(String(64), nullable=True)
    niveau = Column(String(16), default="info")
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

# ==============================================================================
# OR COMMAND CENTER & CONSTRAINT ENGINE MODELS
# ==============================================================================

class SurgicalProcedure(Base):
    """Objet métier représentant un type d'intervention chirurgicale et ses caractéristiques."""
    __tablename__ = "surgical_procedures"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(128), nullable=False)
    specialty = Column(String(32), nullable=False, default="hbp")
    estimated_duration_mins = Column(Integer, nullable=False, default=120)
    min_duration_mins = Column(Integer, nullable=False, default=60)
    max_duration_mins = Column(Integer, nullable=False, default=300)
    urgency_default = Column(String(16), default="elective")
    complexity_level = Column(String(16), default="medium")  # low, medium, high, extreme
    anesthesia_type = Column(String(32), default="general") # general, spinal, local, sedation
    required_equipment = Column(JSON, default=list) # ex: ["laparoscope", "energy_device"]
    required_icu_bed = Column(Boolean, default=False)
    required_icu_duration_hours = Column(Float, default=0.0)
    required_surgeon_specialty = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StaffAvailability(Base):
    """Disponibilités et créneaux du personnel médical (chirurgiens, anesthésistes, infirmiers)."""
    __tablename__ = "staff_availabilities"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    availability_type = Column(String(32), nullable=False, default="available") # available, shift, meeting, leave, on_call
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class RoomAvailability(Base):
    """Disponibilités et fermetures/maintenances des salles d'opération."""
    __tablename__ = "room_availabilities"

    id = Column(String(36), primary_key=True, default=_uuid)
    operating_room_id = Column(String(36), ForeignKey("operating_rooms.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    availability_type = Column(String(32), nullable=False, default="available") # available, maintenance, cleaning, closed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("OperatingRoom")


class EquipmentAvailability(Base):
    """Disponibilités et maintenances des équipements du bloc."""
    __tablename__ = "equipment_availabilities"

    id = Column(String(36), primary_key=True, default=_uuid)
    equipment_id = Column(String(36), ForeignKey("equipments.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    availability_type = Column(String(32), nullable=False, default="available") # available, sterilization, maintenance, out_of_service
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment")


class BedAvailability(Base):
    """Disponibilités et réservations de lits d'USI / Réanimation."""
    __tablename__ = "bed_availabilities"

    id = Column(String(36), primary_key=True, default=_uuid)
    bed_identifier = Column(String(64), nullable=False) # ex: "Lit USI 01"
    department = Column(String(32), nullable=False, default="USI") # USI, Reanimation, SSPI
    is_occupied = Column(Boolean, default=False)
    occupied_by_patient_id = Column(String(32), ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    reserved_from = Column(DateTime, nullable=True)
    reserved_until = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient")


class OperatingRoom(Base):
    __tablename__ = "operating_rooms"
    
    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(128), nullable=False)
    type = Column(String(64), default="general")
    is_active = Column(Boolean, default=True)
    capabilities = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OperatingSchedule(Base):
    __tablename__ = "operating_schedules"
    
    id = Column(String(36), primary_key=True, default=_uuid)
    operating_room_id = Column(String(36), ForeignKey("operating_rooms.id", ondelete="RESTRICT"))
    patient_id = Column(String(32), ForeignKey("patients.id", ondelete="CASCADE"))
    plan_id = Column(String(36), ForeignKey("surgical_plans.id", ondelete="SET NULL"), nullable=True)
    procedure_id = Column(String(36), ForeignKey("surgical_procedures.id", ondelete="SET NULL"), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    estimated_duration_mins = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False, default="draft") # draft, reviewed, confirmed, frozen, in_progress, completed, cancelled
    primary_surgeon_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    anesthesiologist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    urgency_level = Column(String(16), default="elective")
    
    # Suivi temps réel & Réanimation
    actual_incision_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    delay_mins = Column(Integer, default=0)
    icu_bed_reserved = Column(Boolean, default=False)
    icu_reservation_start = Column(DateTime, nullable=True)
    icu_reservation_end = Column(DateTime, nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    room = relationship("OperatingRoom")
    patient = relationship("Patient")
    plan = relationship("SurgicalPlan")
    procedure = relationship("SurgicalProcedure")
    surgeon = relationship("User", foreign_keys=[primary_surgeon_id])
    anesthesiologist = relationship("User", foreign_keys=[anesthesiologist_id])


class Equipment(Base):
    __tablename__ = "equipments"
    
    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    quantity_available = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ScheduleEquipment(Base):
    __tablename__ = "schedule_equipments"
    
    schedule_id = Column(String(36), ForeignKey("operating_schedules.id", ondelete="CASCADE"), primary_key=True)
    equipment_id = Column(String(36), ForeignKey("equipments.id", ondelete="CASCADE"), primary_key=True)
    quantity_needed = Column(Integer, default=1, nullable=False)
    status = Column(String(32), default="requested")


class VoiceNote(Base):
    """Note dictée ou tapée à la voix par le chirurgien/infirmier (Voice-First).
    Utilisée par le motif « Note : … » pour tracer un commentaire clinique libre
    (ex. « cet étudiant est en difficulté sur les marges utérines ») avec un
    système de tags pour le filtrage pédagogique/audit. Persistée pour la
    traçabilité MDR/IEC 62304 — chaque interprétation vocale est retraçable."""
    __tablename__ = "voice_notes"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(32), ForeignKey("patients.id", ondelete="CASCADE"), nullable=True, index=True)
    author_username = Column(String(64), nullable=False)
    specialty = Column(String(32), nullable=True)
    intent = Column(String(32), nullable=True)
    action_token = Column(String(64), nullable=True)
    text = Column(Text, nullable=False)
    tags = Column("tags", JSON, default=list)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    patient = relationship("Patient")
