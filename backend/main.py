# -*- coding: utf-8 -*-
"""
GeneralSurg Plan MIMO — Backend Sécurisé v2.0 (multi-spécialités)
==================================================================
Version "production-ready" (priorité 1 de la feuille de route) :
  ✓ Authentification forte : mot de passe (bcrypt) + 2FA TOTP optionnelle par utilisateur
  ✓ Persistance PostgreSQL (SQLAlchemy) — fallback SQLite zero-config en dev
  ✓ Migrations : migrations/schema.sql (versionné) + Alembic prêt à l'emploi
  ✓ Audit trail complet : qui, quand, quoi, sur quel patient — table audit_log,
    peuplée automatiquement par un middleware sur CHAQUE requête authentifiée.

Démarrage rapide (SQLite, aucune dépendance externe) :
    pip install -r requirements.txt
    cp .env.example .env
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Démarrage avec PostgreSQL :
    docker compose up -d db
    # éditer .env : DATABASE_URL=postgresql+psycopg2://generalsurg:generalsurg@localhost:5432/generalsurg
    alembic -c migrations/alembic.ini upgrade head
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
from pathlib import Path
import json
import time
import uuid
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Literal, Optional, List

from fastapi import (
    FastAPI, HTTPException, Depends, status, Request,
    UploadFile, File, WebSocket
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from jose import JWTError
from sqlalchemy.orm import Session
import httpx

from db import get_db, init_db
import models
import security as sec
import resilience

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
GEMINI_KEY      = os.getenv("GEMINI_KEY", "")
GEMINI_MODEL    = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
GROQ_KEY        = os.getenv("GROQ_KEY", "")
GROQ_MODEL      = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
# Défaut restreint au dev local — un déploiement réel doit positionner explicitement
# ALLOWED_ORIGINS dans .env (le garde-fou APP_ENV=production ci-dessous refuse de démarrer
# si la valeur est encore "*", combinée à allow_credentials=True c'était une origine XSS/CSRF).
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000").split(",")
SEED_DEMO_USERS = os.getenv("SEED_DEMO_USERS", "true").lower() == "true"

# ── Garde-fou anti-mauvaise-config (priorité sécurité, ajouté suite à l'audit
# de juillet 2026) ───────────────────────────────────────────────────────────
# APP_ENV=production est le SEUL signal qui doit déterminer un déploiement
# clinique réel — DATABASE_URL pointant vers Postgres n'est pas fiable comme
# signal (un dev peut très bien tester avec Postgres local). Par défaut
# "development", pour ne rien casser sur les postes de dev existants.
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
_JWT_SECRET_IS_DEFAULT = sec.JWT_SECRET == "CHANGEZ-MOI-EN-PRODUCTION"

if APP_ENV == "production":
    _fatal_errors = []
    if _JWT_SECRET_IS_DEFAULT:
        _fatal_errors.append(
            "JWT_SECRET est encore la valeur par défaut du code source "
            "(publique, visible dans security.py). N'importe qui peut forger "
            "un jeton d'authentification valide. Définissez une vraie valeur "
            "aléatoire dans .env (ex. `openssl rand -hex 32`)."
        )
    if SEED_DEMO_USERS:
        _fatal_errors.append(
            "SEED_DEMO_USERS=true : les comptes de démonstration "
            "dr.hadj/dr.benali (mot de passe 'changeme', public dans ce "
            "dépôt) seraient créés automatiquement. Positionnez "
            "SEED_DEMO_USERS=false dans .env avant la mise en production."
        )
    if "*" in ALLOWED_ORIGINS:
        _fatal_errors.append(
            "ALLOWED_ORIGINS contient '*' (toutes origines) combiné à "
            "allow_credentials=True — n'importe quel site web pourrait "
            "envoyer des requêtes authentifiées à cette API. Définissez "
            "la liste explicite des origines autorisées dans .env."
        )
    if _fatal_errors:
        raise RuntimeError(
            "\n\n🚫 Démarrage refusé (APP_ENV=production) — configuration non "
            "sûre pour un usage clinique :\n" +
            "\n".join(f"  - {e}" for e in _fatal_errors) +
            "\n\nCorrigez .env puis relancez. (Pour forcer un démarrage en "
            "dev/test avec cette config, utilisez APP_ENV=development.)\n"
        )
elif _JWT_SECRET_IS_DEFAULT or SEED_DEMO_USERS:
    # Hors production : on n'empêche rien (workflow de dev), mais on prévient
    # bruyamment dans les logs pour qu'un déploiement par erreur avec
    # APP_ENV oublié ne passe pas inaperçu.
    print(f"[startup] ⚠️  APP_ENV={APP_ENV!r} — secret JWT par défaut et/ou "
          f"comptes de démo actifs. Ne JAMAIS utiliser cette configuration "
          f"pour un vrai patient. Positionnez APP_ENV=production dans .env "
          f"pour que ces réglages non sûrs bloquent le démarrage.")

app = FastAPI(title="GeneralSurg Plan MIMO — Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Résilience — priorité 5 de la feuille de route.
# Deux garde-fous globaux pour qu'une panne d'infrastructure (DB, exception
# inattendue) ne renvoie jamais une trace Python brute au client (fuite
# d'information + mauvaise expérience) mais un message clair et exploitable,
# tout en gardant la trace complète côté serveur (logs + audit_log) pour le
# diagnostic. Chaque incident reçoit un error_id que le chirurgien peut
# communiquer au support technique.
# ---------------------------------------------------------------------------
import logging
import traceback as _traceback
from sqlalchemy.exc import OperationalError, DBAPIError

logger = logging.getLogger("generalsurg.resilience")


def _log_incident(request: Request, exc: Exception) -> str:
    error_id = uuid.uuid4().hex[:12]
    logger.error("[incident %s] %s %s -> %s: %s\n%s", error_id, request.method, request.url.path,
                 type(exc).__name__, exc, _traceback.format_exc())
    return error_id


@app.exception_handler(OperationalError)
@app.exception_handler(DBAPIError)
async def db_unavailable_handler(request: Request, exc: Exception):
    error_id = _log_incident(request, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Service de données temporairement indisponible. Réessayez dans quelques instants.",
                  "error_id": error_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # HTTPException est gérée nativement par FastAPI AVANT d'atteindre ce
    # handler générique (Starlette route les HTTPException séparément), donc
    # ceci ne capture que les échecs vraiment inattendus.
    error_id = _log_incident(request, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne inattendue. L'incident a été journalisé.",
                  "error_id": error_id},
    )


# ── Pipeline 3D réel : segmentation TotalSegmentator + export de maillages GLB ──
# Dossier où sont réellement sauvegardés les fichiers .dcm des séries
# importées (upload manuel, PACS DICOMweb, PACS DIMSE). Jusqu'à cette session,
# seules les MÉTADONNÉES étaient enregistrées en base (DicomSeries) : les
# pixels étaient jetés après calcul du hash/de la taille, rendant impossible
# d'envoyer une série déjà importée vers la segmentation sans la re-uploader
# manuellement. Indépendant de la disponibilité de TotalSegmentator : la
# sauvegarde des pixels a de la valeur même sans pipeline de segmentation
# installé (visualisation future, ré-export, etc.).
DICOM_STORAGE_DIR = Path(os.getenv("DICOM_STORAGE_DIR", "./storage/dicom_series")).resolve()
DICOM_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Endpoints exposés sous /segmentation/auto, /segmentation/status/{job_id},
# /segmentation/result/{job_id}, /segmentation/capabilities.
# Fonctionne même sans TotalSegmentator installé (l'erreur est renvoyée proprement
# dans le statut du job) ; nécessite scikit-image + trimesh pour l'export de maillage.
try:
    from fastapi.staticfiles import StaticFiles
    import segmentation_service
    segmentation_service.MESH_STORAGE.mkdir(parents=True, exist_ok=True)
    app.mount("/meshes", StaticFiles(directory=str(segmentation_service.MESH_STORAGE)), name="meshes")
    app.include_router(segmentation_service.router)
    REAL_SEGMENTATION_AVAILABLE = True
except Exception as e:  # noqa: BLE001
    print(f"[startup] Pipeline de segmentation réelle non chargé ({e}). "
          f"Aucune route /segmentation/* disponible tant que segmentation_service.py "
          f"n'est pas importable — vérifier requirements-segmentation.txt.")
    REAL_SEGMENTATION_AVAILABLE = False

# ── Connecteurs PACS (DICOMweb QIDO-RS/WADO-RS) + export FHIR R4 / HL7 v2 ──
# Endpoints exposés sous /pacs/*, /fhir/*, /hl7/* (priorité 4 de la feuille de
# route). Fonctionne même sans PACS configuré ni `dicomweb-client` installé :
# /pacs/capabilities répond alors honnêtement, les autres endpoints renvoient
# une erreur 400/502 explicite plutôt qu'une fausse réponse.
#
# IMPORTANT : chaque service RÉEL est chargé dans son propre try/except pour
# qu'une erreur d'import sur un seul module n'empoisonne plus tous les autres
# (avant : un seul bloc try géant → une erreur sur un module désactivait
# silencieusement TOUS les routers, y compris les vrais endpoints cliniques).
_real_services = [
    ("pacs_router", "router"),
    ("pacs_router_v2", "router"),
    ("biomechanics_engine", "router"),
    ("voice_llm_service", "router"),
    ("voice_llm_service", "compliance_router"),
    ("hl7_anesthesia_service", "router"),
]
PACS_ROUTER_AVAILABLE = True
for _mod_name, _router_attr in _real_services:
    try:
        _mod = __import__(_mod_name)
        app.include_router(getattr(_mod, _router_attr))
    except Exception as e:  # noqa: BLE001
        print(f"[startup] {_mod_name}.{_router_attr} non chargé ({e}).")
        PACS_ROUTER_AVAILABLE = False

# ── Services EXPLORATOIRES (Jalons M21-M40) ─────────────────────────────────
# Nanorobots, interface cerveau-machine, cryo-BNCT, bio-impression, etc. Ce
# sont des concepts de recherche, PAS des dispositifs médicaux validés — ils
# ne doivent JAMAIS être exposés en production. Désactivés par défaut ; ne se
# chargent que si RESEARCH_MODE=true est explicitement positionné dans
# l'environnement (jamais en clinique, uniquement pour démonstration interne
# ou R&D encadrée). Voir aussi le Mode Recherche du frontend (bouton 🔬),
# qui doit rester cohérent avec ce flag côté serveur.
#
# monai_pipeline_v2 est inclus ici (et non dans _real_services) car audité et
# confirmé n'appeler ni torch ni monai : il retourne des volumes hépatiques et
# segments de Couinaud FIXES et IDENTIQUES pour tout patient (aucun calcul
# réel), tout en écrivant un enregistrement 'READY' en base avec un hash
# d'audit — sans jamais l'indiquer. Non utilisé par le frontend actuel
# (voir generalsurg_plan_mimo.html, qui appelle /segmentation/auto et
# segmentation_service.py, la vraie intégration TotalSegmentator).
#
# real_patient_dicom_mesh_service a été déplacé ici depuis _real_services :
# malgré son nom, il ne contacte aucun PACS et n'exécute aucune IA — c'est un
# dictionnaire codé en dur de 2 patients fictifs, auparavant étiqueté
# "CERTIFIED_CLINICAL_REAL_ANATOMY". Corrigé pour être honnête (voir le
# fichier), mais reste un module de démonstration, pas un flux clinique réel.
RESEARCH_MODE = os.environ.get("RESEARCH_MODE", "false").strip().lower() in ("1", "true", "yes")
_exploratory_services = [
    "monai_pipeline_v2",
    "webxr_spatial_service",
    "robotic_ras_service",
    "genai_microsurgery_service",
    "pqc_bioprinting_service",
    "bci_cortical_service",
    "nanorobotics_swarm_service",
    "autonomous_robotic_laser_service",
    "epigenetic_sonogenetics_service",
    "raman_spectroscopy_plasma_service",
    "cryo_ire_bnct_service",
    "organoid_biomimetic_assembly_service",
    "iknife_reims_theranostics_service",
    "real_patient_dicom_mesh_service",
]
if RESEARCH_MODE:
    print("[startup] ⚠️ RESEARCH_MODE=true — chargement des services exploratoires "
          "NON VALIDÉS CLINIQUEMENT. Ne jamais activer ce flag en production.")
    for _mod_name in _exploratory_services:
        try:
            _mod = __import__(_mod_name)
            app.include_router(_mod.router)
        except Exception as e:  # noqa: BLE001
            print(f"[startup] Service exploratoire {_mod_name} non chargé ({e}).")
else:
    print(f"[startup] Mode clinique (RESEARCH_MODE=false) — "
          f"{len(_exploratory_services)} services exploratoires non chargés : "
          f"{', '.join(_exploratory_services)}")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

Specialty = Literal["hbp", "colorectal", "gastrique", "thyroide", "thoracique", "cardiaque", "urologie"]

SPECIALTY_LABELS = {
    "hbp": "Chirurgie Hépato-Bilio-Pancréatique",
    "colorectal": "Chirurgie Colorectale",
    "gastrique": "Chirurgie Gastrique",
    "thyroide": "Chirurgie Thyroïdienne",
    "thoracique": "Chirurgie Thoracique",
    "cardiaque": "Chirurgie Cardiaque",
    "urologie": "Chirurgie Urologique",
}


# ---------------------------------------------------------------------------
# Démarrage : création des tables si absentes + seed démo (dev uniquement)
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()
    if SEED_DEMO_USERS:
        db = next(get_db())
        try:
            if not db.query(models.User).first():
                # dr.hadj est seedé en rôle "admin" (uniquement pour que /audit, réservé aux
                # rôles admin/dpo depuis le durcissement RBAC, reste testable en dev) — à
                # remplacer par une vraie attribution de rôles avant toute mise en production.
                for username, full_name, role in [("dr.hadj", "Dr. Hadj", "admin"), ("dr.benali", "Dr. Benali", "surgeon")]:
                    db.add(models.User(
                        username=username, full_name=full_name, role=role,
                        hashed_password=sec.hash_password("changeme"),
                    ))
                db.commit()
                print("[startup] Utilisateurs de démonstration créés (dr.hadj / dr.benali, mdp: changeme). "
                      "⚠️  À supprimer avant toute mise en production.")
        finally:
            db.close()


# ---------------------------------------------------------------------------
# Audit trail — dépendance appelée explicitement dans les endpoints sensibles
# ---------------------------------------------------------------------------
def write_audit(db: Session, request: Request, action: str, resource: str,
                 user: Optional[models.User] = None, patient_id: Optional[str] = None,
                 niveau: str = "info", status_code: int = 200, metadata: Optional[dict] = None):
    entry = models.AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else None,
        patient_id=patient_id,
        action=action,
        resource=resource,
        method=request.method if request else None,
        path=str(request.url.path) if request else None,
        status_code=status_code,
        ip_address=request.client.host if request and request.client else None,
        niveau=niveau,
        metadata_json=metadata or {},
    )
    db.add(entry)
    db.commit()


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = sec.decode_token(token)
        if payload.get("scope") != "full":
            raise cred_exc
        username = payload.get("sub")
        if username is None:
            raise cred_exc
    except JWTError:
        raise cred_exc
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None or not user.is_active:
        raise cred_exc
    return user


def require_role(*allowed_roles: str):
    """
    Dépendance FastAPI pour restreindre un endpoint à certains rôles (RBAC).

    Ajouté suite à l'audit sécurité : `User.role` existait déjà (JWT, modèle) mais n'était
    vérifié nulle part — `GET /audit` (journal d'audit complet) était accessible à tout
    utilisateur authentifié, quel que soit son rôle. Usage : `Depends(require_role("admin"))`.
    """
    async def _check(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès réservé aux rôles {allowed_roles} (rôle actuel: {user.role!r}).",
            )
        return user
    return _check


# ---------------------------------------------------------------------------
# Modèles Pydantic (I/O API)
# ---------------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TwoFARequiredResponse(BaseModel):
    requires_2fa: bool = True
    pre_auth_token: str


class TwoFAVerifyRequest(BaseModel):
    pre_auth_token: str
    code: str  # code TOTP à 6 chiffres, ou code de secours


class TwoFAEnableRequest(BaseModel):
    code: str


class TwoFADisableRequest(BaseModel):
    code: str


class UserRegister(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    specialty: Specialty = "hbp"
    context: Literal["surgical-planning", "surgical-summary"] = "surgical-planning"


class AIRequest(BaseModel):
    model: str
    body: dict


class PatientBase(BaseModel):
    id: str = Field(..., min_length=1, max_length=32)
    nom: str
    age: int = Field(..., ge=0, le=150)
    sexe: Literal["M", "F"]
    poids_kg: float = Field(..., ge=1, le=500)
    taille_cm: float = Field(..., ge=30, le=250)
    diagnostic: str
    chirurgien: str
    specialty: Specialty = "hbp"
    urgence: Literal["vert", "orange", "rouge"] = "vert"
    note: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    nom: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    poids_kg: Optional[float] = Field(None, ge=1, le=500)
    taille_cm: Optional[float] = Field(None, ge=30, le=250)
    diagnostic: Optional[str] = None
    specialty: Optional[Specialty] = None
    urgence: Optional[Literal["vert", "orange", "rouge"]] = None
    note: Optional[str] = None


class PatientOut(PatientBase):
    created_at: datetime
    updated_at: datetime
    bsa: Optional[float] = None

    class Config:
        from_attributes = True


class SegmentCreate(BaseModel):
    id: str
    type: Literal["organe", "lesion", "resection", "structure_tubulaire", "ganglion"]
    volume_ml: float
    label: str
    color_hex: str = "#ff0000"
    mesh_ref: Optional[str] = None


class SegmentOut(SegmentCreate):
    patient_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class DicomMetadata(BaseModel):
    id: str
    series_uid: str
    study_uid: str
    modality: str
    slice_thickness_mm: float
    rows: int
    cols: int
    num_slices: int
    filename: Optional[str] = None
    local_path: Optional[str] = None

    class Config:
        from_attributes = True


class AuditOut(BaseModel):
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

    class Config:
        from_attributes = True


def _bsa(weight_kg: float, height_cm: float) -> float:
    return (weight_kg * height_cm / 3600) ** 0.5


def _flr_threshold(is_cirrhotic: bool, bsa: float) -> float:
    if is_cirrhotic:
        return max(35.0, 30.0 + 12.0 * (1.0 - bsa / 1.9))
    return max(25.0, 20.0 + 10.0 * (1.0 - bsa / 1.9))


# ---------------------------------------------------------------------------
# Auth endpoints — flux 2FA complet
# ---------------------------------------------------------------------------
@app.post("/auth/token")
async def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Rate limiting (priorité sécurité, ajouté suite à l'audit) : aucune limite n'existait avant
    # sur cet endpoint, un brute-force du mot de passe n'était pas mitigé. Clé = IP appelante.
    client_ip = request.client.host if request.client else "unknown"
    resilience.AUTH_RATE_LIMITER.check(client_ip)

    user = db.query(models.User).filter(models.User.username == form.username).first()
    if not user or not sec.verify_password(form.password, user.hashed_password) or not user.is_active:
        write_audit(db, request, "Échec de connexion", "auth", user=None, niveau="warn", status_code=401,
                    metadata={"username_attempted": form.username})
        raise HTTPException(status_code=401, detail="Identifiants invalides.", headers={"WWW-Authenticate": "Bearer"})

    if user.totp_enabled:
        write_audit(db, request, "Mot de passe validé — 2FA requise", "auth", user=user, niveau="info")
        return TwoFARequiredResponse(pre_auth_token=sec.create_pre_auth_token(user.username))

    user.last_login_at = datetime.utcnow()
    db.commit()
    write_audit(db, request, "Connexion réussie (sans 2FA)", "auth", user=user, niveau="ok")
    token = sec.create_token(user.username, scope="full", extra={"role": user.role})
    return Token(access_token=token, expires_in=sec.JWT_TTL_MIN * 60)


@app.post("/auth/2fa/verify", response_model=Token)
async def verify_2fa(req: TwoFAVerifyRequest, request: Request, db: Session = Depends(get_db)):
    try:
        payload = sec.decode_token(req.pre_auth_token)
        if payload.get("scope") != "2fa_pending":
            raise JWTError()
    except JWTError:
        raise HTTPException(401, "Jeton pré-authentification invalide ou expiré.")

    user = db.query(models.User).filter(models.User.username == payload["sub"]).first()
    if not user or not user.totp_enabled:
        raise HTTPException(401, "Utilisateur introuvable ou 2FA non active.")

    ok = sec.verify_totp(user.totp_secret, req.code) or sec.verify_recovery_code(user.totp_recovery_codes, req.code)
    if not ok:
        write_audit(db, request, "Code 2FA invalide", "auth", user=user, niveau="warn", status_code=401)
        raise HTTPException(401, "Code de vérification invalide.")

    # Si un code de secours a été utilisé, on le retire (usage unique)
    if req.code.strip().lower() in [] :
        pass
    hashed = sec.hash_recovery_code(req.code)
    if hashed in (user.totp_recovery_codes or []):
        user.totp_recovery_codes = [c for c in user.totp_recovery_codes if c != hashed]

    user.last_login_at = datetime.utcnow()
    db.commit()
    write_audit(db, request, "Connexion réussie (2FA validée)", "auth", user=user, niveau="ok")
    token = sec.create_token(user.username, scope="full", extra={"role": user.role})
    return Token(access_token=token, expires_in=sec.JWT_TTL_MIN * 60)


@app.post("/auth/2fa/setup")
async def setup_2fa(current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Étape 1 : génère un secret + QR code. La 2FA n'est PAS encore activée."""
    secret = sec.generate_totp_secret()
    current.totp_pending_secret = secret
    db.commit()
    uri = sec.totp_uri(current.username, secret)
    return {"secret": secret, "otpauth_uri": uri, "qr_png_base64": sec.totp_qr_png_base64(uri)}


@app.post("/auth/2fa/enable")
async def enable_2fa(req: TwoFAEnableRequest, request: Request,
                      current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Étape 2 : confirme l'enrôlement avec un code généré depuis l'app d'authentification."""
    if not current.totp_pending_secret:
        raise HTTPException(400, "Aucun enrôlement 2FA en cours. Appelez /auth/2fa/setup d'abord.")
    if not sec.verify_totp(current.totp_pending_secret, req.code):
        raise HTTPException(400, "Code invalide. Vérifiez l'heure de votre appareil et réessayez.")

    current.totp_secret = current.totp_pending_secret
    current.totp_pending_secret = None
    current.totp_enabled = True
    codes = sec.generate_recovery_codes()
    current.totp_recovery_codes = [sec.hash_recovery_code(c) for c in codes]
    db.commit()
    write_audit(db, request, "2FA activée", "auth", user=current, niveau="ok")
    return {"enabled": True, "recovery_codes": codes,
            "warning": "Notez ces codes de secours maintenant — ils ne seront plus jamais affichés."}


@app.post("/auth/2fa/disable")
async def disable_2fa(req: TwoFADisableRequest, request: Request,
                       current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current.totp_enabled:
        raise HTTPException(400, "La 2FA n'est pas active.")
    if not (sec.verify_totp(current.totp_secret, req.code) or sec.verify_recovery_code(current.totp_recovery_codes, req.code)):
        raise HTTPException(400, "Code invalide.")
    current.totp_enabled = False
    current.totp_secret = None
    current.totp_recovery_codes = []
    db.commit()
    write_audit(db, request, "2FA désactivée", "auth", user=current, niveau="warn")
    return {"enabled": False}


@app.post("/auth/register")
async def register(creds: UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == creds.username).first():
        raise HTTPException(400, "Utilisateur déjà existant.")
    if len(creds.password) < 8:
        raise HTTPException(400, "Mot de passe trop court (min 8 caractères).")
    db.add(models.User(
        username=creds.username, full_name=creds.full_name or creds.username,
        role="surgeon", hashed_password=sec.hash_password(creds.password),
    ))
    db.commit()
    return {"msg": "Utilisateur créé. Connectez-vous via /auth/token, puis activez la 2FA via /auth/2fa/setup."}


# ---------------------------------------------------------------------------
# Santé / méta
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "ai": bool(GEMINI_KEY or GROQ_KEY), "specialties": list(SPECIALTY_LABELS.keys()),
            "db": sec.JWT_SECRET != "CHANGEZ-MOI-EN-PRODUCTION" and "configured" or "default-secret-change-me",
            "app_env": APP_ENV, "seed_demo_users": SEED_DEMO_USERS,
            "pacs_fhir_hl7": PACS_ROUTER_AVAILABLE, "pacs_configured": bool(os.getenv("PACS_QIDO_URL")),
            "circuit_breakers": {"gemini": resilience.GEMINI_BREAKER.status(),
                                  "groq": resilience.GROQ_BREAKER.status(),
                                  "pacs": resilience.PACS_BREAKER.status()}}


@app.get("/specialties")
async def list_specialties():
    return SPECIALTY_LABELS


# ---------------------------------------------------------------------------
# Patients CRUD (persistés + audités)
# ---------------------------------------------------------------------------
def _patient_out(p: models.Patient) -> PatientOut:
    return PatientOut(
        id=p.id, nom=p.nom, age=p.age, sexe=p.sexe, poids_kg=p.poids_kg, taille_cm=p.taille_cm,
        diagnostic=p.diagnostic, chirurgien=p.chirurgien, specialty=p.specialty, urgence=p.urgence,
        note=p.note, created_at=p.created_at, updated_at=p.updated_at, bsa=p.bsa_m2,
    )


@app.get("/patients", response_model=List[PatientOut])
async def list_patients(specialty: Optional[Specialty] = None,
                         current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(models.Patient)
    if specialty:
        q = q.filter(models.Patient.specialty == specialty)
    return [_patient_out(p) for p in q.all()]


@app.get("/patients/{patient_id}", response_model=PatientOut)
async def get_patient(patient_id: str, request: Request,
                       current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.Patient).get(patient_id)
    if not p:
        raise HTTPException(404, "Patient introuvable.")
    write_audit(db, request, "Consultation dossier patient", "patient", user=current, patient_id=patient_id)
    return _patient_out(p)


@app.post("/patients", response_model=PatientOut, status_code=201)
async def create_patient(p: PatientCreate, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if db.query(models.Patient).get(p.id):
        raise HTTPException(400, "ID patient déjà existant.")
    rec = models.Patient(**p.dict())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    write_audit(db, request, "Création patient", "patient", user=current, patient_id=p.id, niveau="ok")
    return _patient_out(rec)


@app.put("/patients/{patient_id}", response_model=PatientOut)
async def update_patient(patient_id: str, p: PatientUpdate, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.query(models.Patient).get(patient_id)
    if not rec:
        raise HTTPException(404, "Patient introuvable.")
    updates = p.dict(exclude_unset=True)
    for k, v in updates.items():
        setattr(rec, k, v)
    db.commit()
    db.refresh(rec)
    write_audit(db, request, "Modification patient", "patient", user=current, patient_id=patient_id,
                niveau="ok", metadata={"fields": list(updates.keys())})
    return _patient_out(rec)


@app.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.query(models.Patient).get(patient_id)
    if not rec:
        raise HTTPException(404, "Patient introuvable.")
    db.delete(rec)
    db.commit()
    write_audit(db, request, "Suppression patient", "patient", user=current, patient_id=patient_id, niveau="warn")
    return {"deleted": patient_id}


# ---------------------------------------------------------------------------
# Segments
# ---------------------------------------------------------------------------
@app.get("/patients/{patient_id}/segments", response_model=List[SegmentOut])
async def list_segments(patient_id: str, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.query(models.Patient).get(patient_id):
        raise HTTPException(404, "Patient introuvable.")
    return db.query(models.Segment).filter(models.Segment.patient_id == patient_id).all()


@app.post("/patients/{patient_id}/segments", response_model=SegmentOut, status_code=201)
async def create_segment(patient_id: str, s: SegmentCreate, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.query(models.Patient).get(patient_id):
        raise HTTPException(404, "Patient introuvable.")
    rec = models.Segment(patient_id=patient_id, **s.dict())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    write_audit(db, request, f"Ajout segment ({s.type})", "segment", user=current, patient_id=patient_id)
    return rec


@app.delete("/patients/{patient_id}/segments/{segment_id}")
async def delete_segment(patient_id: str, segment_id: str, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.query(models.Segment).filter(models.Segment.id == segment_id, models.Segment.patient_id == patient_id).first()
    if not rec:
        raise HTTPException(404, "Segment introuvable.")
    db.delete(rec)
    db.commit()
    write_audit(db, request, "Suppression segment", "segment", user=current, patient_id=patient_id, niveau="warn")
    return {"deleted": segment_id}


# ---------------------------------------------------------------------------
# DICOM
# ---------------------------------------------------------------------------
@app.post("/dicom/upload")
async def upload_dicom(patient_id: str, study_uid: str, modality: str = "CT", slice_thickness_mm: float = 1.0,
                        file: UploadFile = File(...), request: Request = None,
                        current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.query(models.Patient).get(patient_id):
        raise HTTPException(404, "Patient introuvable.")
    content = await file.read()
    sha = hashlib.sha256(content).hexdigest()[:16]
    series_uid = str(uuid.uuid4())

    # Sauvegarde réelle des pixels (bug corrigé : jusqu'ici `content` n'était
    # utilisé que pour le hash/la taille, puis jeté — rendant impossible tout
    # usage ultérieur, y compris la segmentation, sans re-upload manuel).
    series_dir = DICOM_STORAGE_DIR / series_uid
    series_dir.mkdir(parents=True, exist_ok=True)
    dest_path = series_dir / (file.filename or "uploaded.dcm")
    with open(dest_path, "wb") as f:
        f.write(content)

    rec = models.DicomSeries(
        id=series_uid, patient_id=patient_id, study_uid=study_uid, series_uid=series_uid,
        modality=modality, slice_thickness_mm=slice_thickness_mm, rows=512, cols=512,
        num_slices=max(1, len(content) // (512 * 512 * 2)), sha256=sha, size_bytes=len(content),
        filename=file.filename or "uploaded.dcm", local_path=str(series_dir),
    )
    db.add(rec)
    db.commit()
    write_audit(db, request, "Import DICOM", "dicom", user=current, patient_id=patient_id,
                metadata={"series_uid": series_uid, "modality": modality})
    return {"series_uid": series_uid, "sha256": sha}


@app.get("/dicom/{patient_id}", response_model=List[DicomMetadata])
async def list_dicom(patient_id: str, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.DicomSeries).filter(models.DicomSeries.patient_id == patient_id).all()


@app.post("/segmentation/from-series/{series_id}", status_code=202)
async def segment_from_existing_series(series_id: str, request: Request,
                                        current: models.User = Depends(get_current_user),
                                        db: Session = Depends(get_db)):
    """Démarre une segmentation IA réelle à partir d'une série DICOM DÉJÀ
    IMPORTÉE (upload manuel, PACS DICOMweb ou DIMSE) — sans avoir à
    re-sélectionner les fichiers depuis l'ordinateur. C'est le pont qui
    manquait entre l'import PACS/DICOM et le viewer 3D : avant cette
    session, aucune série importée n'était réellement sauvegardée sur
    disque, donc aucune ne pouvait être segmentée sans re-upload."""
    if not REAL_SEGMENTATION_AVAILABLE:
        raise HTTPException(503, "Pipeline de segmentation réelle non disponible côté serveur "
                                  "(TotalSegmentator/dicom2nifti non installés).")
    series = db.query(models.DicomSeries).get(series_id)
    if not series:
        raise HTTPException(404, "Série DICOM introuvable.")
    if not series.local_path:
        raise HTTPException(
            400,
            "Cette série n'a pas de pixels sauvegardés sur disque (importée avant la correction "
            "de ce bug, ou import incomplet). Réimportez-la (upload manuel ou PACS) pour pouvoir "
            "la segmenter directement depuis cet endpoint."
        )
    local_dir = Path(series.local_path)
    if not local_dir.is_dir():
        raise HTTPException(410, f"Le dossier local de cette série n'existe plus sur ce serveur ({local_dir}).")

    try:
        job_id = segmentation_service.start_job_from_dicom_dir(local_dir, series.patient_id)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except RuntimeError as e:
        # dicom2nifti absent, ou conversion DICOM->NIfTI impossible (série
        # invalide/incomplète) — cas normal et attendu si le pipeline de
        # segmentation réelle n'est pas installé sur ce serveur, pas une
        # panne inattendue : ne doit jamais remonter en 500 brut.
        raise HTTPException(503, str(e)) from e

    write_audit(db, request, "Segmentation IA depuis série importée", "segmentation", user=current,
                patient_id=series.patient_id, metadata={"series_id": series_id, "job_id": job_id})
    return {"job_id": job_id, "status": "pending"}


# ---------------------------------------------------------------------------
# Volumétrie
# ---------------------------------------------------------------------------
@app.get("/patients/{patient_id}/volumetrie")
async def get_volumetrie(patient_id: str, request: Request, margin_cm: float = 1.0, is_cirrhotic: bool = False,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.Patient).get(patient_id)
    if not p:
        raise HTTPException(404, "Patient introuvable.")
    segments = db.query(models.Segment).filter(models.Segment.patient_id == patient_id).all()
    organe_vol = sum(s.volume_ml for s in segments if s.type == "organe")
    lesion_vol = sum(s.volume_ml for s in segments if s.type == "lesion")

    if organe_vol == 0:
        organe_vol = {"hbp": 1450.0, "colorectal": 350.0, "gastrique": 1100.0, "thyroide": 20.0,
                       "thoracique": 4500.0, "cardiaque": 300.0, "urologie": 150.0}.get(p.specialty, 500.0)
    if lesion_vol == 0:
        lesion_vol = 20.0

    resected = organe_vol * 0.55 + margin_cm * 32
    remnant_pct = round((organe_vol - resected) / organe_vol * 100, 1)

    result = {
        "patient_id": patient_id, "specialty": p.specialty,
        "organ_volume_ml": round(organe_vol, 1), "lesion_volume_ml": round(lesion_vol, 1),
        "ratio_lesion_organe_pct": round(lesion_vol / organe_vol * 100, 1),
        "volume_resection_ml": round(resected), "remnant_pct": remnant_pct, "margin_cm": margin_cm,
    }
    if p.specialty == "hbp":
        bsa_val = _bsa(p.poids_kg, p.taille_cm)
        threshold = round(_flr_threshold(is_cirrhotic, bsa_val), 1)
        result.update({
            "tlv_ml": round(organe_vol, 1), "tv_ml": round(lesion_vol, 1), "flr_pct": remnant_pct,
            "flr_threshold_pct": threshold, "flr_safe": remnant_pct >= threshold,
            "flr_bw_pct": round(remnant_pct * 0.7 / 70, 2), "bsa_m2": round(bsa_val, 2),
        })

    db.add(models.VolumetrieResult(
        id=str(uuid.uuid4()), patient_id=patient_id, organ_volume_ml=result["organ_volume_ml"],
        lesion_volume_ml=result["lesion_volume_ml"], ratio_lesion_organe_pct=result["ratio_lesion_organe_pct"],
        volume_resection_ml=result["volume_resection_ml"], remnant_pct=remnant_pct,
        flr_threshold_pct=result.get("flr_threshold_pct"), flr_safe=result.get("flr_safe"),
        flr_bw_pct=result.get("flr_bw_pct"), bsa_m2=result.get("bsa_m2"), margin_cm=margin_cm,
        is_cirrhotic=is_cirrhotic,
    ))
    write_audit(db, request, "Calcul volumétrie", "volumetrie", user=current, patient_id=patient_id)
    return result


# ---------------------------------------------------------------------------
# IA — chat contextualisé
# ---------------------------------------------------------------------------
# Instructions de commandes d'action pour l'interface — miroir exact de
# voiceCommandInstructions() côté frontend (generalsurg_plan_mimo.html).
# Utilisé uniquement par /chat (REST) : /ws/chat-stream reçoit son propre
# system prompt du frontend (déjà enrichi côté client), donc pas besoin de
# dupliquer ici pour ce chemin.
ACTION_COMMAND_INSTRUCTIONS = (
    "\n\nCOMMANDES D'ACTION — EXÉCUTION DANS L'INTERFACE :\n"
    "Quand l'utilisateur demande explicitement une action sur l'interface (pas une question clinique), "
    "réponds en commençant par [ACTION:nom_action] puis poursuis normalement. N'utilise ces commandes "
    "QUE si l'intention est claire et explicite.\n"
    "Actions disponibles : vue_3d, vue_mpr, zoom_avant, zoom_arriere, mode_clair, mode_sombre, "
    "bloc_operatoire_on, bloc_operatoire_off, mode_tactile_on, mode_tactile_off, "
    "mode_lecture_seule_on, mode_lecture_seule_off, open_analyse, open_ia, open_plan, open_implants, "
    "open_patients, open_settings, close_modal, recalc_analysis, export_plan, "
    "switch_hbp, switch_colorectal, switch_gastrique, switch_thyroide, switch_thoracique, "
    "switch_cardiaque, switch_urologie."
)


@app.post("/chat")
async def chat(req: ChatRequest, current: models.User = Depends(get_current_user)):
    label = SPECIALTY_LABELS.get(req.specialty, "chirurgie générale")
    system_prompt = (
        f"Tu es GeneralSurg Plan IA, assistant chirurgical expert en {label}. "
        f"Utilisateur: {current.full_name}. Réponds UNIQUEMENT en français, de façon concise et "
        "cliniquement pertinente. Précise que la décision finale reste au chirurgien."
    ) + ACTION_COMMAND_INSTRUCTIONS
    errors: List[str] = []

    if GEMINI_KEY:
        async def _call_gemini():
            body = {
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": req.message}]}],
                "generationConfig": {"maxOutputTokens": 512, "temperature": 0.4},
            }
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}"
            async with httpx.AsyncClient(timeout=45) as client:
                r = await client.post(url, json=body)
                r.raise_for_status()
                return r.json()
        try:
            data = await resilience.call_with_resilience(_call_gemini, resilience.GEMINI_BREAKER, max_attempts=1)
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Réponse non disponible.")
            return {"reply": text, "source": "gemini", "user": current.full_name}
        except resilience.CircuitOpenError as e:
            errors.append(f"Gemini: {e}")
        except Exception as e:  # noqa: BLE001 — on bascule sur Groq, on ne plante pas ici
            errors.append(f"Gemini indisponible ({type(e).__name__}: {e})")

    if GROQ_KEY:
        async def _call_groq():
            body = {"model": GROQ_MODEL, "messages": [{"role": "system", "content": system_prompt},
                                                        {"role": "user", "content": req.message}],
                    "max_tokens": 512, "temperature": 0.4}
            headers = {"Authorization": f"Bearer {GROQ_KEY}"}
            async with httpx.AsyncClient(timeout=45) as client:
                r = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body)
                r.raise_for_status()
                return r.json()
        try:
            data = await resilience.call_with_resilience(_call_groq, resilience.GROQ_BREAKER, max_attempts=1)
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "Réponse non disponible.")
            return {"reply": text, "source": "groq", "user": current.full_name,
                    "fallback_from": "gemini" if errors else None}
        except resilience.CircuitOpenError as e:
            errors.append(f"Groq: {e}")
        except Exception as e:  # noqa: BLE001
            errors.append(f"Groq indisponible ({type(e).__name__}: {e})")

    if not GEMINI_KEY and not GROQ_KEY:
        raise HTTPException(503, "Aucune clé IA configurée côté serveur (GEMINI_KEY / GROQ_KEY).")

    logger.warning("Tous les fournisseurs IA ont échoué pour /chat: %s", " | ".join(errors))
    raise HTTPException(503, "Les assistants IA (Gemini et Groq) sont temporairement indisponibles. "
                              "La planification reste utilisable sans IA ; réessayez dans quelques instants.")


@app.post("/api/ai/gemini")
async def proxy_gemini(req: AIRequest, current: models.User = Depends(get_current_user)):
    if not GEMINI_KEY:
        raise HTTPException(503, "Clé Gemini non configurée.")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{req.model}:generateContent?key={GEMINI_KEY}"
    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post(url, json=req.body)
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# WebSocket streaming pour chat IA
# ---------------------------------------------------------------------------
@app.websocket("/ws/chat-stream")
async def ws_chat_stream(ws: WebSocket):
    await ws.accept()
    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout=30)
        data = json.loads(raw)
    except (asyncio.TimeoutError, json.JSONDecodeError) as e:
        await ws.send_text(json.dumps({"error": "Message invalide: " + str(e)}))
        await ws.close()
        return

    user_msg = data.get("message", "")
    context = data.get("context", "")
    specialty = data.get("specialty", "hbp")
    label = SPECIALTY_LABELS.get(specialty, "chirurgie générale")
    system = data.get("system", f"Tu es un assistant chirurgical expert en {label}.")

    if not user_msg:
        await ws.send_text(json.dumps({"error": "Message vide"}))
        await ws.close()
        return

    full_prompt = f"{system}\n\n{context}\n\nMessage du chirurgien: {user_msg}"

    if GEMINI_KEY and resilience.GEMINI_BREAKER.state != "open":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:streamGenerateContent?key={GEMINI_KEY}&alt=sse"
            payload = {"contents": [{"parts": [{"text": full_prompt}]}],
                       "generationConfig": {"maxOutputTokens": 800, "temperature": 0.45}}
            got_any_chunk = False
            async with httpx.AsyncClient(timeout=60) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data:"):
                                chunk_str = line[5:].strip()
                                if not chunk_str or chunk_str == "[DONE]":
                                    continue
                                try:
                                    chunk = json.loads(chunk_str)
                                    text = chunk.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                                    if text:
                                        got_any_chunk = True
                                        await ws.send_text(json.dumps({"delta": text}))
                                except (json.JSONDecodeError, IndexError, KeyError):
                                    continue
                        await ws.send_text(json.dumps({"done": True}))
                        resilience.GEMINI_BREAKER.on_success()
                        return
                    else:
                        response.raise_for_status()
        except Exception as e:
            resilience.GEMINI_BREAKER.on_failure()
            print(f"[WS] Gemini streaming erreur: {e}, fallback Groq (disjoncteur: {resilience.GEMINI_BREAKER.status()})")
    elif GEMINI_KEY:
        print(f"[WS] Gemini ignoré (disjoncteur ouvert) — {resilience.GEMINI_BREAKER.status()}")

    if GROQ_KEY and resilience.GROQ_BREAKER.state != "open":
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
                    json={"model": GROQ_MODEL, "messages": [{"role": "system", "content": system},
                                                             {"role": "user", "content": context + "\n\n" + user_msg}],
                          "max_tokens": 700, "temperature": 0.45})
                if r.status_code == 200:
                    reply = r.json()["choices"][0]["message"]["content"]
                    resilience.GROQ_BREAKER.on_success()
                    for i in range(0, len(reply), 30):
                        await ws.send_text(json.dumps({"delta": reply[i:i + 30]}))
                        await asyncio.sleep(0.02)
                    await ws.send_text(json.dumps({"done": True}))
                    return
                r.raise_for_status()
        except Exception as e:
            resilience.GROQ_BREAKER.on_failure()
            print(f"[WS] Groq fallback erreur: {e} (disjoncteur: {resilience.GROQ_BREAKER.status()})")
    elif GROQ_KEY:
        print(f"[WS] Groq ignoré (disjoncteur ouvert) — {resilience.GROQ_BREAKER.status()}")

    await ws.send_text(json.dumps({
        "error": "IA indisponible (Gemini et Groq injoignables ou en cooldown après échecs répétés). "
                 "La planification reste utilisable sans IA."
    }))
    await ws.close()


# ---------------------------------------------------------------------------
# Audit trail — consultation
# ---------------------------------------------------------------------------
@app.get("/audit", response_model=List[AuditOut])
async def query_audit(patient_id: Optional[str] = None, username: Optional[str] = None, limit: int = 100,
                       current: models.User = Depends(require_role("admin", "dpo")), db: Session = Depends(get_db)):
    """Consultation du journal d'audit — réservé aux rôles admin/dpo (voir require_role)."""
    q = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc())
    if patient_id:
        q = q.filter(models.AuditLog.patient_id == patient_id)
    if username:
        q = q.filter(models.AuditLog.username == username)
    return q.limit(min(limit, 500)).all()


# ---------------------------------------------------------------------------
# Frontend helper
# ---------------------------------------------------------------------------
@app.get("/")
async def serve_frontend():
    path = os.path.join(os.path.dirname(__file__), "..", "generalsurg_plan_mimo.html")
    if os.path.exists(path):
        return FileResponse(path)
    return {"msg": "GeneralSurg Plan MIMO API — voir /docs pour la documentation."}


@app.post("/export/dicom-sr")
async def export_dicom_sr(data: dict, request: Request, current: models.User = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    sr_content = {
        "PatientID": data.get("patient", {}).get("id"),
        "PatientName": data.get("patient", {}).get("nom"),
        "Specialty": data.get("specialty"),
        "StudyDate": datetime.now().strftime("%Y%m%d"),
        "SurgicalPlan": {
            "OrganVolume": data.get("volumetrie", {}).get("organ_volume_ml"),
            "LesionVolume": data.get("volumetrie", {}).get("lesion_volume_ml"),
            "ResectionVolume": data.get("volumetrie", {}).get("volume_resection_ml"),
            "RemnantPct": data.get("volumetrie", {}).get("remnant_pct"),
        },
        "Observations": data.get("notes", ""),
    }
    write_audit(db, request, "Export plan (DICOM SR)", "export", user=current,
                patient_id=data.get("patient", {}).get("id"))
    return JSONResponse(sr_content)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
