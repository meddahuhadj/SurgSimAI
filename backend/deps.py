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
