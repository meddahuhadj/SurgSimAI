# -*- coding: utf-8 -*-
"""
routers/twin.py — Propriétés biomécaniques du jumeau numérique (TwinBiomech).

Première brique exposée de la feuille de route "Jumeau numérique réel"
(hyperélasticité Mooney-Rivlin — voir README, ARCHITECTURE_CAHIER_DES_CHARGES.md
§2.2.1/§3.3). Ne calcule aucune déformation : gère seulement les PARAMÈTRES
matériau par tissu pour un patient, avec un défaut issu de la littérature
(`twin_biomech_atlas.py`) tant qu'aucune valeur réelle (élastographie ou
saisie clinicienne) n'a été enregistrée.

Endpoints exposés :
    GET    /patients/{patient_id}/twin/biomech                  liste effective (stocké ou défaut d'atlas)
    PUT    /patients/{patient_id}/twin/biomech/{tissue_type}     enregistre/écrase une valeur réelle
    DELETE /patients/{patient_id}/twin/biomech/{tissue_type}     revient au défaut d'atlas
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import get_current_user, write_audit
from schemas import TwinBiomechIn, TwinBiomechOut
from twin_biomech_atlas import LITERATURE_ATLAS, get_default_biomech

router = APIRouter(tags=["twin"])


def _stored_out(rec: models.TwinBiomech) -> TwinBiomechOut:
    return TwinBiomechOut(
        id=rec.id, patient_id=rec.patient_id, tissue_type=rec.tissue_type,
        model=rec.model, parameters=rec.parameters_json or {}, source=rec.source,
        validation_dataset_ref=rec.validation_dataset_ref, note=None,
        created_at=rec.created_at, updated_at=rec.updated_at,
    )


def _atlas_out(patient_id: str, tissue_type: str) -> TwinBiomechOut:
    entry = get_default_biomech(tissue_type)
    return TwinBiomechOut(
        id=None, patient_id=patient_id, tissue_type=tissue_type,
        model=entry["model"], parameters=entry["parameters"], source="literature_atlas",
        validation_dataset_ref=None, note=entry["note"],
    )


@router.get("/patients/{patient_id}/twin/biomech", response_model=List[TwinBiomechOut])
async def list_twin_biomech(patient_id: str,
                             current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Valeurs EFFECTIVES (stockées si présentes, sinon défaut d'atlas) pour
    chaque type de tissu connu de l'atlas — pas seulement ce qui est en base,
    pour que le frontend ait toujours une valeur exploitable à afficher."""
    if not db.get(models.Patient, patient_id):
        raise HTTPException(404, "Patient introuvable.")

    stored = {
        r.tissue_type: r for r in db.query(models.TwinBiomech).filter(
            models.TwinBiomech.patient_id == patient_id
        ).all()
    }
    return [
        _stored_out(stored[tissue_type]) if tissue_type in stored else _atlas_out(patient_id, tissue_type)
        for tissue_type in LITERATURE_ATLAS
    ]


@router.put("/patients/{patient_id}/twin/biomech/{tissue_type}", response_model=TwinBiomechOut)
async def upsert_twin_biomech(patient_id: str, tissue_type: str, body: TwinBiomechIn, request: Request,
                               current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enregistre une valeur réelle (élastographie ou ajustement clinicien),
    qui remplace le défaut d'atlas pour ce tissu tant qu'elle n'est pas supprimée."""
    if not db.get(models.Patient, patient_id):
        raise HTTPException(404, "Patient introuvable.")

    rec = db.query(models.TwinBiomech).filter(
        models.TwinBiomech.patient_id == patient_id, models.TwinBiomech.tissue_type == tissue_type
    ).first()
    created = rec is None
    if created:
        rec = models.TwinBiomech(patient_id=patient_id, tissue_type=tissue_type)
        db.add(rec)

    rec.model = body.model
    rec.parameters_json = body.parameters
    rec.source = body.source
    rec.validation_dataset_ref = body.validation_dataset_ref
    rec.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rec)
    write_audit(db, request,
                "Création valeur biomécanique jumeau" if created else "Modification valeur biomécanique jumeau",
                "twin_biomech", user=current, patient_id=patient_id, niveau="ok",
                metadata={"tissue_type": tissue_type, "model": body.model, "source": body.source})
    return _stored_out(rec)


@router.delete("/patients/{patient_id}/twin/biomech/{tissue_type}", response_model=TwinBiomechOut)
async def reset_twin_biomech(patient_id: str, tissue_type: str, request: Request,
                              current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Supprime la valeur enregistrée pour ce tissu — le patient revient au
    défaut d'atlas (pas une erreur si rien n'était enregistré : idempotent)."""
    if not db.get(models.Patient, patient_id):
        raise HTTPException(404, "Patient introuvable.")

    rec = db.query(models.TwinBiomech).filter(
        models.TwinBiomech.patient_id == patient_id, models.TwinBiomech.tissue_type == tissue_type
    ).first()
    if rec:
        db.delete(rec)
        db.commit()
        write_audit(db, request, "Réinitialisation valeur biomécanique jumeau (retour à l'atlas)",
                    "twin_biomech", user=current, patient_id=patient_id, niveau="info",
                    metadata={"tissue_type": tissue_type})
    return _atlas_out(patient_id, tissue_type)
