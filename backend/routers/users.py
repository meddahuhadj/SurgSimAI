# -*- coding: utf-8 -*-
"""
routers/users.py — Gestion des comptes utilisateurs (réservé au rôle admin).

Endpoints exposés :
    POST   /users        (création — remplace le seed de démo pour un pilote réel)
    GET    /users         (liste)
    PATCH  /users/{id}    (is_active / role)

Complète routers/auth.py : /auth/register reste public (auto-inscription,
toujours role="surgeon", désactivable via ALLOW_SELF_REGISTRATION) tandis que
ce router permet à un admin de créer des comptes avec un rôle explicite
(admin/surgeon/dpo) et de gérer les accès existants.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import licensing
import models
import security as sec
from db import get_db
from deps import require_role, write_audit
from schemas import UserCreateRequest, UserOut, UserUpdateRequest

router = APIRouter(tags=["users"])


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreateRequest, request: Request,
                       current: models.User = Depends(require_role("admin")),
                       db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(400, "Nom d'utilisateur déjà utilisé.")
    # Un admin qui crée un compte onboarde quelqu'un dans SA PROPRE institution
    # par défaut (cas normal : un admin d'établissement invite un collègue) —
    # jamais une nouvelle institution personnelle isolée, sinon l'admin et
    # l'utilisateur qu'il vient de créer ne verraient jamais les mêmes patients.
    lic = licensing.get_or_create_license(db, current.institution_id)
    if not licensing.has_seats_available(db, current.institution_id, lic):
        raise HTTPException(
            402,
            f"Quota de sièges atteint ({lic.max_seats}, plan '{lic.plan}') pour cette institution — "
            "mettez à niveau la licence avant de créer un nouveau compte."
        )
    user = models.User(
        username=payload.username,
        full_name=payload.full_name or payload.username,
        role=payload.role,
        hashed_password=sec.hash_password(payload.password),
        institution_id=current.institution_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    write_audit(db, request, f"Utilisateur créé ({user.username}, rôle={user.role})", "user",
                user=current, niveau="ok")
    return user


@router.get("/users", response_model=List[UserOut])
async def list_users(current: models.User = Depends(require_role("admin")),
                      db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.username).all()


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: int, payload: UserUpdateRequest, request: Request,
                       current: models.User = Depends(require_role("admin")),
                       db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable.")

    updates = payload.model_dump(exclude_unset=True)
    if user.id == current.id and updates.get("is_active") is False:
        raise HTTPException(400, "Impossible de désactiver son propre compte.")

    for key, value in updates.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    write_audit(db, request, f"Utilisateur modifié ({user.username}): {updates}", "user",
                user=current, niveau="warn")
    return user
