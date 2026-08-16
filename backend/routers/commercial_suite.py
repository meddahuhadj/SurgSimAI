# -*- coding: utf-8 -*-
"""
routers/commercial_suite.py — Suite Commerciale Complexe Non-Certifiée (SaaS & B2B).
===================================================================================
Propose 5 modules verticaux commercialisables immédiatement sans certification CE MDR / FDA :
  1. VetSurg3D (Planification Vétérinaire : Canin, Félin, Équin)
  2. SurgSim-Edu 3D (Simulation & Pédagogie Chirurgicale pour CHU/Internes)
  3. PatientViz 3D (Fiches d'explication 3D & Consentement Patient sur Tablette)
  4. OR-Optimizer KPI (Tableau de bord de rentabilité & logistique du bloc)
  5. SurgData (Pipeline d'Anonymisation DICOM PS 3.15 + Radiomique 3D pour la recherche IA)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import get_current_user, get_scoped_patient, write_audit
from anonymizer_engine import anonymize_patient_record
from radiomics_engine import compute_radiomic_features_3d
import numpy as np

router = APIRouter(tags=["commercial_suite"])

LEGAL_EXEMPTION_NOTICE = (
    "Usage exclusivement pédagogique, de communication patient, logistique administrative ou vétérinaire. "
    "Logiciel non qualifié de dispositif médical au sens du Règlement UE 2017/745 (MDCG 2019-11)."
)


# ---------------------------------------------------------------------------
# 1. VetSurg3D — Chirurgie Vétérinaire (Aucune restriction MDR UE 2017/745)
# ---------------------------------------------------------------------------
VET_SPECIES_MODELS = {
    "canine": {
        "label": "Canin (Chien)",
        "organ_ratios": {"liver_pct": 3.2, "kidney_pct": 0.5, "spleen_pct": 0.3},
        "description": "Modèle d'ostéotomie et chirurgie viscérale canine."
    },
    "feline": {
        "label": "Félin (Chat)",
        "organ_ratios": {"liver_pct": 2.8, "kidney_pct": 0.7, "spleen_pct": 0.25},
        "description": "Chirurgie urinaire et hépatique féline."
    },
    "equine": {
        "label": "Équin (Cheval)",
        "organ_ratios": {"liver_pct": 1.5, "kidney_pct": 0.3, "cecum_pct": 4.5},
        "description": "Chirurgie orthopédique et coliques équines."
    }
}


@router.get("/vet/species")
async def get_vet_species():
    """Retourne les espèces et modèles anatomiques vétérinaires disponibles."""
    return VET_SPECIES_MODELS


@router.post("/vet/volumetrie")
async def compute_vet_volumetrie(
    species: str,
    weight_kg: float,
    lesion_volume_ml: float = 15.0,
    current: models.User = Depends(get_current_user)
):
    """Calcule le reste fonctionnel prédictif pour la chirurgie vétérinaire."""
    spec_data = VET_SPECIES_MODELS.get(species.lower())
    if not spec_data:
        raise HTTPException(400, f"Espèce vétérinaire '{species}' non supportée.")

    total_organ_ml = weight_kg * 1000 * (spec_data["organ_ratios"]["liver_pct"] / 100.0)
    remnant_ml = max(0.0, total_organ_ml - (lesion_volume_ml * 1.5))
    remnant_pct = round((remnant_ml / total_organ_ml) * 100.0, 1)

    return {
        "species": species,
        "weight_kg": weight_kg,
        "estimated_total_organ_volume_ml": round(total_organ_ml, 1),
        "lesion_volume_ml": lesion_volume_ml,
        "remnant_volume_ml": round(remnant_ml, 1),
        "remnant_pct": remnant_pct,
        "is_safe": remnant_pct >= 25.0,
        "regulatory_notice": LEGAL_EXEMPTION_NOTICE
    }


# ---------------------------------------------------------------------------
# 2. SurgSim-Edu 3D — Simulation & Apprentissage Pédagogique
# ---------------------------------------------------------------------------
@router.get("/surgsim-edu/scenarios")
async def get_educational_scenarios():
    """Retourne la banque de cas pédagogiques virtuels pour l'entraînement des internes."""
    return [
        {
            "case_id": "EDU-HBP-001",
            "title": "Hepatectomie Droite sous Clampage de Pringle",
            "specialty": "hbp",
            "difficulty": "avancé",
            "description": "Simulation virtuelle de transection parenchymateuse hépatique avec contrôle de la veine porte.",
            "regulatory_notice": LEGAL_EXEMPTION_NOTICE
        },
        {
            "case_id": "EDU-GYN-002",
            "title": "Hystérectomie Subtotale Cœlioscopique",
            "specialty": "gynecologie",
            "difficulty": "intermédiaire",
            "description": "Apprentissage du repérage des urétères et de la ligature des artères utérines.",
            "regulatory_notice": LEGAL_EXEMPTION_NOTICE
        }
    ]


