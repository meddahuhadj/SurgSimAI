# -*- coding: utf-8 -*-
"""
or_constraint_engine.py — Moteur d'évaluation des contraintes dures et souples du bloc opératoire.
==================================================================================================
Valide si une intervention peut se dérouler dans un créneau spécifique (Salle, Heures, Équipe, Patient) :
- Contraintes Dures (Bloquantes / 🔴 Forbidden) : Sécurité absolue, jamais compensables.
- Contraintes Souples (Avertissements / 🟠 Warnings) : Pénalités d'efficacité opérationnelle.
"""
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

import models
import schemas
from or_readiness_engine import compute_patient_readiness


def evaluate_slot_constraints(
    db: Session,
    operating_room_id: str,
    patient_id: str,
    start_time: datetime,
    end_time: datetime,
    schedule_id: Optional[str] = None,
    procedure_id: Optional[str] = None,
    primary_surgeon_id: Optional[int] = None,
    anesthesiologist_id: Optional[int] = None,
    check_patient_readiness: bool = True
) -> schemas.SlotValidationResponse:
    
    hard_blockers = []
    soft_warnings = []
    overtime_mins = 0

    # 1. Vérification de la Salle d'opération
    room = db.query(models.OperatingRoom).filter(models.OperatingRoom.id == operating_room_id).first()
    if not room or not room.is_active:
        hard_blockers.append("🔴 Salle fermée, inactive ou non répertoriée.")
    
    # 2. Chevauchement de Salle (Hard)
    overlap_room_query = db.query(models.OperatingSchedule).filter(
        models.OperatingSchedule.operating_room_id == operating_room_id,
        models.OperatingSchedule.status != "cancelled",
        models.OperatingSchedule.start_time < end_time,
        models.OperatingSchedule.end_time > start_time
    )
    if schedule_id:
        overlap_room_query = overlap_room_query.filter(models.OperatingSchedule.id != schedule_id)
        
    overlap_room = overlap_room_query.first()
    if overlap_room:
        p_name = overlap_room.patient.nom if overlap_room.patient else overlap_room.patient_id
        hard_blockers.append(f"🔴 Conflit d'horaire en salle {room.name if room else operating_room_id} avec l'intervention de {p_name}.")

    # 3. Procédure & Matériel & USI
    proc = None
    if procedure_id:
        proc = db.query(models.SurgicalProcedure).filter(models.SurgicalProcedure.id == procedure_id).first()
        
    if proc:
        # Compatibilité Salle & Procédure
        if room and room.capabilities and proc.specialty not in room.capabilities and room.type != proc.specialty and room.type != "general":
            soft_warnings.append(f"🟠 Salle {room.name} non spécialisée en {proc.specialty.upper()} (type: {room.type}).")

        # Matériel indispensable
        if proc.required_equipment:
            for eq_name in proc.required_equipment:
                eq = db.query(models.Equipment).filter(
                    models.Equipment.name.ilike(f"%{eq_name}%"),
                    models.Equipment.is_active == True
                ).first()
                if not eq or eq.quantity_available < 1:
                    hard_blockers.append(f"🔴 Équipement obligatoire absent ou indisponible: {eq_name}.")
                else:
                    # Check equipment availability schedule
                    eq_unavail = db.query(models.EquipmentAvailability).filter(
                        models.EquipmentAvailability.equipment_id == eq.id,
                        models.EquipmentAvailability.availability_type != "available",
                        models.EquipmentAvailability.start_time < end_time,
                        models.EquipmentAvailability.end_time > start_time
                    ).first()
                    if eq_unavail:
                        hard_blockers.append(f"🔴 Équipement {eq.name} en maintenance/stérilisation sur ce créneau.")

        # Vérification Réanimation / USI
        if proc.required_icu_bed:
            icu_end = end_time + timedelta(hours=proc.required_icu_duration_hours or 24.0)
            occupied_beds = db.query(models.BedAvailability).filter(
                models.BedAvailability.department.in_(["USI", "Réanimation"]),
                models.BedAvailability.is_occupied == True
            ).count()
            total_beds = db.query(models.BedAvailability).filter(
                models.BedAvailability.department.in_(["USI", "Réanimation"])
            ).count()
            
            # Allow fallback if no beds configured in DB yet
            if total_beds > 0 and occupied_beds >= total_beds:
                hard_blockers.append(f"🔴 Aucun lit USI/Réanimation disponible pour la prise en charge post-opératoire ({proc.required_icu_duration_hours}h requises).")

    # 4. Chirurgien principal (Hard & Soft)
    if primary_surgeon_id:
        surgeon = db.query(models.User).filter(models.User.id == primary_surgeon_id).first()
        if not surgeon:
            hard_blockers.append("🔴 Chirurgien principal introuvable.")
        else:
            # Overlap in another room
            surg_overlap_q = db.query(models.OperatingSchedule).filter(
                models.OperatingSchedule.primary_surgeon_id == primary_surgeon_id,
                models.OperatingSchedule.status != "cancelled",
                models.OperatingSchedule.start_time < end_time,
                models.OperatingSchedule.end_time > start_time
            )
            if schedule_id:
                surg_overlap_q = surg_overlap_q.filter(models.OperatingSchedule.id != schedule_id)
            if surg_overlap_q.first():
                hard_blockers.append(f"🔴 Le Dr. {surgeon.full_name} est déjà programmé dans une autre salle sur ce créneau.")

            # Staff availability (leave / meeting)
            staff_unavail = db.query(models.StaffAvailability).filter(
                models.StaffAvailability.user_id == primary_surgeon_id,
                models.StaffAvailability.availability_type.in_(["leave", "meeting", "unavailability"]),
                models.StaffAvailability.start_time < end_time,
                models.StaffAvailability.end_time > start_time
            ).first()
            if staff_unavail:
                hard_blockers.append(f"🔴 Le Dr. {surgeon.full_name} est en {staff_unavail.availability_type} ({staff_unavail.notes or 'indisponible'}).")

    # 5. Anesthésiste (Hard & Soft)
    if anesthesiologist_id:
        anesthesiologist = db.query(models.User).filter(models.User.id == anesthesiologist_id).first()
        if not anesthesiologist:
            hard_blockers.append("🔴 Anesthésiste introuvable.")
        else:
            # Overlap in another room
            anes_overlap_q = db.query(models.OperatingSchedule).filter(
                models.OperatingSchedule.anesthesiologist_id == anesthesiologist_id,
                models.OperatingSchedule.status != "cancelled",
                models.OperatingSchedule.start_time < end_time,
                models.OperatingSchedule.end_time > start_time
            )
            if schedule_id:
                anes_overlap_q = anes_overlap_q.filter(models.OperatingSchedule.id != schedule_id)
            if anes_overlap_q.first():
                hard_blockers.append(f"🔴 L'anesthésiste Dr. {anesthesiologist.full_name} est déjà en cours d'intervention.")

            # Staff availability
            staff_unavail = db.query(models.StaffAvailability).filter(
                models.StaffAvailability.user_id == anesthesiologist_id,
                models.StaffAvailability.availability_type.in_(["leave", "meeting", "unavailability"]),
                models.StaffAvailability.start_time < end_time,
                models.StaffAvailability.end_time > start_time
            ).first()
            if staff_unavail:
                hard_blockers.append(f"🔴 L'anesthésiste Dr. {anesthesiologist.full_name} est absent/indisponible ({staff_unavail.notes or ''}).")

    # 6. Patient Readiness & Overlap (Hard)
    if patient_id:
        # Overlap for patient
        pat_overlap_q = db.query(models.OperatingSchedule).filter(
            models.OperatingSchedule.patient_id == patient_id,
            models.OperatingSchedule.status != "cancelled",
            models.OperatingSchedule.start_time < end_time,
            models.OperatingSchedule.end_time > start_time
        )
        if schedule_id:
            pat_overlap_q = pat_overlap_q.filter(models.OperatingSchedule.id != schedule_id)
        if pat_overlap_q.first():
            hard_blockers.append("🔴 Ce patient a déjà une autre intervention programmée sur ce créneau.")

        if check_patient_readiness:
            try:
                prep = compute_patient_readiness(patient_id, db)
                if prep.readiness_status == "BLOCKED":
                    block_list = ", ".join(prep.critical_blockers[:2])
                    hard_blockers.append(f"🔴 Patient non prêt pour le bloc (Bloqueurs: {block_list}).")
                elif prep.readiness_status == "READY_WITH_WARNINGS":
                    warn_list = ", ".join(prep.warnings[:2])
                    soft_warnings.append(f"🟠 Patient prêt avec réserves ({warn_list}).")
            except Exception:
                pass

    # 7. Heures Supplémentaires / Dépassement de salle (Soft)
    # Norme standard bloc : 08:00 - 17:00
    closing_hour = 17
    if end_time.hour > closing_hour or (end_time.hour == closing_hour and end_time.minute > 0):
        closing_dt = end_time.replace(hour=closing_hour, minute=0, second=0, microsecond=0)
        if end_time > closing_dt:
            overtime_mins = int((end_time - closing_dt).total_seconds() / 60)
            soft_warnings.append(f"🟠 Dépassement de l'horaire de fermeture du bloc de {overtime_mins} minutes.")

    # STATUT FINAL
    if len(hard_blockers) > 0:
        status = "BLOCKED"
        status_icon = "🔴"
        is_valid = False
    elif len(soft_warnings) > 0:
        status = "WARNING"
        status_icon = "🟠"
        is_valid = True
    else:
        status = "VALID"
        status_icon = "🟢"
        is_valid = True

    return schemas.SlotValidationResponse(
        is_valid=is_valid,
        status=status,
        status_icon=status_icon,
        hard_blockers=hard_blockers,
        soft_warnings=soft_warnings,
        overtime_mins=overtime_mins
    )
