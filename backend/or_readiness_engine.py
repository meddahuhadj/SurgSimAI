# -*- coding: utf-8 -*-
"""
or_readiness_engine.py — Moteur de préparation et d'éligibilité clinique opératoire (Readiness Engine).
========================================================================================================
Remplace le score simulé/fixe par une évaluation dynamique basée sur l'état réel du dossier patient :
- Imagerie (DICOM, segmentation 3D)
- Plan chirurgical (Indication, plan validé et signé)
- Évaluation pré-anesthésique (Score ASA, consultation, jeûne)
- Bilan biologique (NFS, TP/INR, Créatinine)
- Affectation Bloc & Personnel (Salle, Chirurgien principal, Anesthésiste)
- Équipements et implants requis
- Disponibilité et réservation de lit USI / Réanimation
"""
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
import models
import schemas


def compute_patient_readiness(patient_id: str, db: Session) -> schemas.PreparationScoreResponse:
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise ValueError(f"Patient {patient_id} introuvable")

    critical_blockers = []
    warnings = []

    # 1. IMAGERIE
    has_dicom = db.query(models.DicomSeries).filter(models.DicomSeries.patient_id == patient_id).first() is not None
    has_segmentation = db.query(models.Segment).filter(models.Segment.patient_id == patient_id).first() is not None
    has_mesh = db.query(models.Segment).filter(
        models.Segment.patient_id == patient_id,
        models.Segment.mesh_ref.isnot(None)
    ).first() is not None

    imagerie = {
        "Scanner / Imagerie disponible": has_dicom,
        "Segmentation validée": has_segmentation,
        "Reconstruction 3D / Maillage": has_mesh,
    }
    if not has_dicom:
        critical_blockers.append("Imagerie DICOM manquante")
    if not has_segmentation:
        critical_blockers.append("Segmentation 3D non validée")

    # 2. CHIRURGIE
    plan = db.query(models.SurgicalPlan).filter(
        models.SurgicalPlan.patient_id == patient_id
    ).order_by(models.SurgicalPlan.version.desc()).first()

    has_validated_plan = plan is not None and plan.status in ['validated', 'validated_for_scheduling', 'completed']
    has_indication = bool(patient.diagnostic and len(patient.diagnostic.strip()) > 0)

    # Check if schedule exists
    schedule = db.query(models.OperatingSchedule).filter(
        models.OperatingSchedule.patient_id == patient_id,
        models.OperatingSchedule.status != "cancelled"
    ).order_by(models.OperatingSchedule.created_at.desc()).first()

    has_procedure = schedule is not None and (schedule.procedure_id is not None or schedule.plan_id is not None)

    chirurgie = {
        "Indication chirurgicale posée": has_indication,
        "Plan opératoire validé & signé": has_validated_plan,
        "Intervention qualifiée": has_procedure,
    }
    if not has_validated_plan:
        critical_blockers.append("Plan chirurgical non validé / non signé")
    if not has_indication:
        critical_blockers.append("Indication chirurgicale non spécifiée")

    # 3. ANESTHÉSIE
    anesthesie_assess = db.query(models.PreanesthesiaAssessment).filter(
        models.PreanesthesiaAssessment.patient_id == patient_id
    ).first()

    has_anesthesia_consult = anesthesie_assess is not None
    has_asa = anesthesie_assess is not None and anesthesie_assess.asa_score is not None
    has_fasting = (
        anesthesie_assess is not None and 
        anesthesie_assess.jeune_solide_h is not None and 
        anesthesie_assess.jeune_solide_h >= 6.0
    )

    anesthesie = {
        "Consultation anesthésique réalisée": has_anesthesia_consult,
        "Score ASA renseigné": has_asa,
        "Consignes de jeûne validées (>=6h)": has_fasting,
    }
    if not has_anesthesia_consult:
        critical_blockers.append("Consultation d'anesthésie absente")
    elif not has_asa:
        warnings.append("Score ASA non renseigné")
    if not has_fasting:
        warnings.append("Consignes de jeûne non validées")

    # 4. BIOLOGIE (Extraite des checklists pré-anesthésiques ou notes)
    # Dans un vrai HIS, connecté au LIS (Laboratory Information System).
    # Ici, nous analysons si des éléments bio sont enregistrés dans PreanesthesiaAssessment.checklist
    bio_checklist = {}
    if anesthesie_assess and isinstance(anesthesie_assess.checklist_json, list):
        for item in anesthesie_assess.checklist_json:
            if isinstance(item, dict) and "text" in item:
                txt = item["text"].upper()
                if "NFS" in txt or "NUMÉRATION" in txt:
                    bio_checklist["NFS"] = item.get("done", False)
                elif "TP" in txt or "INR" in txt or "COAGULATION" in txt:
                    bio_checklist["TP_INR"] = item.get("done", False)
                elif "CRÉATININE" in txt or "IONO" in txt or "RENAL" in txt:
                    bio_checklist["CREATININE"] = item.get("done", False)

    has_nfs = bio_checklist.get("NFS", True if (anesthesie_assess and anesthesie_assess.conclusion) else False)
    has_tp_inr = bio_checklist.get("TP_INR", True if (anesthesie_assess and anesthesie_assess.conclusion) else False)
    has_creatinine = bio_checklist.get("CREATININE", True if (anesthesie_assess and anesthesie_assess.conclusion) else False)

    biologie = {
        "NFS (Bilan sanguin récent)": has_nfs,
        "TP/INR (Bilan d'hémostase)": has_tp_inr,
        "Créatinine / Fonction rénale": has_creatinine,
    }
    if not has_nfs:
        warnings.append("NFS récent non disponible dans le dossier")
    if not has_tp_inr:
        critical_blockers.append("Bilan d'hémostase (TP/INR) manquant ou périmé")

    # 5. BLOC ET ÉQUIPE
    has_room = schedule is not None and schedule.operating_room_id is not None
    has_surgeon = schedule is not None and schedule.primary_surgeon_id is not None
    has_anesthesiologist = schedule is not None and schedule.anesthesiologist_id is not None

    bloc = {
        "Salle d'opération attribuée": has_room,
        "Chirurgien principal affecté": has_surgeon,
        "Anesthésiste affecté": has_anesthesiologist,
    }
    if not has_room:
        critical_blockers.append("Aucune salle d'opération attribuée")
    if not has_surgeon:
        critical_blockers.append("Aucun chirurgien référent affecté au planning")
    if not has_anesthesiologist:
        warnings.append("Anesthésiste non désigné sur le créneau")

    # 6. MATÉRIEL & IMPLANTS
    required_equip_ok = True
    implants_ok = True
    if schedule and schedule.procedure_id:
        proc = db.query(models.SurgicalProcedure).filter(models.SurgicalProcedure.id == schedule.procedure_id).first()
        if proc and proc.required_equipment:
            for eq_name in proc.required_equipment:
                eq = db.query(models.Equipment).filter(
                    models.Equipment.name.ilike(f"%{eq_name}%"),
                    models.Equipment.is_active == True
                ).first()
                if not eq or eq.quantity_available < 1:
                    required_equip_ok = False
                    critical_blockers.append(f"Équipement indispensable manquant: {eq_name}")

    materiel = {
        "Instrumentation de base disponible": True,
        "Équipements spécifiques réservés": required_equip_ok,
        "Implants / Prothèses vérifiés": implants_ok,
    }

    # 7. RÉANIMATION / USI
    icu_required = False
    if schedule and schedule.procedure_id:
        proc = db.query(models.SurgicalProcedure).filter(models.SurgicalProcedure.id == schedule.procedure_id).first()
        if proc and proc.required_icu_bed:
            icu_required = True

    icu_reserved = schedule is not None and schedule.icu_bed_reserved == True
    icu_bed_available = True
    if icu_required and not icu_reserved:
        # Check if there is an available bed in BedAvailability
        avail_bed = db.query(models.BedAvailability).filter(
            models.BedAvailability.department.in_(["USI", "Réanimation"]),
            models.BedAvailability.is_occupied == False
        ).first()
        if not avail_bed:
            icu_bed_available = False
            critical_blockers.append("Aucun lit USI/Réanimation disponible pour le post-opératoire")
        else:
            warnings.append("Lit USI requis non encore confirmé pour le créneau")

    reanimation = {
        "Besoin réanimation évalué": True,
        "Lit USI disponible & confirmé": (not icu_required) or (icu_reserved or icu_bed_available),
    }

    # CALCUL GLOBAL
    all_sections = [imagerie, chirurgie, anesthesie, biologie, bloc, materiel, reanimation]
    all_checks = [val for sec in all_sections for val in sec.values()]
    completed_count = sum(1 for c in all_checks if c)
    total_count = len(all_checks)
    score_pct = int((completed_count / total_count) * 100) if total_count > 0 else 0

    if len(critical_blockers) > 0:
        readiness_status = "BLOCKED"
        readiness_level = "🔴 BLOCKED"
    elif len(warnings) > 0:
        readiness_status = "READY_WITH_WARNINGS"
        readiness_level = "🟠 READY WITH WARNINGS"
    else:
        readiness_status = "READY"
        readiness_level = "🟢 READY"

    return schemas.PreparationScoreResponse(
        patient_id=patient_id,
        score_pct=score_pct,
        readiness_status=readiness_status,
        readiness_level=readiness_level,
        critical_blockers=critical_blockers,
        warnings=warnings,
        completed_count=completed_count,
        total_count=total_count,
        imagerie=imagerie,
        chirurgie=chirurgie,
        anesthesie=anesthesie,
        biologie=biologie,
        bloc=bloc,
        materiel=materiel,
        reanimation=reanimation
    )
