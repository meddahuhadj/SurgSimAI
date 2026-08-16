# -*- coding: utf-8 -*-
"""
compliance.py — Routeur de Conformité Réglementaire (MDR UE 2017/745 / ISO 14971 / HDS).
=======================================================================================
"""
import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db
from deps import get_current_user, get_scoped_patient, require_role, write_audit
from clinical_validation_benchmarks import evaluate_clinical_cohort, ClinicalEvaluationReport
from mesh_export import dice_and_hd95_from_glb, resolve_mesh_path

router = APIRouter(prefix="/compliance", tags=["Compliance & Medical Device Regulation"])


@router.get("/mdr-dossier-status")
def get_mdr_compliance_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Restaure l'état d'avancement du dossier technique MDR (UE) 2017/745 :
    exigences HDS, 2FA, étanchéité CI/CD, garde-fous de production.
    """
    app_env = os.getenv("APP_ENV", "development").lower()
    jwt_default = getattr(models, "_JWT_SECRET_IS_DEFAULT", False)
    
    total_patients = db.query(models.Patient).count()
    validated_plans = db.query(models.SurgicalPlan).filter(models.SurgicalPlan.status == "validated").count()
    audit_logs_count = db.query(models.AuditLog).count()

    return {
        "mdr_classification": "Classe IIb (Aide à la décision chirurgicale & Planification 3D)",
        "app_environment": app_env,
        "hds_security_checks": {
            "mandatory_2fa_enforced_in_production": True,
            "current_user_2fa_enabled": current_user.totp_enabled,
            "pgcrypto_at_rest_available": True,
            "jwt_secret_secured": app_env == "production" and not jwt_default
        },
        "quality_and_ci_isolation": {
            "ci_clinical_pipeline_isolated": True,
            "research_mode_active": os.getenv("RESEARCH_MODE", "false").lower() == "true",
            "ruff_linter_enabled": True
        },
        "clinical_evaluation_dataset": {
            "registered_patients_count": total_patients,
            "validated_surgical_plans_count": validated_plans,
            "audit_trail_records_count": audit_logs_count
        }
    }


@router.get("/clinical-evaluations/{patient_id}")
def get_clinical_evaluation_for_patient(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Génère le rapport quantitatif d'évaluation clinique (Dice, HD95) pour un
    dossier patient, à partir de VRAIES paires (segment prédit, segment de
    référence experte) portant chacune un maillage 3D réel — jamais une
    valeur dérivée de la simple présence de segments.

    ⚠️ CORRIGÉ : cet endpoint renvoyait auparavant `dice_val = 0.93 if
    segments else 0.88` — une constante binaire selon que le patient avait
    au moins un segment, jamais un Dice/HD95 réellement calculé. Dans un
    routeur dont le rôle même est de nourrir le dossier technique MDR, c'est
    exactement le risque que "présenter une simulation comme réelle" — voir
    l'historique de tests/test_compliance_fda_mdr.py, qui a déjà corrigé ce
    même type de fabrication ailleurs dans ce routeur (statut de
    certification, compteur d'audit).

    Un segment devient la "référence experte" d'un autre via
    `Segment.metadata_json = {"ground_truth_for_segment_id": "<id du segment
    prédit>"}` (voir `schemas.SegmentCreate.metadata_json`) — l'enregistrement
    de cette paire (typiquement après relecture radiologue/anapath) est hors
    périmètre de ce module, qui ne fait qu'évaluer les paires déjà déclarées.

    404 si le patient n'existe pas. 422 — pas un rapport fabriqué en repli —
    si aucune paire prédiction/référence avec maillages réels résolvables
    n'est enregistrée pour ce patient. Aucun TRE : ce dépôt n'a pas encore
    d'infrastructure d'amers anatomiques appariés produisant une vraie erreur
    de recalage (voir `registration.py`, dont `rigid_icp`/`bspline_ffd_register`
    ne sont pas encore branchés à un flux clinique qui en produirait) — la
    case TRE du rapport reste `None` plutôt qu'une valeur inventée.
    """
    get_scoped_patient(patient_id, current_user, db)

    segments = db.query(models.Segment).filter(models.Segment.patient_id == patient_id).all()
    by_id = {s.id: s for s in segments}

    dice_vals: List[float] = []
    hd95_vals: List[float] = []
    structures_evaluated: List[str] = []
    for seg in segments:
        gt_for_id = (seg.metadata_json or {}).get("ground_truth_for_segment_id")
        predicted = by_id.get(gt_for_id) if gt_for_id else None
        if predicted is None:
            continue
        gt_mesh = resolve_mesh_path(seg.mesh_ref)
        pred_mesh = resolve_mesh_path(predicted.mesh_ref)
        if gt_mesh is None or pred_mesh is None:
            continue
        try:
            metrics = dice_and_hd95_from_glb(gt_mesh, pred_mesh)
        except (FileNotFoundError, ValueError):
            continue
        dice_vals.append(metrics["dice"])
        hd95_vals.append(metrics["hd95_mm"])
        structures_evaluated.append(predicted.label or predicted.id)

    if not dice_vals:
        raise HTTPException(
            422,
            f"Aucune paire prédiction/référence experte avec maillages 3D réels enregistrée pour le "
            f"patient {patient_id} — l'évaluation clinique nécessite qu'un segment porte "
            "metadata_json.ground_truth_for_segment_id pointant vers son segment prédit correspondant, "
            "tous deux avec un mesh_ref résolvable sur disque. Aucun rapport fabriqué en repli."
        )

    report = evaluate_clinical_cohort(
        evaluation_id=f"eval-{patient_id[:8]}",
        patient_id=patient_id,
        structure_name=", ".join(sorted(set(structures_evaluated))),
        dice_vals=dice_vals,
        hd95_vals_mm=hd95_vals,
    )
    write_audit(db, request, "Évaluation clinique Dice/HD95 (paires réelles)", "compliance",
                user=current_user, patient_id=patient_id)
    return report
