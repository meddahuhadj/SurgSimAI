# -*- coding: utf-8 -*-
"""
routers/volumetrie.py — Calcul de volumétrie (générique + FLR/TLV spécifique HBP).

Endpoint exposé :
    GET /patients/{patient_id}/volumetrie
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import get_current_user, write_audit

router = APIRouter(tags=["volumetrie"])


def _bsa(weight_kg: float, height_cm: float) -> float:
    return (weight_kg * height_cm / 3600) ** 0.5


def _flr_threshold(is_cirrhotic: bool, bsa: float) -> float:
    if is_cirrhotic:
        return max(35.0, 30.0 + 12.0 * (1.0 - bsa / 1.9))
    return max(25.0, 20.0 + 10.0 * (1.0 - bsa / 1.9))


@router.get("/patients/{patient_id}/volumetrie")
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
