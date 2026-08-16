# -*- coding: utf-8 -*-
"""
routers/plans.py — Cycle de planification réelle : plans chirurgicaux versionnés.

Contrairement au prototype (plan volatil, perdu au rafraîchissement), un plan
chirurgical est ici un objet persistant, versionné par patient, qui suit un
cycle de validation : draft → reviewed → validated (signé) | rejected.

Endpoints exposés :
    GET    /patients/{patient_id}/plans                      liste (versions desc)
    POST   /patients/{patient_id}/plans                      créer une version (auto v+1)
    GET    /patients/{patient_id}/plans/{plan_id}            consulter
    PUT    /patients/{patient_id}/plans/{plan_id}            mettre à jour (draft uniquement, auteur)
    POST   /patients/{patient_id}/plans/{plan_id}/review     passer en "reviewed"
    POST   /patients/{patient_id}/plans/{plan_id}/validate   valider + signer (workflow staff)
    POST   /patients/{patient_id}/plans/{plan_id}/reject     rejeter (draft/reviewed) avec motif

Chaque action sensible est tracée dans audit_log (qui, quand, quoi, sur quel patient).
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import get_current_user, get_scoped_patient, write_audit
from schemas import (
    SurgicalPlanIn, SurgicalPlanOut, SurgicalPlanRejectIn,
    SurgicalPlanReviewIn, SurgicalPlanUpdate, SurgicalPlanValidateIn,
)

router = APIRouter(tags=["plans"])

# Statuts autorisés du cycle de plan
DRAFT = "draft"
REVIEWED = "reviewed"
VALIDATED = "validated"
REJECTED = "rejected"
_EDITABLE = {DRAFT}
_MUTABLE = {DRAFT, REVIEWED}


def _get_plan(db: Session, patient_id: str, plan_id: str, current: models.User) -> models.SurgicalPlan:
    # get_scoped_patient lève 404 si le patient n'appartient pas à l'institution
    # de `current` — appelé AVANT de chercher le plan, pour qu'un plan_id connu
    # d'un autre tenant ne fuite jamais, même indirectement.
    get_scoped_patient(patient_id, current, db)
    plan = db.get(models.SurgicalPlan, plan_id)
    if not plan or plan.patient_id != patient_id:
        raise HTTPException(404, "Plan introuvable pour ce patient.")
    return plan


def _next_version(db: Session, patient_id: str) -> int:
    last = (db.query(models.SurgicalPlan)
            .filter(models.SurgicalPlan.patient_id == patient_id)
            .order_by(models.SurgicalPlan.version.desc())
            .first())
    return (last.version + 1) if last else 1


@router.get("/patients/{patient_id}/plans", response_model=List[SurgicalPlanOut])
async def list_plans(patient_id: str,
                     current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)
    return (db.query(models.SurgicalPlan)
            .filter(models.SurgicalPlan.patient_id == patient_id)
            .order_by(models.SurgicalPlan.version.desc())
            .all())


@router.post("/patients/{patient_id}/plans", response_model=SurgicalPlanOut, status_code=201)
async def create_plan(patient_id: str, body: SurgicalPlanIn, request: Request,
                      current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)

    # Attribution du numéro de version = SELECT puis INSERT avec UNIQUE(patient_id,
    # version) : deux chirurgiens créant un plan en parallèle (vrai flux multi-utilisateur)
    # peuvent calculer le MÊME numéro. Sans retry, l'un des INSERT échoue en
    # IntegrityError → 500 alors que l'opération est légitime. On rejoue donc la
    # transaction (recalculant le version) un petit nombre de fois : c'est un
    # conflit d'incrément, pas une erreur de données.
    plan = None
    for _attempt in range(5):
        plan = models.SurgicalPlan(
            patient_id=patient_id,
            version=_next_version(db, patient_id),
            status=DRAFT,
            procedure=body.procedure,
            snapshot_json=body.snapshot or {},
            source_series_id=body.source_series_id,
            notes=body.notes,
            author_id=current.id,
            author_name=current.full_name or current.username,
        )
        db.add(plan)
        try:
            db.commit()
            break
        except IntegrityError:
            db.rollback()
            plan = None
    if plan is None:
        raise HTTPException(409, "Conflit de numérotation de version entre créations simultanées — réessayez.")

    db.refresh(plan)
    write_audit(db, request, "Création plan chirurgical", "surgical_plan", user=current,
                patient_id=patient_id, niveau="ok",
                metadata={"plan_id": plan.id, "version": plan.version, "status": plan.status})
    return plan


@router.get("/patients/{patient_id}/plans/{plan_id}", response_model=SurgicalPlanOut)
async def get_plan(patient_id: str, plan_id: str,
                   current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_plan(db, patient_id, plan_id, current)


@router.put("/patients/{patient_id}/plans/{plan_id}", response_model=SurgicalPlanOut)
async def update_plan(patient_id: str, plan_id: str, body: SurgicalPlanUpdate, request: Request,
                      current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Modifie un plan tant qu'il est en brouillon, et uniquement par son auteur.
    Un plan relu, validé ou rejeté est figé : on en crée une nouvelle version."""
    plan = _get_plan(db, patient_id, plan_id, current)
    if plan.status not in _EDITABLE:
        raise HTTPException(409, f"Plan en statut '{plan.status}' — figé. Créez une nouvelle version.")
    if plan.author_id is not None and plan.author_id != current.id:
        raise HTTPException(403, "Seul l'auteur du plan peut le modifier.")

    if body.expected_version is not None and plan.version != body.expected_version:
        raise HTTPException(409, f"Conflit de modification concourante : la version en base ({plan.version}) diffère de la version attendue ({body.expected_version}).")

    updates = body.model_dump(exclude_unset=True)
    updates.pop("expected_version", None)
    if "snapshot" in updates:
        plan.snapshot_json = updates.pop("snapshot") or {}
    for k, v in updates.items():
        if v is not None:
            setattr(plan, k, v)
    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    write_audit(db, request, "Modification plan chirurgical", "surgical_plan", user=current,
                patient_id=patient_id, niveau="ok",
                metadata={"plan_id": plan.id, "version": plan.version})
    return plan


