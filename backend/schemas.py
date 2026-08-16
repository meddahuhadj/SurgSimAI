# -*- coding: utf-8 -*-
"""
schemas.py — Schémas Pydantic partagés (request/response models) pour tous les endpoints.
================================================================================================
Centralise la validation d'entrée/sortie de l'API. Chaque router importe ici ses schémas
plutôt que de les définir en duplication dans chaque fichier. Améliore la documentation
OpenAPI auto-générée et garantit une validation stricte sur tous les endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from specialties import Specialty


# ---------------------------------------------------------------------------
# Communs
# ---------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    """Format RFC 7807 (Problem Details) pour les erreurs API."""
    detail: str
    error_id: Optional[str] = None
    status: int
    title: str = "Erreur"


class ComplianceStatusResponse(BaseModel):
    status: str
    compliant: bool
    details: Dict[str, Any]

# ---------------------------------------------------------------------------
# OR Command Center & Constraint Engine
# ---------------------------------------------------------------------------

class SurgicalProcedureBase(BaseModel):
    name: str
    specialty: str = "hbp"
    estimated_duration_mins: int = 120
    min_duration_mins: int = 60
    max_duration_mins: int = 300
    urgency_default: str = "elective"
    complexity_level: str = "medium"
    anesthesia_type: str = "general"
    required_equipment: List[str] = Field(default_factory=list)
    required_icu_bed: bool = False
    required_icu_duration_hours: float = 0.0
    required_surgeon_specialty: Optional[str] = None

class SurgicalProcedureCreate(SurgicalProcedureBase):
    pass

class SurgicalProcedureResponse(SurgicalProcedureBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StaffAvailabilityBase(BaseModel):
    user_id: int
    start_time: datetime
    end_time: datetime
    availability_type: str = "available" # available, shift, meeting, leave, on_call
    notes: Optional[str] = None

class StaffAvailabilityCreate(StaffAvailabilityBase):
    pass

class StaffAvailabilityResponse(StaffAvailabilityBase):
    id: str
    created_at: datetime
    user_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class OperatingRoomBase(BaseModel):
    name: str
    type: str = "general"
    is_active: bool = True
    capabilities: List[str] = []

class OperatingRoomResponse(OperatingRoomBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class OperatingScheduleBase(BaseModel):
    operating_room_id: str
    patient_id: str
    plan_id: Optional[str] = None
    procedure_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    estimated_duration_mins: int
    status: str = "draft" # draft, reviewed, confirmed, frozen, in_progress, completed, cancelled
    primary_surgeon_id: Optional[int] = None
    anesthesiologist_id: Optional[int] = None
    nurse_id: Optional[int] = None
    urgency_level: str = "elective"
    actual_incision_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    delay_mins: int = 0
    icu_bed_reserved: bool = False
    icu_reservation_start: Optional[datetime] = None
    icu_reservation_end: Optional[datetime] = None
    notes: Optional[str] = None

class OperatingScheduleCreate(OperatingScheduleBase):
    pass

class OperatingScheduleUpdate(BaseModel):
    operating_room_id: Optional[str] = None
    procedure_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    estimated_duration_mins: Optional[int] = None
    status: Optional[str] = None
    primary_surgeon_id: Optional[int] = None
    anesthesiologist_id: Optional[int] = None
    nurse_id: Optional[int] = None
    urgency_level: Optional[str] = None
    actual_incision_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    delay_mins: Optional[int] = None
    icu_bed_reserved: Optional[bool] = None
    icu_reservation_start: Optional[datetime] = None
    icu_reservation_end: Optional[datetime] = None
    notes: Optional[str] = None
    audit_reason: Optional[str] = Field(None, description="Justification d'audit obligatoire si modification après freeze")

class OperatingScheduleResponse(OperatingScheduleBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    room_name: Optional[str] = None
    patient_name: Optional[str] = None
    procedure_name: Optional[str] = None
    primary_surgeon_name: Optional[str] = None
    anesthesiologist_name: Optional[str] = None
    readiness_status: Optional[str] = None # READY, READY_WITH_WARNINGS, BLOCKED
    
    model_config = ConfigDict(from_attributes=True)

class PreparationScoreResponse(BaseModel):
    patient_id: str
    score_pct: int
    readiness_status: Literal["READY", "READY_WITH_WARNINGS", "BLOCKED"]
    readiness_level: str # '🟢 Ready', '🟠 Ready with Warnings', '🔴 Blocked'
    critical_blockers: List[str]
    warnings: List[str]
    completed_count: int
    total_count: int
    imagerie: Dict[str, bool]
    chirurgie: Dict[str, bool]
    anesthesie: Dict[str, bool]
    biologie: Dict[str, bool]
    bloc: Dict[str, bool]
    materiel: Dict[str, bool]
    reanimation: Dict[str, bool]

class SlotValidationRequest(BaseModel):
    schedule_id: Optional[str] = None
    operating_room_id: str
    patient_id: str
    procedure_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    primary_surgeon_id: Optional[int] = None
    anesthesiologist_id: Optional[int] = None

class SlotValidationResponse(BaseModel):
    is_valid: bool
    status: Literal["VALID", "WARNING", "BLOCKED"]
    status_icon: str # 🟢, 🟠, 🔴
    hard_blockers: List[str]
    soft_warnings: List[str]
    overtime_mins: int = 0

class RealtimeDelayRequest(BaseModel):
    actual_incision_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    reason: Optional[str] = None

class OptimizationRequest(BaseModel):
    date_start: datetime
    date_end: datetime

class OptimizedSchedule(BaseModel):
    schedule_id: str
    original_room_id: str
    new_room_id: str
    original_start_time: datetime
    new_start_time: datetime
    original_end_time: datetime
    new_end_time: datetime
    reasoning: str

class OptimizationOption(BaseModel):
    option_id: str
    title: str
    summary: str
    time_saved_mins: int
    overtime_reduced_mins: int
    changes: List[OptimizedSchedule]

class OptimizationResponse(BaseModel):
    reasoning_summary: str
    options: List[OptimizationOption]
    changes: List[OptimizedSchedule]
    estimated_time_saved_mins: int

class SimulationWhatIfRequest(BaseModel):
    date: datetime
    room_unavailable_id: Optional[str] = None
    staff_absent_id: Optional[int] = None
    emergency_procedure_added: Optional[Dict[str, Any]] = None

class SimulationWhatIfResponse(BaseModel):
    scenario_description: str
    impacted_schedules_count: int
    reallocated_schedules: List[OptimizedSchedule]
    unfeasible_schedules: List[str]
    original_utilization_pct: float
    simulated_utilization_pct: float
    recommendation: str



class HealthResponse(BaseModel):
    status: str
    ai: bool
    specialties: List[str]
    db: str
    app_env: str
    seed_demo_users: bool
    pacs_fhir_hl7: bool
    pacs_configured: bool
    circuit_breakers: Dict[str, Any]
    uptime_seconds: float


class ReadyResponse(BaseModel):
    status: str
    checks: Dict[str, str]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TwoFARequiredResponse(BaseModel):
    requires_2fa: bool = True
    pre_auth_token: str


class TwoFAVerifyRequest(BaseModel):
    pre_auth_token: str = Field(..., min_length=10)
    code: str = Field(..., min_length=6, max_length=12, description="Code TOTP 6 chiffres ou code de secours")


class TwoFASetupResponse(BaseModel):
    secret: str
    otpauth_uri: str
    qr_png_base64: str


class TwoFAEnableRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TwoFADisableRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TwoFARecoveryCodesResponse(BaseModel):
    enabled: bool
    recovery_codes: List[str]
    warning: str


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9._-]+$")
    password: str = Field(..., max_length=128)
    full_name: Optional[str] = Field(None, min_length=1, max_length=128)
    # Rejoint une institution existante (ex. lien d'invitation d'un établissement
    # déjà client) si fourni ; sinon une nouvelle institution personnelle est
    # créée pour ce compte — voir tenancy.resolve_institution_id.
    institution_id: Optional[str] = None


class RegisterResponse(BaseModel):
    msg: str


# ---------------------------------------------------------------------------
# Gestion des comptes (admin) — voir routers/users.py
# ---------------------------------------------------------------------------

class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9._-]+$")
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, min_length=1, max_length=128)
    role: Literal["admin", "surgeon", "dpo"] = "surgeon"


class UserUpdateRequest(BaseModel):
    role: Optional[Literal["admin", "surgeon", "dpo"]] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    totp_enabled: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime


class InstitutionLicenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    institution_id: str
    institution_name: str
    plan: str
    plan_label: str
    max_seats: int
    seats_used: int
    enabled_modules: List[str]
    expires_at: Optional[datetime] = None
    is_active: bool
    is_valid: bool  # is_active ET non expirée — voir licensing.is_license_valid


class InstitutionLicenseUpdate(BaseModel):
    """Tous les champs optionnels : seuls ceux fournis sont modifiés. `plan`
    seul ne réinitialise PAS enabled_modules/max_seats au catalogue — utiliser
    `reset_to_plan_defaults=true` pour ça explicitement (évite qu'un simple
    changement d'étiquette de plan écrase silencieusement des ajustements
    ponctuels déjà en place, voir models.InstitutionLicense.enabled_modules)."""
    plan: Optional[str] = None
    max_seats: Optional[int] = Field(None, ge=1)
    enabled_modules: Optional[List[str]] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    reset_to_plan_defaults: bool = False


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------

class PatientCreate(BaseModel):
    id: str = Field(..., min_length=1, max_length=32)
    nom: str = Field(..., min_length=1, max_length=128)
    age: int = Field(..., ge=0, le=150)
    sexe: Literal["M", "F"]
    poids_kg: float = Field(..., ge=1, le=500)
    taille_cm: float = Field(..., ge=30, le=250)
    diagnostic: str = Field(..., min_length=1, max_length=1000)
    chirurgien: str = Field(..., min_length=1, max_length=128)
    specialty: Specialty = "hbp"
    urgence: Literal["vert", "orange", "rouge"] = "vert"
    note: Optional[str] = None


class PatientUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=128)
    age: Optional[int] = Field(None, ge=0, le=150)
    poids_kg: Optional[float] = Field(None, ge=1, le=500)
    taille_cm: Optional[float] = Field(None, ge=30, le=250)
    diagnostic: Optional[str] = Field(None, min_length=1, max_length=1000)
    specialty: Optional[Specialty] = None
    urgence: Optional[Literal["vert", "orange", "rouge"]] = None
    note: Optional[str] = None


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nom: str
    age: int
    sexe: str
    poids_kg: float
    taille_cm: float
    diagnostic: str
    chirurgien: str
    specialty: str
    urgence: str
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    bsa: Optional[float] = None


class SegmentCreate(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    type: Literal["organe", "lesion", "resection", "structure_tubulaire", "ganglion"]
    volume_ml: float = Field(..., ge=0)
    label: str = Field(..., min_length=1, max_length=128)
    color_hex: str = Field(default="#ff0000", pattern=r"^#[0-9a-fA-F]{6}$")
    mesh_ref: Optional[str] = None
    # Utilisé notamment pour marquer un segment comme référence experte d'un
    # autre (ex. {"ground_truth_for_segment_id": "<id du segment prédit>"}),
    # voir routers/compliance.py::get_clinical_evaluation_for_patient — permet
    # une vraie évaluation Dice/HD95 quand une paire prédiction/vérité-terrain
    # existe, sans migration de schéma (la colonne DB `metadata` existe déjà
    # sur models.Segment, seulement absente de ce contrat API jusqu'ici).
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class SegmentOut(SegmentCreate):
    model_config = ConfigDict(from_attributes=True)

    patient_id: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Plans chirurgicaux versionnés (cycle de planification réelle)
# ---------------------------------------------------------------------------

PlanStatus = Literal["draft", "reviewed", "validated", "rejected"]


class SurgicalPlanIn(BaseModel):
    procedure: str = Field(..., min_length=1, max_length=256)
    snapshot: Optional[Dict[str, Any]] = None
    source_series_id: Optional[str] = Field(None, max_length=36)
    notes: Optional[str] = Field(None, max_length=4000)


class SurgicalPlanUpdate(BaseModel):
    procedure: Optional[str] = Field(None, min_length=1, max_length=256)
    snapshot: Optional[Dict[str, Any]] = None
    source_series_id: Optional[str] = Field(None, max_length=36)
    notes: Optional[str] = Field(None, max_length=4000)
    expected_version: Optional[int] = Field(None, ge=1, description="Version attendue — 409 si la base a une autre version (modification concourante)")


class SurgicalPlanReviewIn(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)


class SurgicalPlanValidateIn(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)


class SurgicalPlanRejectIn(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)


class SurgicalPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    version: int
    status: PlanStatus
    procedure: Optional[str] = None
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    snapshot: Optional[Dict[str, Any]] = Field(None, validation_alias="snapshot_json")
    source_series_id: Optional[str] = None
    notes: Optional[str] = None
    comment: Optional[str] = None
    signed_by: Optional[str] = None
    signed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Dossier & évaluation pré-anesthésique
# ---------------------------------------------------------------------------

class ChecklistItem(BaseModel):
    done: bool = False
    text: str = Field(..., min_length=1, max_length=256)


class PreanesthesiaAssessmentIn(BaseModel):
    asa_score: Optional[int] = Field(None, ge=1, le=5)
    asa_urgence: Optional[bool] = None
    mallampati_score: Optional[int] = Field(None, ge=1, le=4)
    antecedents: Optional[str] = Field(None, max_length=4000)
    allergies: Optional[str] = Field(None, max_length=2000)
    traitement_chronique: Optional[str] = Field(None, max_length=2000)
    jeune_solide_h: Optional[float] = Field(None, ge=0, le=200)
    jeune_liquide_h: Optional[float] = Field(None, ge=0, le=200)
    intubation_difficile_prevue: Optional[bool] = None
    intubation_difficile_notes: Optional[str] = Field(None, max_length=2000)
    checklist: Optional[List[ChecklistItem]] = None
    anesthesiste: Optional[str] = Field(None, max_length=128)
    conclusion: Optional[str] = Field(None, max_length=4000)


class PreanesthesiaAssessmentOut(BaseModel):
    id: str
    patient_id: str
    asa_score: Optional[int] = None
    asa_urgence: bool = False
    mallampati_score: Optional[int] = None
    antecedents: Optional[str] = None
    allergies: Optional[str] = None
    traitement_chronique: Optional[str] = None
    jeune_solide_h: Optional[float] = None
    jeune_liquide_h: Optional[float] = None
    intubation_difficile_prevue: bool = False
    intubation_difficile_notes: Optional[str] = None
    checklist: List[ChecklistItem] = Field(default_factory=list)
    anesthesiste: Optional[str] = None
    conclusion: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Suivi réanimation / USI (plusieurs évaluations dans le temps par patient)
# ---------------------------------------------------------------------------

class IcuFollowUpIn(BaseModel):
    recorded_at: Optional[datetime] = None
    sofa_respiration: Optional[int] = Field(None, ge=0, le=4)
    sofa_coagulation: Optional[int] = Field(None, ge=0, le=4)
    sofa_hepatique: Optional[int] = Field(None, ge=0, le=4)
    sofa_cardiovasculaire: Optional[int] = Field(None, ge=0, le=4)
    sofa_neurologique: Optional[int] = Field(None, ge=0, le=4)
    sofa_renal: Optional[int] = Field(None, ge=0, le=4)
    apache2_score: Optional[int] = Field(None, ge=0, le=71)
    glasgow_oculaire: Optional[int] = Field(None, ge=1, le=4)
    glasgow_verbale: Optional[int] = Field(None, ge=1, le=5)
    glasgow_motrice: Optional[int] = Field(None, ge=1, le=6)
    rass_score: Optional[int] = Field(None, ge=-5, le=4)
    vent_mode: Optional[str] = Field(None, max_length=32)
    vent_fio2_pct: Optional[float] = Field(None, ge=21, le=100)
    vent_peep_cmh2o: Optional[float] = Field(None, ge=0, le=30)
    vent_vt_ml: Optional[float] = Field(None, ge=0, le=1000)
    vent_fr_rpm: Optional[float] = Field(None, ge=0, le=60)
    bilan_entrees_ml: Optional[float] = None
    bilan_sorties_ml: Optional[float] = None
    # NEWS2 — constantes vitales (score total calculé côté serveur)
    resp_rate_rpm: Optional[int] = Field(None, ge=1, le=60)
    spo2_pct: Optional[int] = Field(None, ge=50, le=100)
    supplemental_o2: Optional[bool] = None
    systolic_bp_mmhg: Optional[int] = Field(None, ge=40, le=300)
    heart_rate_bpm: Optional[int] = Field(None, ge=20, le=250)
    temperature_c: Optional[float] = Field(None, ge=30, le=43)
    avpu: Optional[str] = Field(None, pattern="^[AVPU]$")
    # Lien vers le plan chirurgical validé (rejeté avec 409 si non validé)
    plan_id: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=4000)
    auteur: Optional[str] = Field(None, max_length=128)


class IcuFollowUpOut(BaseModel):
    id: str
    patient_id: str
    recorded_at: datetime
    sofa_respiration: Optional[int] = None
    sofa_coagulation: Optional[int] = None
    sofa_hepatique: Optional[int] = None
    sofa_cardiovasculaire: Optional[int] = None
    sofa_neurologique: Optional[int] = None
    sofa_renal: Optional[int] = None
    sofa_total: Optional[int] = None
    apache2_score: Optional[int] = None
    glasgow_oculaire: Optional[int] = None
    glasgow_verbale: Optional[int] = None
    glasgow_motrice: Optional[int] = None
    glasgow_total: Optional[int] = None
    rass_score: Optional[int] = None
    vent_mode: Optional[str] = None
    vent_fio2_pct: Optional[float] = None
    vent_peep_cmh2o: Optional[float] = None
    vent_vt_ml: Optional[float] = None
    vent_fr_rpm: Optional[float] = None
    bilan_entrees_ml: Optional[float] = None
    bilan_sorties_ml: Optional[float] = None
    bilan_net_ml: Optional[float] = None
    resp_rate_rpm: Optional[int] = None
    spo2_pct: Optional[int] = None
    supplemental_o2: bool = False
    systolic_bp_mmhg: Optional[int] = None
    heart_rate_bpm: Optional[int] = None
    temperature_c: Optional[float] = None
    avpu: Optional[str] = None
    news2_total: Optional[int] = None
    sepsis_alert: bool = False
    plan_id: Optional[str] = None
    notes: Optional[str] = None
    auteur: Optional[str] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Jumeau numérique — propriétés biomécaniques (TwinBiomech)
# ---------------------------------------------------------------------------

BiomechModel = Literal["linear", "mooney_rivlin", "ogden", "neo_hookean"]
BiomechSource = Literal["literature_atlas", "patient_elastography", "clinician_override"]


class TwinBiomechIn(BaseModel):
    model: BiomechModel = "mooney_rivlin"
    parameters: Dict[str, float] = Field(..., description="Ex. {\"C10_kpa\": 2.1, \"C01_kpa\": 0.3}")
    source: BiomechSource = "clinician_override"
    validation_dataset_ref: Optional[str] = Field(None, max_length=2000)


class ElastographyIngestIn(BaseModel):
    tissue_type: str = Field("liver_parenchyma", description="Type de tissu (ex. 'liver_parenchyma', 'liver_tumor')")
    mean_shear_stiffness_kpa: float = Field(..., gt=0.0, description="Rigidité moyenne mesurée en kPa (Shear Wave Elastography / MRE)")
    frequency_hz: Optional[float] = Field(50.0, description="Fréquence d'excitation MRE en Hz")
    elastography_type: str = Field("shear_wave_elastography", description="Technique : 'shear_wave_elastography', 'mre_50hz', 'transient_elastography'")
    validation_dataset_ref: Optional[str] = Field(None, max_length=2000)


class TwinBiomechOut(BaseModel):
    id: Optional[str] = None
    patient_id: str
    tissue_type: str
    model: BiomechModel
    parameters: Dict[str, float]
    source: BiomechSource
    validation_dataset_ref: Optional[str] = None
    note: Optional[str] = Field(None, description="Avertissement d'usage — présent seulement pour les valeurs d'atlas par défaut, absent une fois une vraie valeur patient enregistrée.")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TwinDeformRequest(BaseModel):
    job_id: str = Field(..., description="Job de segmentation déjà terminé (voir GET /segmentation/status/{job_id})")
    structure: str = Field(..., description="Nom de structure déjà segmentée, ex. 'liver_total' — doit avoir un maillage tétraédrique construit via POST /segmentation/{job_id}/tetmesh")
    tissue_type: str = Field(..., description="Clé TwinBiomech pour ce patient (ex. 'liver_parenchyma') — valeur enregistrée si présente, sinon défaut de l'atlas littérature")
    grab_point_mm: list[float] = Field(..., min_length=3, max_length=3, description="Point 3D (mm, repère du maillage) le plus proche du nœud saisi")
    target_delta_mm: list[float] = Field(..., min_length=3, max_length=3, description="Déplacement imposé (mm) au nœud saisi")
    pin_axis_fraction: float = Field(0.12, ge=0.0, le=0.5, description="Fraction de l'étendue en X ancrée (pédicule) — même convention que l'ancrage procédural du frontend")
    hyd_stiffness: float = Field(0.6, gt=0.0, le=1.0, description="Rigidité volumique (quasi-incompressibilité) — pas dérivée de TwinBiomech, qui ne modélise pas de module de compressibilité séparé")
    iterations: int = Field(30, ge=1, le=200)


class TwinDeformResponse(BaseModel):
    job_id: str
    structure: str
    tissue_type: str
    num_nodes: int
    num_tets: int
    grabbed_node_index: int
    dev_stiffness: float
    hyd_stiffness: float
    volume_ml_before: float
    volume_ml_after: float
    displacement_mm: list[list[float]] = Field(..., description="Déplacement (mm) de chaque nœud par rapport à sa position au repos, même ordre que le maillage stocké")


# ---------------------------------------------------------------------------
# DICOM
# ---------------------------------------------------------------------------

class DicomMetadata(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    series_uid: str
    study_uid: str
    modality: str
    slice_thickness_mm: Optional[float] = None
    rows: Optional[int] = None
    cols: Optional[int] = None
    num_slices: Optional[int] = None
    filename: Optional[str] = None
    local_path: Optional[str] = None


class DicomUploadResponse(BaseModel):
    series_uid: str
    sha256: str


class SegmentationStartResponse(BaseModel):
    job_id: str
    status: str = "pending"


# ---------------------------------------------------------------------------
# Volumetrie
# ---------------------------------------------------------------------------

class VolumetrieResponse(BaseModel):
    patient_id: str
    specialty: str
    organ_volume_ml: float
    lesion_volume_ml: float
    ratio_lesion_organe_pct: float
    volume_resection_ml: float
    remnant_pct: float
    margin_cm: float
    # Honnêteté sur l'origine de volume_resection_ml — voir routers/volumetrie.py :
    # False quand un vrai segment type="resection" existe pour ce patient
    # (volume mesuré, pas estimé), True quand c'est encore l'approximation
    # heuristique de repli.
    resection_volume_is_estimated: bool = True
    resection_calculation_method: str = ""
    # HBP-specific
    tlv_ml: Optional[float] = None
    tv_ml: Optional[float] = None
    flr_pct: Optional[float] = None
    flr_threshold_pct: Optional[float] = None
    flr_safe: Optional[bool] = None
    flr_bw_pct: Optional[float] = None
    bsa_m2: Optional[float] = None


# ---------------------------------------------------------------------------
# Chat / IA
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    specialty: Specialty = "hbp"
    context: Literal["surgical-planning", "surgical-summary"] = "surgical-planning"


class ChatResponse(BaseModel):
    reply: str
    source: str
    user: str
    fallback_from: Optional[str] = None


class AIProxyRequest(BaseModel):
    model: str = Field(..., min_length=1, max_length=128)
    body: Dict[str, Any]


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------

class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: Optional[str]
    patient_id: Optional[str]
    action: str
    resource: Optional[str]
    method: Optional[str]
    path: Optional[str]
    status_code: Optional[int]
    niveau: str
    created_at: datetime

# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

class DicomSRExportRequest(BaseModel):
    patient: Dict[str, Any]
    specialty: Optional[str] = None
    volumetrie: Dict[str, Any] = {}
    notes: Optional[str] = None


class DicomSRExportResponse(BaseModel):
    PatientID: Optional[str]
    PatientName: Optional[str]
    Specialty: Optional[str]
    StudyDate: str
    SurgicalPlan: Dict[str, Any]
    Observations: Optional[str]


# ---------------------------------------------------------------------------
# OR Duration Analytics
# ---------------------------------------------------------------------------

class ProcedureStatsItem(BaseModel):
    procedure_id: str
    procedure_name: str
    sample_count: int
    estimated_duration_mins: int
    avg_actual_duration_mins: float
    p50_duration_mins: float
    p90_duration_mins: float
    recommendation: str

class ProcedureDurationStatsResponse(BaseModel):
    stats: List[ProcedureStatsItem]
