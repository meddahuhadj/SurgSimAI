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

main.py orchestre l'application (config, garde-fous, middlewares, montage des
routers) ; la logique métier de chaque domaine vit dans routers/*.py (auth,
patients, dicom, volumetrie, chat, audit) et les dépendances transverses
(authentification, RBAC, audit trail) dans deps.py.

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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import Depends

from db import get_db, init_db, DATABASE_URL
import models
import security as sec
import resilience
from deps import get_current_user, require_role, write_audit, oauth2_scheme  # noqa: F401 (re-exportés)
from specialties import SPECIALTY_LABELS
from ai_config import GEMINI_KEY, GROQ_KEY

import routers.auth as auth_router
import routers.patients as patients_router
import routers.dicom as dicom_router
import routers.volumetrie as volumetrie_router
import routers.chat as chat_router
import routers.audit as audit_router

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
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
    if DATABASE_URL.startswith("sqlite"):
        _fatal_errors.append(
            "DATABASE_URL pointe vers SQLite (fichier local, perdu au "
            "redémarrage, un seul writer à la fois) — inadapté à un usage "
            "clinique réel. Définissez DATABASE_URL vers un PostgreSQL "
            "(ex. `docker compose up -d db`, voir migrations/README.md)."
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
    import uuid
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


# ---------------------------------------------------------------------------
# Routers par domaine (voir routers/*.py)
# ---------------------------------------------------------------------------
app.include_router(auth_router.router)
app.include_router(patients_router.router)
app.include_router(dicom_router.router)
app.include_router(volumetrie_router.router)
app.include_router(chat_router.router)
app.include_router(audit_router.router)

# routers/dicom.py charge segmentation_service.py (pipeline réel TotalSegmentator)
# dans son propre try/except et expose REAL_SEGMENTATION_AVAILABLE : app.mount()
# et un second app.include_router() sont des opérations de l'objet FastAPI `app`
# (pas d'un APIRouter), donc câblés ici plutôt que dans le router lui-même.
# Fonctionne même sans TotalSegmentator installé (l'erreur est renvoyée proprement
# dans le statut du job) ; nécessite scikit-image + trimesh pour l'export de maillage.
REAL_SEGMENTATION_AVAILABLE = dicom_router.REAL_SEGMENTATION_AVAILABLE
if REAL_SEGMENTATION_AVAILABLE:
    segmentation_service = dicom_router.segmentation_service
    segmentation_service.MESH_STORAGE.mkdir(parents=True, exist_ok=True)
    app.mount("/meshes", StaticFiles(directory=str(segmentation_service.MESH_STORAGE)), name="meshes")
    app.include_router(segmentation_service.router)

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
# (voir index.html / assets/app-part2.js, qui appelle /segmentation/auto et
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
# Frontend helper
# ---------------------------------------------------------------------------
# index.html référence son CSS/JS via des chemins relatifs "assets/..." (voir
# le découpage du frontend monolithique) : indispensable de servir ce dossier
# en statique quand le frontend est chargé depuis ce backend (Docker, ou tout
# déploiement qui sert index.html via FastAPI plutôt qu'un serveur statique
# séparé) — sans ce mount, le navigateur recevrait des 404 sur assets/*.
_FRONTEND_ASSETS_DIR = (Path(os.path.dirname(__file__)) / ".." / "assets").resolve()
if _FRONTEND_ASSETS_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_FRONTEND_ASSETS_DIR)), name="frontend-assets")


@app.get("/")
async def serve_frontend():
    path = os.path.join(os.path.dirname(__file__), "..", "index.html")
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