@router.post("/patients/{patient_id}/plans/{plan_id}/review", response_model=SurgicalPlanOut)
async def review_plan(patient_id: str, plan_id: str, body: SurgicalPlanReviewIn, request: Request,
                      current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Passe le plan de 'draft' à 'reviewed' (relecture par le staff) — étape
    intermédiaire avant la signature finale."""
    plan = _get_plan(db, patient_id, plan_id, current)
    if plan.status not in _EDITABLE:
        raise HTTPException(409, f"Plan en statut '{plan.status}' — non modifiable.")
    plan.status = REVIEWED
    plan.reviewed_by = current.full_name or current.username
    plan.reviewed_at = datetime.utcnow()
    if body.comment:
        plan.comment = body.comment
    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    write_audit(db, request, "Relecture plan chirurgical", "surgical_plan", user=current,
                patient_id=patient_id, niveau="ok",
                metadata={"plan_id": plan.id, "version": plan.version, "status": plan.status})
    return plan


@router.post("/patients/{patient_id}/plans/{plan_id}/validate", response_model=SurgicalPlanOut)
async def validate_plan(patient_id: str, plan_id: str, body: SurgicalPlanValidateIn, request: Request,
                        current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Valide et signe le plan : engagement du chirurgien. Un plan validé est
    figé définitivement (source de vérité pour le bloc)."""
    plan = _get_plan(db, patient_id, plan_id, current)
    if plan.status not in _MUTABLE:
        raise HTTPException(409, f"Plan en statut '{plan.status}' — non validable.")
    if plan.status == VALIDATED:
        raise HTTPException(409, "Plan déjà validé.")

    plan.status = VALIDATED
    plan.signed_by = current.full_name or current.username
    plan.signed_at = datetime.utcnow()
    if body.comment:
        plan.comment = body.comment
    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    write_audit(db, request, "Validation plan chirurgical", "surgical_plan", user=current,
                patient_id=patient_id, niveau="ok",
                metadata={"plan_id": plan.id, "version": plan.version, "signed_by": plan.signed_by})
    return plan


@router.post("/patients/{patient_id}/plans/{plan_id}/reject", response_model=SurgicalPlanOut)
async def reject_plan(patient_id: str, plan_id: str, body: SurgicalPlanRejectIn, request: Request,
                      current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Refuse le plan (draft ou reviewed) avec un motif obligatoire. Le plan
    reste consultable (traçabilité), mais une nouvelle version est requise."""
    plan = _get_plan(db, patient_id, plan_id, current)
    if plan.status not in _MUTABLE:
        raise HTTPException(409, f"Plan en statut '{plan.status}' — non rejetable.")
    if not body.comment or not body.comment.strip():
        raise HTTPException(400, "Un motif de rejet est obligatoire.")

    plan.status = REJECTED
    plan.comment = body.comment
    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    write_audit(db, request, "Rejet plan chirurgical", "surgical_plan", user=current,
                patient_id=patient_id, niveau="warn",
                metadata={"plan_id": plan.id, "version": plan.version, "comment": body.comment[:200]})
    return plan


@router.get("/patients/{patient_id}/plans/{plan_id}/export/fhir")
async def export_plan_fhir(patient_id: str, plan_id: str, request: Request,
                            current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Exporte le plan chirurgical persistant sous forme d'un Bundle FHIR R4 (CarePlan + Procedure)."""
    plan = _get_plan(db, patient_id, plan_id, current)
    pat = db.get(models.Patient, patient_id)

    bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [
            {
                "resource": {
                    "resourceType": "CarePlan",
                    "id": f"careplan-{plan.id}",
                    "status": "active" if plan.status == VALIDATED else "draft",
                    "intent": "plan",
                    "subject": {"reference": f"Patient/{pat.id}", "display": f"{pat.nom}"},
                    "period": {"start": plan.created_at.isoformat()},
                    "author": {"display": plan.author_name},
                    "note": [{"text": plan.notes or "Planification opératoire"}]
                }
            },
            {
                "resource": {
                    "resourceType": "Procedure",
                    "id": f"procedure-{plan.id}",
                    "status": "completed" if plan.status == VALIDATED else "preparation",
                    "code": {"text": plan.procedure},
                    "subject": {"reference": f"Patient/{pat.id}"},
                    "performer": [{"actor": {"display": plan.signed_by or plan.author_name}}],
                    "outcome": {"text": f"Statut plan: {plan.status}"}
                }
            }
        ]
    }
    write_audit(db, request, "Export FHIR CarePlan/Procedure", "surgical_plan", user=current, patient_id=patient_id)
    return bundle
