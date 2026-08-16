# -*- coding: utf-8 -*-
"""
deps.py — Dépendances FastAPI partagées entre main.py et tous les routers.

Extrait de main.py (découpage en routers par domaine) pour éliminer la
duplication qui existait avec pacs_router.py : ce dernier redéfinissait sa
propre copie de get_current_user/_audit avec le commentaire "dupliqués
volontairement... pour éviter tout import circulaire (main.py inclut ce
router ; ce router ne doit pas importer main.py)". Ce module n'importe
jamais main.py, donc main.py ET n'importe quel router (y compris
pacs_router.py) peuvent l'importer sans risque de cycle.
"""

from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

import models
import security as sec
from db import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


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
    import os
    if os.getenv("APP_ENV") == "production" and not getattr(user, "totp_enabled", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Double authentification (2FA/MFA) obligatoire en environnement de production HDS. Veuillez activer votre 2FA dans votre profil.",
        )
    return user


def get_scoped_patient(patient_id: str, current_user: models.User, db: Session) -> models.Patient:
    """Récupère `patient_id`, borné à l'institution de `current_user` — SEUL
    point d'accès patient qui doit être utilisé par les routers (voir
    tenancy.py pour comment un utilisateur obtient son institution_id).

    Répond 404 aussi bien pour un patient inexistant que pour un patient
    existant mais appartenant à une AUTRE institution — jamais 403, pour ne
    pas révéler par le code HTTP l'existence d'un patient chez un autre
    tenant. C'est une différence de comportement volontaire par rapport à
    l'ancien `db.get(models.Patient, patient_id)` utilisé nu dans les
    routers, qui ne vérifiait aucune frontière de tenant.

    Tous les endpoints de ce dépôt (hors backend/exploratory/, périmètre R&D
    séparé) qui acceptent un `patient_id` direct appellent cette fonction —
    patients, volumetrie, plans, anesthesie, twin, dicom, pacs_router,
    pacs_router_v2, commercial_suite, compliance, or_planning,
    voice_llm_service. Si un nouveau router accède à un patient sans passer
    par ici, c'est une régression : chaque nouvel endpoint `{patient_id}...`
    DOIT appeler `get_scoped_patient`, jamais `db.get(models.Patient, ...)`
    nu."""
    patient = db.get(models.Patient, patient_id)
    if patient is None or patient.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Patient introuvable.")
    return patient


def require_module(module: str):
    """
    Dépendance FastAPI pour restreindre un endpoint aux institutions dont la
    licence active inclut `module` (voir licensing.py pour le catalogue de
    plans/modules). Usage : `Depends(require_module("digital_twin"))`.

    403 (pas 404) : contrairement à get_scoped_patient, il n'y a rien à
    cacher ici — l'appelant sait déjà que l'endpoint existe, le message
    explique pourquoi son institution n'y a pas accès, ce qui est le
    comportement voulu pour un frein commercial (contrairement à une
    frontière de confidentialité inter-tenant)."""
    async def _check(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> models.User:
        import licensing
        lic = licensing.get_or_create_license(db, user.institution_id)
        if not licensing.has_module(lic, module):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Module '{module}' non inclus dans le plan '{lic.plan}' de votre institution "
                       f"(ou licence expirée/désactivée) — contactez un administrateur pour mettre à niveau.",
            )
        return user
    return _check


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
