# -*- coding: utf-8 -*-
"""
routers/anesthesie.py — Dossier & évaluation pré-anesthésique (transverse à toutes les spécialités).

Endpoints exposés :
    GET /patients/{patient_id}/preanesthesie
    PUT /patients/{patient_id}/preanesthesie   (upsert : crée le dossier s'il n'existe pas encore)
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models
from clinical_scores import (
    compute_bilan_net, compute_glasgow, compute_news2, compute_sofa,
    news2_escalation, sepsis_organ_dysfunction,
)
from db import get_db
from deps import get_current_user, get_scoped_patient, write_audit
from schemas import (
    PreanesthesiaAssessmentIn, PreanesthesiaAssessmentOut,
    IcuFollowUpIn, IcuFollowUpOut,
)

router = APIRouter(tags=["anesthesie"])


def _assessment_out(rec: models.PreanesthesiaAssessment) -> PreanesthesiaAssessmentOut:
    return PreanesthesiaAssessmentOut(
        id=rec.id, patient_id=rec.patient_id,
        asa_score=rec.asa_score, asa_urgence=bool(rec.asa_urgence),
        mallampati_score=rec.mallampati_score,
        antecedents=rec.antecedents, allergies=rec.allergies,
        traitement_chronique=rec.traitement_chronique,
        jeune_solide_h=rec.jeune_solide_h, jeune_liquide_h=rec.jeune_liquide_h,
        intubation_difficile_prevue=bool(rec.intubation_difficile_prevue),
        intubation_difficile_notes=rec.intubation_difficile_notes,
        checklist=rec.checklist_json or [],
        anesthesiste=rec.anesthesiste, conclusion=rec.conclusion,
        created_at=rec.created_at, updated_at=rec.updated_at,
    )


@router.get("/patients/{patient_id}/preanesthesie", response_model=PreanesthesiaAssessmentOut)
async def get_preanesthesie(patient_id: str,
                             current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)
    rec = db.query(models.PreanesthesiaAssessment).filter(
        models.PreanesthesiaAssessment.patient_id == patient_id
    ).first()
    if not rec:
        raise HTTPException(404, "Aucun dossier pré-anesthésique pour ce patient.")
    return _assessment_out(rec)


@router.put("/patients/{patient_id}/preanesthesie", response_model=PreanesthesiaAssessmentOut)
async def upsert_preanesthesie(patient_id: str, body: PreanesthesiaAssessmentIn, request: Request,
                                current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)

    rec = db.query(models.PreanesthesiaAssessment).filter(
        models.PreanesthesiaAssessment.patient_id == patient_id
    ).first()
    created = rec is None
    if created:
        rec = models.PreanesthesiaAssessment(patient_id=patient_id)
        db.add(rec)

    updates = body.model_dump(exclude_unset=True)
    if "checklist" in updates:
        checklist = updates.pop("checklist")
        rec.checklist_json = checklist
    for k, v in updates.items():
        setattr(rec, k, v)
    rec.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rec)
    write_audit(db, request,
                "Création dossier pré-anesthésique" if created else "Modification dossier pré-anesthésique",
                "preanesthesia_assessment", user=current, patient_id=patient_id,
                niveau="ok", metadata={"fields": list(updates.keys())})
    return _assessment_out(rec)


# ---------------------------------------------------------------------------
# Suivi réanimation / USI
# ---------------------------------------------------------------------------

def _followup_out(rec: models.IcuFollowUp) -> IcuFollowUpOut:
    return IcuFollowUpOut(
        id=rec.id, patient_id=rec.patient_id, recorded_at=rec.recorded_at,
        sofa_respiration=rec.sofa_respiration, sofa_coagulation=rec.sofa_coagulation,
        sofa_hepatique=rec.sofa_hepatique, sofa_cardiovasculaire=rec.sofa_cardiovasculaire,
        sofa_neurologique=rec.sofa_neurologique, sofa_renal=rec.sofa_renal, sofa_total=rec.sofa_total,
        apache2_score=rec.apache2_score,
        glasgow_oculaire=rec.glasgow_oculaire, glasgow_verbale=rec.glasgow_verbale,
        glasgow_motrice=rec.glasgow_motrice, glasgow_total=rec.glasgow_total,
        rass_score=rec.rass_score,
        vent_mode=rec.vent_mode, vent_fio2_pct=rec.vent_fio2_pct, vent_peep_cmh2o=rec.vent_peep_cmh2o,
        vent_vt_ml=rec.vent_vt_ml, vent_fr_rpm=rec.vent_fr_rpm,
        bilan_entrees_ml=rec.bilan_entrees_ml, bilan_sorties_ml=rec.bilan_sorties_ml, bilan_net_ml=rec.bilan_net_ml,
        resp_rate_rpm=rec.resp_rate_rpm, spo2_pct=rec.spo2_pct,
        supplemental_o2=bool(rec.supplemental_o2), systolic_bp_mmhg=rec.systolic_bp_mmhg,
        heart_rate_bpm=rec.heart_rate_bpm, temperature_c=rec.temperature_c, avpu=rec.avpu,
        news2_total=rec.news2_total, sepsis_alert=bool(rec.sepsis_alert), plan_id=rec.plan_id,
        notes=rec.notes, auteur=rec.auteur, created_at=rec.created_at,
    )


@router.get("/patients/{patient_id}/icu-followups", response_model=List[IcuFollowUpOut])
async def list_icu_followups(patient_id: str,
                              current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)
    recs = db.query(models.IcuFollowUp).filter(
        models.IcuFollowUp.patient_id == patient_id
    ).order_by(models.IcuFollowUp.recorded_at.desc()).all()
    return [_followup_out(r) for r in recs]


@router.post("/patients/{patient_id}/icu-followups", response_model=IcuFollowUpOut, status_code=201)
async def create_icu_followup(patient_id: str, body: IcuFollowUpIn, request: Request,
                               current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)

    data = body.model_dump(exclude_unset=True)
    plan_id = data.pop("plan_id", None)
    if plan_id is not None:
        plan = db.get(models.SurgicalPlan, plan_id)
        if not plan or plan.patient_id != patient_id:
            raise HTTPException(404, "Plan chirurgical introuvable pour ce patient.")
        if plan.status != "validated":
            raise HTTPException(409, "Le suivi réanimation ne peut référencer qu'un plan chirurgical validé.")

    rec = models.IcuFollowUp(patient_id=patient_id, plan_id=plan_id)
    for k, v in data.items():
        setattr(rec, k, v)
    if rec.recorded_at is None:
        rec.recorded_at = datetime.utcnow()

    # Totaux et alertes calculés côté serveur (source de vérité, ne dépendent pas du client) :
    rec.sofa_total = compute_sofa(
        rec.sofa_respiration, rec.sofa_coagulation, rec.sofa_hepatique,
        rec.sofa_cardiovasculaire, rec.sofa_neurologique, rec.sofa_renal,
    )
    rec.glasgow_total = compute_glasgow(rec.glasgow_oculaire, rec.glasgow_verbale, rec.glasgow_motrice)
    rec.bilan_net_ml = compute_bilan_net(rec.bilan_entrees_ml, rec.bilan_sorties_ml)
    rec.news2_total = compute_news2(
        resp_rate_rpm=rec.resp_rate_rpm, spo2_pct=rec.spo2_pct,
        supplemental_o2=rec.supplemental_o2, systolic_bp_mmhg=rec.systolic_bp_mmhg,
        heart_rate_bpm=rec.heart_rate_bpm, temperature_c=rec.temperature_c, avpu=rec.avpu,
    )
    rec.sepsis_alert = sepsis_organ_dysfunction(rec.sofa_total)

    db.add(rec)
    db.commit()
    db.refresh(rec)
    write_audit(db, request, "Ajout suivi réanimation/USI", "icu_followup", user=current,
                patient_id=patient_id, niveau="ok",
                metadata={
                    "sofa_total": rec.sofa_total, "glasgow_total": rec.glasgow_total,
                    "news2_total": rec.news2_total,
                    "escalation": news2_escalation(rec.news2_total)["level"],
                    "sepsis_alert": rec.sepsis_alert, "plan_id": plan_id,
                })
    return _followup_out(rec)


@router.delete("/patients/{patient_id}/icu-followups/{followup_id}")
async def delete_icu_followup(patient_id: str, followup_id: str, request: Request,
                               current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.query(models.IcuFollowUp).filter(
        models.IcuFollowUp.id == followup_id, models.IcuFollowUp.patient_id == patient_id
    ).first()
    if not rec:
        raise HTTPException(404, "Évaluation introuvable.")
    db.delete(rec)
    db.commit()
    write_audit(db, request, "Suppression suivi réanimation/USI", "icu_followup", user=current,
                patient_id=patient_id, niveau="warn")
    return {"deleted": followup_id}