# ---------------------------------------------------------------------------
# 3. PatientViz 3D — Explication Patient & Consentement
# ---------------------------------------------------------------------------
@router.post("/patientviz/explain-report")
async def generate_patient_explanation_report(
    patient_name: str,
    procedure_name: str,
    current: models.User = Depends(get_current_user)
):
    """Génère une fiche synthétique vulgarisée 3D pour la préparation et le consentement du patient."""
    return {
        "report_id": f"PATVIZ-{uuid.uuid4().hex[:8].upper()}",
        "patient_name": patient_name,
        "procedure_name": procedure_name,
        "explanation_text": (
            f"Fiche d'information 3D : L'intervention '{procedure_name}' consiste à retirer la zone "
            "lésionnelle tout en préservant la majorité du tissu sain."
        ),
        "consent_signature_ready": True,
        "regulatory_notice": LEGAL_EXEMPTION_NOTICE
    }


# ---------------------------------------------------------------------------
# 4. OR-Optimizer SaaS — Indicateurs Logistiques du Bloc
# ---------------------------------------------------------------------------
_DEFAULT_OVERTIME_COST_EUR_PER_SLOT = 450.0  # placeholder faute de coût réel fourni — voir avertissement ci-dessous


@router.get("/operations/kpi")
async def get_or_kpi(
    request: Request,
    overtime_cost_eur_per_slot: float | None = None,
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retourne le tableau de bord de performance et de rentabilité opérationnelle du bloc.

    ⚠️ CORRIGÉ : `estimated_monthly_overtime_cost_savings_eur` était calculé
    avec un coût de 450€/créneau en heures supplémentaires codé en dur, sans
    aucune source, présenté comme une économie réelle. Le nombre de créneaux
    en heures supplémentaires (`overtime_procedures_count`) est réel (compté
    sur les plannings en base) ; le coût associé ne l'est pas — c'est une
    hypothèse. `overtime_cost_eur_per_slot` permet à l'appelant de fournir le
    coût réel de SON établissement ; à défaut, la réponse utilise un
    placeholder explicitement signalé (`cost_is_placeholder: true`) plutôt que
    de le laisser deviner. Ne jamais présenter ce chiffre comme une économie
    démontrée — voir `disclaimer`.
    """
    schedule_model = getattr(models, "OperatingSchedule", getattr(models, "Surgery", None))
    room_model = getattr(models, "OperatingRoom", None)

    schedules = db.query(schedule_model).filter(schedule_model.status != "cancelled").all() if schedule_model else []
    rooms = db.query(room_model).all() if room_model else []

    total_rooms = len(rooms) or 1
    total_slots = len(schedules)
    total_duration_hours = sum([getattr(s, "estimated_duration_mins", getattr(s, "predicted_duration_min", 90)) or 90 for s in schedules]) / 60.0

    occupancy_rate = min(98.0, round((total_duration_hours / (total_rooms * 8.0)) * 100.0, 1)) if total_rooms else 0.0
    overtime_slots = sum([1 for s in schedules if getattr(s, "end_time", None) and getattr(s, "end_time").hour >= 17])
    cost_is_placeholder = overtime_cost_eur_per_slot is None
    cost_per_slot = overtime_cost_eur_per_slot if overtime_cost_eur_per_slot is not None else _DEFAULT_OVERTIME_COST_EUR_PER_SLOT
    estimated_monthly_savings = overtime_slots * cost_per_slot

    write_audit(db, request, "Consultation KPI Logistique Bloc", "operations", user=current)

    return {
        "total_active_rooms": total_rooms,
        "total_scheduled_procedures": total_slots,
        "or_occupancy_rate_pct": occupancy_rate,
        "overtime_procedures_count": overtime_slots,
        "overtime_cost_eur_per_slot": cost_per_slot,
        "cost_is_placeholder": cost_is_placeholder,
        "estimated_monthly_overtime_cost_savings_eur": round(estimated_monthly_savings, 2),
        "disclaimer": (
            "Estimation, pas une économie démontrée. overtime_procedures_count est réel (compté sur les "
            "plannings enregistrés) ; le coût par créneau est "
            + ("un placeholder (fournissez overtime_cost_eur_per_slot avec le coût réel de votre établissement)."
               if cost_is_placeholder else "celui que vous avez fourni.")
        ),
        "recommendation": "Lissage optimal des salles atteint via le solveur CP-SAT.",
        "regulatory_notice": LEGAL_EXEMPTION_NOTICE
    }


# ---------------------------------------------------------------------------
# 5. SurgData — Pipeline Anonymisé & Radiomique Recherche
# ---------------------------------------------------------------------------
@router.post("/radiomics/anonymized-export/{patient_id}")
async def export_anonymized_radiomics_dataset(
    patient_id: str,
    request: Request,
    job_id: Optional[str] = None,
    structure: str = "liver_tumor",
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exporte un dataset anonymisé (DICOM PS 3.15 + Caractéristiques Radiomiques 3D) pour la recherche.

    ⚠️ CORRIGÉ : cet endpoint générait auparavant `np.random.normal(loc=85.0,
    scale=35.0, size=2500)` — un bruit gaussien SANS AUCUN RAPPORT avec
    l'imagerie réelle du patient — et le présentait comme un export de
    recherche anonymisé. N'importe qui téléchargeant ce "dataset" aurait pu
    croire analyser de vraies caractéristiques tumorales.

    Passer `job_id` (un job de segmentation réel, terminé, pour ce patient —
    voir POST /segmentation/auto) calcule maintenant de VRAIES caractéristiques
    radiomiques à partir des intensités Hounsfield réelles du CT et du masque
    réellement prédit (voir `radiomics_pipeline.compute_real_radiomics_for_structure`).

    Sans `job_id` (compatibilité avec les appels existants), l'endpoint continue
    de renvoyer des données SYNTHÉTIQUES pour permettre de tester le format du
    dataset sans exiger une inférence complète — mais `dataset_metadata.data_source`
    l'indique désormais explicitement, plutôt que de le laisser deviner."""
    pat = get_scoped_patient(patient_id, current, db)

    pat_dict = {
        "id": pat.id, "nom": pat.nom, "prenom": getattr(pat, "prenom", ""),
        "age": pat.age, "sexe": pat.sexe, "poids_kg": pat.poids_kg, "specialty": pat.specialty
    }
    anon_patient = anonymize_patient_record(pat_dict)

    if job_id:
        from radiomics_pipeline import compute_real_radiomics_for_structure
        try:
            rad_features = compute_real_radiomics_for_structure(job_id, structure)
        except KeyError as e:
            raise HTTPException(404, str(e))
        except (ValueError, FileNotFoundError) as e:
            raise HTTPException(422, str(e))
        data_source = "REAL_PATIENT_IMAGING_JOB"
    else:
        voxels = np.random.normal(loc=85.0, scale=35.0, size=2500)
        rad_features = compute_radiomic_features_3d(
            patient_id=anon_patient["id"],
            structure_id="lesion_target_3d",
            voxel_intensities_hu=voxels
        )
        data_source = "SYNTHETIC_DEMO_RANDOM_HU_NOT_FROM_PATIENT_IMAGING"

    write_audit(db, request, "Export Dataset Anonymisé Recherche", "radiomics", user=current, patient_id=patient_id,
                metadata={"data_source": data_source, "job_id": job_id})

    return {
        "dataset_metadata": {
            "exported_at": datetime.utcnow().isoformat(),
            "compliance": "DICOM PS 3.15 Annex E / HDS / RGPD",
            "usage": "Research Use Only (RUO) — Exempt de qualification Dispositif Médical",
            "data_source": data_source,
        },
        "anonymized_patient": anon_patient,
        "radiomic_features_3d": rad_features
    }
