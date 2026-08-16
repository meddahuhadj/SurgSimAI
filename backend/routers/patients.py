# -*- coding: utf-8 -*-
"""
routers/patients.py — CRUD patients + segments anatomiques (persistés + audités).

Endpoints exposés :
    GET/POST     /patients
    GET/PUT/DEL  /patients/{patient_id}
    GET/POST     /patients/{patient_id}/segments
    DELETE       /patients/{patient_id}/segments/{segment_id}
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import get_current_user, get_scoped_patient, write_audit
from schemas import (
    PatientCreate, PatientOut, PatientUpdate,
    SegmentCreate, SegmentOut,
)
from specialties import Specialty

router = APIRouter(tags=["patients"])


def _patient_out(p: models.Patient) -> PatientOut:
    return PatientOut(
        id=p.id, nom=p.nom, age=p.age, sexe=p.sexe, poids_kg=p.poids_kg, taille_cm=p.taille_cm,
        diagnostic=p.diagnostic, chirurgien=p.chirurgien, specialty=p.specialty, urgence=p.urgence,
        note=p.note, created_at=p.created_at, updated_at=p.updated_at, bsa=p.bsa_m2,
    )


@router.get("/patients", response_model=List[PatientOut])
async def list_patients(specialty: Optional[Specialty] = None,
                         current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Borné à l'institution de l'appelant — voir deps.get_scoped_patient pour
    # la même règle appliquée aux endpoints à patient unique.
    q = db.query(models.Patient).filter(models.Patient.institution_id == current.institution_id)
    if specialty:
        q = q.filter(models.Patient.specialty == specialty)
    return [_patient_out(p) for p in q.all()]


@router.get("/patients/{patient_id}", response_model=PatientOut)
async def get_patient(patient_id: str, request: Request,
                       current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = get_scoped_patient(patient_id, current, db)
    write_audit(db, request, "Consultation dossier patient", "patient", user=current, patient_id=patient_id)
    return _patient_out(p)


@router.post("/patients", response_model=PatientOut, status_code=201)
async def create_patient(p: PatientCreate, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if db.get(models.Patient, p.id):
        raise HTTPException(400, "ID patient déjà existant.")
    # institution_id n'est JAMAIS pris depuis le payload client — toujours
    # hérité du créateur (voir models.Patient), sinon un utilisateur pourrait
    # créer un patient directement dans une autre institution que la sienne.
    rec = models.Patient(**p.model_dump(), institution_id=current.institution_id)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    write_audit(db, request, "Création patient", "patient", user=current, patient_id=p.id, niveau="ok")
    return _patient_out(rec)


@router.put("/patients/{patient_id}", response_model=PatientOut)
async def update_patient(patient_id: str, p: PatientUpdate, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = get_scoped_patient(patient_id, current, db)
    updates = p.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(rec, k, v)
    db.commit()
    db.refresh(rec)
    write_audit(db, request, "Modification patient", "patient", user=current, patient_id=patient_id,
                niveau="ok", metadata={"fields": list(updates.keys())})
    return _patient_out(rec)


@router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = get_scoped_patient(patient_id, current, db)
    db.delete(rec)
    db.commit()
    write_audit(db, request, "Suppression patient", "patient", user=current, patient_id=patient_id, niveau="warn")
    return {"deleted": patient_id}


@router.get("/patients/{patient_id}/segments", response_model=List[SegmentOut])
async def list_segments(patient_id: str, current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)
    return db.query(models.Segment).filter(models.Segment.patient_id == patient_id).all()


@router.post("/patients/{patient_id}/segments", response_model=SegmentOut, status_code=201)
async def create_segment(patient_id: str, s: SegmentCreate, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)
    rec = models.Segment(patient_id=patient_id, **s.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    write_audit(db, request, f"Ajout segment ({s.type})", "segment", user=current, patient_id=patient_id)
    return rec


@router.delete("/patients/{patient_id}/segments/{segment_id}")
async def delete_segment(patient_id: str, segment_id: str, request: Request,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_scoped_patient(patient_id, current, db)
    rec = db.query(models.Segment).filter(models.Segment.id == segment_id, models.Segment.patient_id == patient_id).first()
    if not rec:
        raise HTTPException(404, "Segment introuvable.")
    db.delete(rec)
    db.commit()
    write_audit(db, request, "Suppression segment", "segment", user=current, patient_id=patient_id, niveau="warn")
    return {"deleted": segment_id}
