# -*- coding: utf-8 -*-
"""
routers/institution.py — Consultation et gestion de la licence de sa propre institution.

Endpoints exposés :
    GET   /institution/license   (tout utilisateur authentifié — lecture seule)
    PATCH /institution/license   (rôle admin uniquement — modification)

⚠️ Ceci gère l'ENTITLEMENT (plan, sièges, modules autorisés — voir
licensing.py), pas la facturation : aucun paiement ne transite par cet
endpoint. `PATCH` est ce qu'un opérateur (vous, pas le client) appelle après
qu'un accord commercial a été conclu ailleurs — il n'y a aucune vérification
de paiement ici, volontairement, parce qu'aucune intégration de paiement
n'existe dans ce dépôt.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import licensing
import models
from db import get_db
from deps import get_current_user, require_role, write_audit
from schemas import InstitutionLicenseOut, InstitutionLicenseUpdate

router = APIRouter(prefix="/institution", tags=["institution"])


def _license_out(lic: models.InstitutionLicense) -> InstitutionLicenseOut:
    """`seats_used` est un placeholder ici (nécessite une requête `db` que ce
    helper n'a pas) — l'appelant le renseigne juste après (voir usages
    ci-dessous), toujours avant de renvoyer la réponse."""
    return InstitutionLicenseOut(
        institution_id=lic.institution_id,
        institution_name=lic.institution.name if lic.institution else "",
        plan=lic.plan,
        plan_label=licensing.PLAN_CATALOG.get(lic.plan, {}).get("label", lic.plan),
        max_seats=lic.max_seats,
        seats_used=0,
        enabled_modules=lic.enabled_modules or [],
        expires_at=lic.expires_at,
        is_active=lic.is_active,
        is_valid=licensing.is_license_valid(lic),
    )


@router.get("/license", response_model=InstitutionLicenseOut)
async def get_my_institution_license(current: models.User = Depends(get_current_user),
                                      db: Session = Depends(get_db)):
    """Licence de l'institution de l'utilisateur connecté — lecture seule,
    accessible à tout rôle (un utilisateur non-admin doit pouvoir voir
    pourquoi un module lui est refusé par require_module)."""
    lic = licensing.get_or_create_license(db, current.institution_id)
    db.commit()  # get_or_create_license peut avoir créé une licence trial (flush seul jusqu'ici)
    seats = licensing.seat_count(db, current.institution_id)
    out = _license_out(lic)
    out.seats_used = seats
    return out


@router.patch("/license", response_model=InstitutionLicenseOut)
async def update_my_institution_license(body: InstitutionLicenseUpdate, request: Request,
                                         current: models.User = Depends(require_role("admin")),
                                         db: Session = Depends(get_db)):
    """Modifie la licence de l'institution de l'admin connecté. Un admin ne
    peut modifier QUE sa propre institution (current.institution_id) — pas de
    notion de super-admin inter-institutions dans ce dépôt pour l'instant."""
    lic = licensing.get_or_create_license(db, current.institution_id)

    if body.plan is not None:
        if body.plan not in licensing.PLAN_CATALOG:
            raise HTTPException(400, f"Plan inconnu : {body.plan!r} (connus : {list(licensing.PLAN_CATALOG)}).")
        lic.plan = body.plan
        if body.reset_to_plan_defaults:
            defaults = licensing.default_license_kwargs(body.plan)
            lic.max_seats = defaults["max_seats"]
            lic.enabled_modules = defaults["enabled_modules"]

    if body.max_seats is not None:
        current_seats = licensing.seat_count(db, current.institution_id)
        if body.max_seats < current_seats:
            raise HTTPException(
                400,
                f"max_seats ({body.max_seats}) inférieur au nombre de comptes déjà actifs "
                f"({current_seats}) dans cette institution."
            )
        lic.max_seats = body.max_seats

    if body.enabled_modules is not None:
        unknown = set(body.enabled_modules) - set(licensing.ALL_MODULES)
        if unknown:
            raise HTTPException(400, f"Module(s) inconnu(s) : {sorted(unknown)} (connus : {licensing.ALL_MODULES}).")
        lic.enabled_modules = body.enabled_modules

    if body.expires_at is not None:
        lic.expires_at = body.expires_at
    if body.is_active is not None:
        lic.is_active = body.is_active

    db.commit()
    db.refresh(lic)
    write_audit(db, request, f"Licence institution modifiée (plan={lic.plan})", "institution_license",
                user=current, niveau="ok",
                metadata={"plan": lic.plan, "max_seats": lic.max_seats, "enabled_modules": lic.enabled_modules})
    out = _license_out(lic)
    out.seats_used = licensing.seat_count(db, current.institution_id)
    return out
