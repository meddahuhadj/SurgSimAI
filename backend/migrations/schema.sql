-- GeneralSurg Plan MIMO — Schéma PostgreSQL
-- ======================================
-- Exécuter avec: psql -U postgres -d generalsurg -f schema.sql
-- (ou laisser main.py le faire automatiquement au démarrage / via Alembic)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: institutions (tenants) — voir backend/tenancy.py et deps.get_scoped_patient.
-- Toute donnée patient est rattachée à exactement une institution ; aucune
-- requête applicative ne doit pouvoir traverser cette frontière.
CREATE TABLE institutions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(255) NOT NULL,
    kind         VARCHAR(32) NOT NULL DEFAULT 'personal',  -- 'personal' | 'organization'
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Table: institution_licenses (entitlement — PAS de facturation, voir backend/licensing.py)
-- 1:1 avec institutions. plan/max_seats/enabled_modules décident ce que
-- l'institution a le droit d'utiliser ; deps.require_module les vérifie.
CREATE TABLE institution_licenses (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id   UUID NOT NULL UNIQUE REFERENCES institutions(id) ON DELETE CASCADE,
    plan             VARCHAR(32) NOT NULL DEFAULT 'trial',
    max_seats        INTEGER NOT NULL DEFAULT 1,
    enabled_modules  JSONB NOT NULL DEFAULT '["core"]',
    expires_at       TIMESTAMPTZ,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Table: users (chirurgiens, anesthésistes, etc.) — avec support 2FA (TOTP)
CREATE TABLE users (
    id                   SERIAL PRIMARY KEY,
    username             VARCHAR(64) UNIQUE NOT NULL,
    full_name            VARCHAR(128) NOT NULL,
    email                VARCHAR(256) UNIQUE,
    role                 VARCHAR(32) NOT NULL DEFAULT 'surgeon',
    hashed_password      TEXT NOT NULL,
    rpps                 VARCHAR(32),
    is_active            BOOLEAN DEFAULT TRUE,
    institution_id       UUID NOT NULL REFERENCES institutions(id),
    totp_secret          VARCHAR(64),              -- secret actif (2FA activée)
    totp_pending_secret  VARCHAR(64),               -- secret en attente de confirmation
    totp_enabled         BOOLEAN DEFAULT FALSE,
    totp_recovery_codes  JSONB DEFAULT '[]',        -- codes de secours à usage unique (hashés)
    last_login_at        TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Table: patients
CREATE TABLE patients (
    id              VARCHAR(32) PRIMARY KEY,
    nom             VARCHAR(128) NOT NULL,
    age             INTEGER CHECK (age >= 0 AND age <= 150),
    sexe            CHAR(1) CHECK (sexe IN ('M', 'F')),
    poids_kg        REAL CHECK (poids_kg > 0 AND poids_kg <= 500),
    taille_cm       REAL CHECK (taille_cm > 30 AND taille_cm <= 250),
    bsa_m2          REAL GENERATED ALWAYS AS (SQRT(poids_kg * taille_cm / 3600)) STORED,
    diagnostic      TEXT NOT NULL,
    chirurgien      VARCHAR(128) NOT NULL,
    specialty       VARCHAR(32) NOT NULL DEFAULT 'hbp'
                    CHECK (specialty IN ('hbp','colorectal','gastrique','thyroide','thoracique','cardiaque','urologie','anesthesie_reanimation')),
    urgence         VARCHAR(16) DEFAULT 'vert' CHECK (urgence IN ('vert','orange','rouge')),
    note            TEXT,
    status          VARCHAR(32) DEFAULT 'active',
    institution_id  UUID NOT NULL REFERENCES institutions(id),  -- toujours hérité du créateur, jamais fourni par le client
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_patients_institution ON patients(institution_id);

-- Table: sessions (contexte chirurgical en cours)
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    user_id         INTEGER REFERENCES users(id),
    type            VARCHAR(64),
    statut          VARCHAR(32) DEFAULT 'open',
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    locked          BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_sessions CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Table: segments (volumes segmentés — organes, lésions, résections, structures tubulaires)
CREATE TABLE segments (
    id              VARCHAR(64) PRIMARY KEY,
    session_id      UUID REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id      VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    type            VARCHAR(32) NOT NULL CHECK (type IN ('organe','lesion','resection','structure_tubulaire','ganglion')),
    volume_ml       REAL NOT NULL CHECK (volume_ml >= 0),
    label           VARCHAR(128),
    color_hex       VARCHAR(7) DEFAULT '#ff0000',
    mesh_ref        TEXT,               -- chemin/URL du maillage STL/GLB réel (segmentation)
    slice_refs      JSONB,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Table: preanesthesia_assessments (dossier & évaluation pré-anesthésique — un par patient)
CREATE TABLE preanesthesia_assessments (
    id                          VARCHAR(36) PRIMARY KEY,
    patient_id                  VARCHAR(32) UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    asa_score                   INTEGER CHECK (asa_score BETWEEN 1 AND 5),
    asa_urgence                 BOOLEAN DEFAULT FALSE,
    mallampati_score            INTEGER CHECK (mallampati_score BETWEEN 1 AND 4),
    antecedents                 TEXT,
    allergies                   TEXT,
    traitement_chronique        TEXT,
    jeune_solide_h               REAL,
    jeune_liquide_h              REAL,
    intubation_difficile_prevue BOOLEAN DEFAULT FALSE,
    intubation_difficile_notes  TEXT,
    checklist                   JSONB DEFAULT '[]',
    anesthesiste                VARCHAR(128),
    conclusion                  TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: icu_followups (suivi réanimation/USI — plusieurs évaluations par patient dans le temps)
CREATE TABLE icu_followups (
    id                     VARCHAR(36) PRIMARY KEY,
    patient_id             VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    recorded_at            TIMESTAMPTZ DEFAULT NOW(),
    sofa_respiration       INTEGER CHECK (sofa_respiration BETWEEN 0 AND 4),
    sofa_coagulation       INTEGER CHECK (sofa_coagulation BETWEEN 0 AND 4),
    sofa_hepatique         INTEGER CHECK (sofa_hepatique BETWEEN 0 AND 4),
    sofa_cardiovasculaire  INTEGER CHECK (sofa_cardiovasculaire BETWEEN 0 AND 4),
    sofa_neurologique      INTEGER CHECK (sofa_neurologique BETWEEN 0 AND 4),
    sofa_renal             INTEGER CHECK (sofa_renal BETWEEN 0 AND 4),
    sofa_total             INTEGER,
    apache2_score          INTEGER CHECK (apache2_score BETWEEN 0 AND 71),
    glasgow_oculaire       INTEGER CHECK (glasgow_oculaire BETWEEN 1 AND 4),
    glasgow_verbale        INTEGER CHECK (glasgow_verbale BETWEEN 1 AND 5),
    glasgow_motrice        INTEGER CHECK (glasgow_motrice BETWEEN 1 AND 6),
    glasgow_total          INTEGER,
    rass_score             INTEGER CHECK (rass_score BETWEEN -5 AND 4),
    vent_mode              VARCHAR(32),
    vent_fio2_pct          REAL,
    vent_peep_cmh2o        REAL,
    vent_vt_ml             REAL,
    vent_fr_rpm            REAL,
    bilan_entrees_ml       REAL,
    bilan_sorties_ml       REAL,
    bilan_net_ml           REAL,
    resp_rate_rpm          INTEGER CHECK (resp_rate_rpm BETWEEN 1 AND 60),
    spo2_pct               INTEGER CHECK (spo2_pct BETWEEN 50 AND 100),
    supplemental_o2        BOOLEAN NOT NULL DEFAULT FALSE,
    systolic_bp_mmhg       INTEGER CHECK (systolic_bp_mmhg BETWEEN 40 AND 300),
    heart_rate_bpm         INTEGER CHECK (heart_rate_bpm BETWEEN 20 AND 250),
    temperature_c          REAL,
    avpu                   VARCHAR(8) CHECK (avpu IN ('A', 'V', 'P', 'U')),
    news2_total            INTEGER,
    sepsis_alert           BOOLEAN NOT NULL DEFAULT FALSE,
    plan_id                VARCHAR(36) REFERENCES surgical_plans(id) ON DELETE SET NULL,
    notes                  TEXT,
    auteur                 VARCHAR(128),
    created_at             TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_icu_followups_plan ON icu_followups(plan_id);

-- Table: twin_biomech (propriétés mécaniques par tissu, jumeau numérique déformable)
-- Une ligne par (patient, tissue_type) : défaut littérature (source='literature_atlas',
-- voir backend/twin_biomech_atlas.py) ou valeur patiente réelle une fois l'élastographie
-- disponible (source='patient_elastography'/'clinician_override'). Voir feuille de route
-- "Jumeau numérique réel" (ARCHITECTURE_CAHIER_DES_CHARGES.md §2.2.1/§3.3).
CREATE TABLE twin_biomech (
    id                      VARCHAR(36) PRIMARY KEY,
    patient_id              VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    tissue_type             VARCHAR(32) NOT NULL,
    model                   VARCHAR(32) NOT NULL DEFAULT 'mooney_rivlin' CHECK (model IN ('linear','mooney_rivlin','ogden','neo_hookean')),
    parameters              JSONB NOT NULL DEFAULT '{}',
    source                  VARCHAR(32) NOT NULL DEFAULT 'literature_atlas' CHECK (source IN ('literature_atlas','patient_elastography','clinician_override')),
    validation_dataset_ref  TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (patient_id, tissue_type)
);

CREATE INDEX idx_twin_biomech_patient ON twin_biomech(patient_id);

-- Table: dicom_series
CREATE TABLE dicom_series (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id          VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    session_id          UUID REFERENCES sessions(id) ON DELETE SET NULL,
    study_uid           VARCHAR(256) NOT NULL,
    series_uid          VARCHAR(256) UNIQUE NOT NULL,
    modality            VARCHAR(8) CHECK (modality IN ('CT','MR','PT','US')),
    manufacturer        VARCHAR(128),
    model               VARCHAR(128),
    slice_thickness_mm  REAL,
    rows                INTEGER,
    cols                INTEGER,
    num_slices          INTEGER,
    pixel_spacing       REAL[],
    window_center       REAL,
    window_width        REAL,
    sha256              CHAR(16),
    size_bytes          BIGINT,
    file_path           TEXT,
    imported_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Table: volumetrie_results
CREATE TABLE volumetrie_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id          UUID REFERENCES sessions(id),
    patient_id          VARCHAR(32) REFERENCES patients(id),
    organ_volume_ml     REAL NOT NULL,
    lesion_volume_ml    REAL NOT NULL,
    ratio_lesion_organe_pct REAL,
    volume_resection_ml REAL,
    remnant_pct         REAL NOT NULL,
    flr_threshold_pct   REAL,
    flr_safe            BOOLEAN,
    flr_bw_pct          REAL,
    bsa_m2              REAL,
    margin_cm           REAL DEFAULT 1.0,
    is_cirrhotic        BOOLEAN DEFAULT FALSE,
    computed_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Table: plans_coupe
CREATE TABLE plans_coupe (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id            UUID REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id            VARCHAR(32) REFERENCES patients(id),
    type                  VARCHAR(64) NOT NULL,
    plane_normal          REAL[] NOT NULL,
    plane_point           REAL[] NOT NULL,
    distance_tumor_mm     REAL,
    distance_vaisseau_mm  REAL,
    volume_resected_ml    REAL,
    remnant_pct           REAL,
    validated             BOOLEAN DEFAULT FALSE,
    validated_by          INTEGER REFERENCES users(id),
    validated_at          TIMESTAMPTZ,
    metadata              JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Table: audit_log — traçabilité complète (qui, quand, quoi, sur quel patient)
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         INTEGER REFERENCES users(id),
    username        VARCHAR(64),          -- dénormalisé : reste lisible même si l'utilisateur est supprimé
    patient_id      VARCHAR(32),          -- pas de FK stricte : on veut garder la trace même si le patient est supprimé
    action          VARCHAR(256) NOT NULL,
    resource        VARCHAR(64),          -- ex: 'patient', 'segment', 'dicom', 'auth', 'export'
    method          VARCHAR(8),           -- verbe HTTP
    path            VARCHAR(256),
    status_code     INTEGER,
    ip_address      VARCHAR(64),
    niveau          VARCHAR(16) CHECK (niveau IN ('info','ok','warn','error')) DEFAULT 'info',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Table: export_history
CREATE TABLE export_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES sessions(id),
    patient_id      VARCHAR(32) REFERENCES patients(id),
    user_id         INTEGER REFERENCES users(id),
    format          VARCHAR(16) CHECK (format IN ('pdf','json','dicom-sr','dicom-rt')),
    file_path       TEXT,
    file_hash       CHAR(64),
    file_size_bytes BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_specialty ON patients(specialty);
CREATE INDEX idx_segments_patient ON segments(patient_id);
CREATE INDEX idx_segments_session ON segments(session_id);
CREATE INDEX idx_dicom_patient ON dicom_series(patient_id);
CREATE INDEX idx_dicom_study ON dicom_series(study_uid);
CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_volumetrie_session ON volumetrie_results(session_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_patient ON audit_log(patient_id);
CREATE INDEX idx_plans_session ON plans_coupe(session_id);
CREATE INDEX idx_exports_session ON export_history(session_id);

-- Triggers updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABLES GENERALSURG PLAN 3D NEXTGEN (v2.0 - 2026-2046)
-- Conformité : HIPAA / RGPD / MDR 2017/745 / IEC 62304 Classe C
-- ==============================================================================

-- Table: digital_twins (Jumeaux Numériques 3D & Biophysiques)
CREATE TABLE digital_twins (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id           VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    source_series_id     UUID REFERENCES dicom_series(id) ON DELETE SET NULL,
    version              VARCHAR(32) NOT NULL DEFAULT 'v2.0-nextgen',
    status               VARCHAR(32) NOT NULL DEFAULT 'READY' CHECK (status IN ('PROCESSING', 'READY', 'ARCHIVED', 'ERROR')),
    organ_target         VARCHAR(64) NOT NULL DEFAULT 'HBP',
    mesh_storage_uri     JSONB NOT NULL DEFAULT '{}'::jsonb,
    biophysical_props    JSONB NOT NULL DEFAULT '{}'::jsonb,
    vascular_graph_json  JSONB,
    volumetric_metrics   JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_digital_twins_patient ON digital_twins(patient_id);
CREATE TRIGGER digital_twins_updated_at BEFORE UPDATE ON digital_twins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Table: surgical_plans (Cycle de planification réelle — plans versionnés par patient)
-- Statuts: draft → reviewed → validated (signé) | rejected. Miroir de models.SurgicalPlan.
CREATE TABLE surgical_plans (
    id                VARCHAR(36) PRIMARY KEY,
    patient_id        VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    version           INTEGER NOT NULL,
    status            VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'surgeon_review', 'anesthesia_review', 'or_review', 'validated_for_scheduling', 'completed', 'post_op', 'rejected')),
    procedure         VARCHAR(256),
    author_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name       VARCHAR(128),
    snapshot          JSONB,
    source_series_id  VARCHAR(36) REFERENCES dicom_series(id) ON DELETE SET NULL,
    notes             TEXT,
    comment           TEXT,
    signed_by         VARCHAR(128),
    signed_at         TIMESTAMPTZ,
    reviewed_by       VARCHAR(128),
    reviewed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_surgical_plans_patient_version UNIQUE (patient_id, version)
);

CREATE INDEX idx_surgical_plans_patient ON surgical_plans(patient_id);
CREATE INDEX idx_surgical_plans_status ON surgical_plans(status);
CREATE TRIGGER surgical_plans_updated_at BEFORE UPDATE ON surgical_plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Table: audit_logs (Journal d'Audit Inaltérable - Conformité MDR/HIPAA avec chaînage SHA-256)
CREATE TABLE audit_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp_utc       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id             INTEGER,
    username            VARCHAR(64),
    user_role           VARCHAR(64),
    ip_address          VARCHAR(64),
    action_type         VARCHAR(64) NOT NULL,
    target_resource     VARCHAR(128) NOT NULL,
    resource_id         VARCHAR(64),
    details             JSONB NOT NULL DEFAULT '{}'::jsonb,
    cryptographic_hash  VARCHAR(64) NOT NULL,
    prev_log_hash       VARCHAR(64)
    validation_dataset_ref  TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (patient_id, tissue_type)
);

CREATE INDEX idx_twin_biomech_patient ON twin_biomech(patient_id);

-- Table: dicom_series
CREATE TABLE dicom_series (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id          VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    session_id          UUID REFERENCES sessions(id) ON DELETE SET NULL,
    study_uid           VARCHAR(256) NOT NULL,
    series_uid          VARCHAR(256) UNIQUE NOT NULL,
    modality            VARCHAR(8) CHECK (modality IN ('CT','MR','PT','US')),
    manufacturer        VARCHAR(128),
    model               VARCHAR(128),
    slice_thickness_mm  REAL,
    rows                INTEGER,
    cols                INTEGER,
    num_slices          INTEGER,
    pixel_spacing       REAL[],
    window_center       REAL,
    window_width        REAL,
    sha256              CHAR(16),
    size_bytes          BIGINT,
    file_path           TEXT,
    imported_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Table: volumetrie_results
CREATE TABLE volumetrie_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id          UUID REFERENCES sessions(id),
    patient_id          VARCHAR(32) REFERENCES patients(id),
    organ_volume_ml     REAL NOT NULL,
    lesion_volume_ml    REAL NOT NULL,
    ratio_lesion_organe_pct REAL,
    volume_resection_ml REAL,
    remnant_pct         REAL NOT NULL,
    flr_threshold_pct   REAL,
    flr_safe            BOOLEAN,
    flr_bw_pct          REAL,
    bsa_m2              REAL,
    margin_cm           REAL DEFAULT 1.0,
    is_cirrhotic        BOOLEAN DEFAULT FALSE,
    computed_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Table: plans_coupe
CREATE TABLE plans_coupe (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id            UUID REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id            VARCHAR(32) REFERENCES patients(id),
    type                  VARCHAR(64) NOT NULL,
    plane_normal          REAL[] NOT NULL,
    plane_point           REAL[] NOT NULL,
    distance_tumor_mm     REAL,
    distance_vaisseau_mm  REAL,
    volume_resected_ml    REAL,
    remnant_pct           REAL,
    validated             BOOLEAN DEFAULT FALSE,
    validated_by          INTEGER REFERENCES users(id),
    validated_at          TIMESTAMPTZ,
    metadata              JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Table: audit_log — traçabilité complète (qui, quand, quoi, sur quel patient)
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         INTEGER REFERENCES users(id),
    username        VARCHAR(64),          -- dénormalisé : reste lisible même si l'utilisateur est supprimé
    patient_id      VARCHAR(32),          -- pas de FK stricte : on veut garder la trace même si le patient est supprimé
    action          VARCHAR(256) NOT NULL,
    resource        VARCHAR(64),          -- ex: 'patient', 'segment', 'dicom', 'auth', 'export'
    method          VARCHAR(8),           -- verbe HTTP
    path            VARCHAR(256),
    status_code     INTEGER,
    ip_address      VARCHAR(64),
    niveau          VARCHAR(16) CHECK (niveau IN ('info','ok','warn','error')) DEFAULT 'info',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Table: export_history
CREATE TABLE export_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES sessions(id),
    patient_id      VARCHAR(32) REFERENCES patients(id),
    user_id         INTEGER REFERENCES users(id),
    format          VARCHAR(16) CHECK (format IN ('pdf','json','dicom-sr','dicom-rt')),
    file_path       TEXT,
    file_hash       CHAR(64),
    file_size_bytes BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_specialty ON patients(specialty);
CREATE INDEX idx_segments_patient ON segments(patient_id);
CREATE INDEX idx_segments_session ON segments(session_id);
CREATE INDEX idx_dicom_patient ON dicom_series(patient_id);
CREATE INDEX idx_dicom_study ON dicom_series(study_uid);
CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_volumetrie_session ON volumetrie_results(session_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_patient ON audit_log(patient_id);
CREATE INDEX idx_plans_session ON plans_coupe(session_id);
CREATE INDEX idx_exports_session ON export_history(session_id);

-- Triggers updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABLES GENERALSURG PLAN 3D NEXTGEN (v2.0 - 2026-2046)
-- Conformité : HIPAA / RGPD / MDR 2017/745 / IEC 62304 Classe C
-- ==============================================================================

-- Table: digital_twins (Jumeaux Numériques 3D & Biophysiques)
CREATE TABLE digital_twins (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id           VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    source_series_id     UUID REFERENCES dicom_series(id) ON DELETE SET NULL,
    version              VARCHAR(32) NOT NULL DEFAULT 'v2.0-nextgen',
    status               VARCHAR(32) NOT NULL DEFAULT 'READY' CHECK (status IN ('PROCESSING', 'READY', 'ARCHIVED', 'ERROR')),
    organ_target         VARCHAR(64) NOT NULL DEFAULT 'HBP',
    mesh_storage_uri     JSONB NOT NULL DEFAULT '{}'::jsonb,
    biophysical_props    JSONB NOT NULL DEFAULT '{}'::jsonb,
    vascular_graph_json  JSONB,
    volumetric_metrics   JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_digital_twins_patient ON digital_twins(patient_id);
CREATE TRIGGER digital_twins_updated_at BEFORE UPDATE ON digital_twins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Table: surgical_plans (Cycle de planification réelle — plans versionnés par patient)
-- Statuts: draft → reviewed → validated (signé) | rejected. Miroir de models.SurgicalPlan.
CREATE TABLE surgical_plans (
    id                VARCHAR(36) PRIMARY KEY,
    patient_id        VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    version           INTEGER NOT NULL,
    status            VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'surgeon_review', 'anesthesia_review', 'or_review', 'validated_for_scheduling', 'completed', 'post_op', 'rejected')),
    procedure         VARCHAR(256),
    author_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name       VARCHAR(128),
    snapshot          JSONB,
    source_series_id  VARCHAR(36) REFERENCES dicom_series(id) ON DELETE SET NULL,
    notes             TEXT,
    comment           TEXT,
    signed_by         VARCHAR(128),
    signed_at         TIMESTAMPTZ,
    reviewed_by       VARCHAR(128),
    reviewed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_surgical_plans_patient_version UNIQUE (patient_id, version)
);

CREATE INDEX idx_surgical_plans_patient ON surgical_plans(patient_id);
CREATE INDEX idx_surgical_plans_status ON surgical_plans(status);
CREATE TRIGGER surgical_plans_updated_at BEFORE UPDATE ON surgical_plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Table: audit_logs (Journal d'Audit Inaltérable - Conformité MDR/HIPAA avec chaînage SHA-256)
CREATE TABLE audit_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp_utc       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id             INTEGER,
    username            VARCHAR(64),
    user_role           VARCHAR(64),
    ip_address          VARCHAR(64),
    action_type         VARCHAR(64) NOT NULL,
    target_resource     VARCHAR(128) NOT NULL,
    resource_id         VARCHAR(64),
    details             JSONB NOT NULL DEFAULT '{}'::jsonb,
    cryptographic_hash  VARCHAR(64) NOT NULL,
    prev_log_hash       VARCHAR(64)
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp_utc DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);

-- ==============================================================================
-- OR COMMAND CENTER & CONSTRAINT ENGINE TABLES
-- ==============================================================================

-- Table: surgical_procedures (Catalogue métier des interventions)
CREATE TABLE surgical_procedures (
    id                          VARCHAR(36) PRIMARY KEY,
    name                        VARCHAR(128) NOT NULL,
    specialty                   VARCHAR(32) NOT NULL DEFAULT 'hbp',
    estimated_duration_mins     INTEGER NOT NULL DEFAULT 120,
    min_duration_mins           INTEGER NOT NULL DEFAULT 60,
    max_duration_mins           INTEGER NOT NULL DEFAULT 300,
    urgency_default             VARCHAR(16) DEFAULT 'elective',
    complexity_level            VARCHAR(16) DEFAULT 'medium',
    anesthesia_type             VARCHAR(32) DEFAULT 'general',
    required_equipment          JSONB DEFAULT '[]',
    required_icu_bed            BOOLEAN DEFAULT FALSE,
    required_icu_duration_hours DOUBLE PRECISION DEFAULT 0.0,
    required_surgeon_specialty  VARCHAR(32),
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: staff_availabilities
CREATE TABLE staff_availabilities (
    id                          VARCHAR(36) PRIMARY KEY,
    user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time                  TIMESTAMPTZ NOT NULL,
    end_time                    TIMESTAMPTZ NOT NULL,
    availability_type           VARCHAR(32) NOT NULL DEFAULT 'available',
    notes                       TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: room_availabilities
CREATE TABLE room_availabilities (
    id                          VARCHAR(36) PRIMARY KEY,
    operating_room_id           VARCHAR(36) NOT NULL REFERENCES operating_rooms(id) ON DELETE CASCADE,
    start_time                  TIMESTAMPTZ NOT NULL,
    end_time                    TIMESTAMPTZ NOT NULL,
    availability_type           VARCHAR(32) NOT NULL DEFAULT 'available',
    notes                       TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: equipment_availabilities
CREATE TABLE equipment_availabilities (
    id                          VARCHAR(36) PRIMARY KEY,
    equipment_id                VARCHAR(36) NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    start_time                  TIMESTAMPTZ NOT NULL,
    end_time                    TIMESTAMPTZ NOT NULL,
    availability_type           VARCHAR(32) NOT NULL DEFAULT 'available',
    notes                       TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bed_availabilities (Lits Réanimation / USI)
CREATE TABLE bed_availabilities (
    id                          VARCHAR(36) PRIMARY KEY,
    bed_identifier              VARCHAR(64) NOT NULL,
    department                  VARCHAR(32) NOT NULL DEFAULT 'USI',
    is_occupied                 BOOLEAN DEFAULT FALSE,
    occupied_by_patient_id      VARCHAR(32) REFERENCES patients(id) ON DELETE SET NULL,
    reserved_from               TIMESTAMPTZ,
    reserved_until              TIMESTAMPTZ,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: operating_rooms
CREATE TABLE operating_rooms (
    id                  VARCHAR(36) PRIMARY KEY,
    name                VARCHAR(128) NOT NULL,
    type                VARCHAR(64) DEFAULT 'general',
    is_active           BOOLEAN DEFAULT TRUE,
    capabilities        JSONB DEFAULT '[]', -- e.g., ["HBP", "CellSaver"]
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Table: operating_schedules (Central orchestration entity)
CREATE TABLE operating_schedules (
    id                          VARCHAR(36) PRIMARY KEY,
    operating_room_id           VARCHAR(36) REFERENCES operating_rooms(id) ON DELETE RESTRICT,
    patient_id                  VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    plan_id                     VARCHAR(36) REFERENCES surgical_plans(id) ON DELETE SET NULL,
    procedure_id                VARCHAR(36) REFERENCES surgical_procedures(id) ON DELETE SET NULL,
    start_time                  TIMESTAMPTZ NOT NULL,
    end_time                    TIMESTAMPTZ NOT NULL,
    estimated_duration_mins     INTEGER NOT NULL,
    status                      VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'confirmed', 'frozen', 'in_progress', 'completed', 'cancelled')),
    primary_surgeon_id          INTEGER REFERENCES users(id),
    anesthesiologist_id         INTEGER REFERENCES users(id),
    nurse_id                    INTEGER REFERENCES users(id),
    urgency_level               VARCHAR(16) DEFAULT 'elective',
    actual_incision_time        TIMESTAMPTZ,
    actual_end_time             TIMESTAMPTZ,
    delay_mins                  INTEGER DEFAULT 0,
    icu_bed_reserved            BOOLEAN DEFAULT FALSE,
    icu_reservation_start       TIMESTAMPTZ,
    icu_reservation_end         TIMESTAMPTZ,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_schedule_times CHECK (end_time > start_time)
);

CREATE INDEX idx_operating_schedules_room_time ON operating_schedules(operating_room_id, start_time);
CREATE INDEX idx_operating_schedules_patient ON operating_schedules(patient_id);

-- Table: equipments (inventory)
CREATE TABLE equipments (
    id                  VARCHAR(36) PRIMARY KEY,
    name                VARCHAR(128) NOT NULL,
    category            VARCHAR(64) NOT NULL, -- 'instrument', 'implant', 'machine'
    quantity_available  INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Table: schedule_equipments (M2M)
CREATE TABLE schedule_equipments (
    schedule_id         VARCHAR(36) REFERENCES operating_schedules(id) ON DELETE CASCADE,
    equipment_id        VARCHAR(36) REFERENCES equipments(id) ON DELETE CASCADE,
    quantity_needed     INTEGER NOT NULL DEFAULT 1,
    status              VARCHAR(32) DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'unavailable')),
    PRIMARY KEY (schedule_id, equipment_id)
);

CREATE TRIGGER surgical_procedures_updated_at BEFORE UPDATE ON surgical_procedures
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER bed_availabilities_updated_at BEFORE UPDATE ON bed_availabilities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER operating_rooms_updated_at BEFORE UPDATE ON operating_rooms
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER operating_schedules_updated_at BEFORE UPDATE ON operating_schedules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER equipments_updated_at BEFORE UPDATE ON equipments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Table: voice_notes (Notes dictées à la voix — Voice-First / Premier Interlocuteur)
-- Persiste les énoncés reconnus comme "Note : …" (ex. difficulté d'un étudiant sur les marges
-- utérines) pour traçabilité MDR/IEC 62304. Mirmé du modèle backend/models.py::VoiceNote.
CREATE TABLE voice_notes (
    id                  VARCHAR(36) PRIMARY KEY,
    patient_id          VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    author_username     VARCHAR(64) NOT NULL,
    specialty           VARCHAR(32),
    intent              VARCHAR(32),
    action_token        VARCHAR(64),
    text                TEXT NOT NULL,
    tags                JSONB DEFAULT '[]',
    confidence          REAL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_voice_notes_patient ON voice_notes(patient_id);
CREATE INDEX idx_voice_notes_created ON voice_notes(created_at DESC);
CREATE INDEX idx_voice_notes_tags ON voice_notes USING GIN (tags);

-- Seed: utilisateurs de démonstration (mot de passe: changeme)
-- À NE JAMAIS UTILISER EN PRODUCTION — créez de vrais comptes avant mise en service.
-- INSERT INTO users (username, full_name, role, hashed_password)
-- VALUES ('dr.hadj', 'Dr. Hadj', 'surgeon', crypt('changeme', gen_salt('bf')));
