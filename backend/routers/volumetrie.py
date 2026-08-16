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
from deps import get_current_user, get_scoped_patient, write_audit
from mesh_export import resolve_mesh_path as _resolve_mesh_path
from schemas import VolumetrieResponse

router = APIRouter(tags=["volumetrie"])


def _bsa(weight_kg: float, height_cm: float) -> float:
    return (weight_kg * height_cm / 3600) ** 0.5


def _flr_threshold(is_cirrhotic: bool, bsa: float) -> float:
    if is_cirrhotic:
        return max(35.0, 30.0 + 12.0 * (1.0 - bsa / 1.9))
    return max(25.0, 20.0 + 10.0 * (1.0 - bsa / 1.9))


@router.get("/patients/{patient_id}/volumetrie", response_model=VolumetrieResponse)
async def get_volumetrie(patient_id: str, request: Request, margin_cm: float = 1.0, is_cirrhotic: bool = False,
                          current: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = get_scoped_patient(patient_id, current, db)
    segments = db.query(models.Segment).filter(models.Segment.patient_id == patient_id).all()
    organe_vol = sum(s.volume_ml for s in segments if s.type == "organe")
    lesion_vol = sum(s.volume_ml for s in segments if s.type == "lesion")
    resection_vol_real = sum(s.volume_ml for s in segments if s.type == "resection")

    if organe_vol == 0:
        organe_vol = {"hbp": 1450.0, "colorectal": 350.0, "gastrique": 1100.0, "thyroide": 20.0,
                       "thoracique": 4500.0, "cardiaque": 300.0, "urologie": 150.0}.get(p.specialty, 500.0)
    if lesion_vol == 0:
        lesion_vol = 20.0

    # Priorité à un vrai volume de résection mesuré (segment type="resection",
    # ex. issu d'un maillage réel de résection planifiée — voir
    # SegmentCreate.type) plutôt qu'à une formule inventée. `0.55×organe +
    # 32×marge_cm` n'a AUCUNE justification clinique documentée quelque part
    # dans ce dépôt — ce n'est pas une approximation citée (contrairement à la
    # sphère équivalente de /api/v2/geometry/compute) : c'est une constante
    # arbitraire. On la garde comme dernier repli, mais on dit désormais
    # explicitement qu'elle EST une estimation non validée, jamais silencieusement.
    if resection_vol_real > 0:
        resected = resection_vol_real
        resection_is_estimated = False
        resection_method = ("Somme des segments type='resection' réellement enregistrés pour ce patient "
                             "(volume mesuré, pas estimé).")
    else:
        resected = organe_vol * 0.55 + margin_cm * 32
        resection_is_estimated = True
        resection_method = ("⚠️ Approximation heuristique (0.55×volume organe + 32×marge_cm) SANS justification "
                             "clinique documentée — utilisée faute de segment 'resection' réel enregistré pour "
                             "ce patient. Pour un calcul géométrique réel, voir POST /patients/{id}/margin-safety "
                             "(distance réelle aux structures critiques à partir de maillages) ou enregistrer un "
                             "segment mesuré via POST /patients/{id}/segments (type='resection').")
    remnant_pct = round((organe_vol - resected) / organe_vol * 100, 1)

    result = {
        "patient_id": patient_id, "specialty": p.specialty,
        "organ_volume_ml": round(organe_vol, 1), "lesion_volume_ml": round(lesion_vol, 1),
        "ratio_lesion_organe_pct": round(lesion_vol / organe_vol * 100, 1),
        "volume_resection_ml": round(resected), "remnant_pct": remnant_pct, "margin_cm": margin_cm,
        "resection_volume_is_estimated": resection_is_estimated,
        "resection_calculation_method": resection_method,
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


@router.post("/patients/{patient_id}/margin-safety")
async def evaluate_patient_margin_safety(
    patient_id: str,
    request: Request,
    lesion_id: str = "lesion-01",
    current: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Évalue la sécurité des marges de résection 3D et la proximité des structures vasculaires majeures.

    Calcule sur les VRAIS maillages .glb de ce patient (lésion vs structures
    tubulaires/vasculaires segmentées, `Segment.mesh_ref`) quand ils existent.
    Ne retombe JAMAIS sur des coordonnées inventées : si le maillage requis
    est absent, l'endpoint répond 422 avec une explication exploitable plutôt
    que de renvoyer une marge qui a l'air réelle sans l'être — voir l'ancien
    comportement corrigé (points 3D codés en dur, indépendants du patient)."""
    get_scoped_patient(patient_id, current, db)

    segments = db.query(models.Segment).filter(models.Segment.patient_id == patient_id).all()

    lesion_seg = next((s for s in segments if s.type == "lesion" and s.id == lesion_id), None) \
        or next((s for s in segments if s.type == "lesion"), None)
    if lesion_seg is None:
        raise HTTPException(404, f"Aucun segment de type 'lesion' pour le patient {patient_id} — "
                                  "la segmentation doit être effectuée avant le calcul de marge.")

    lesion_mesh = _resolve_mesh_path(lesion_seg.mesh_ref)
    if lesion_mesh is None:
        raise HTTPException(422, f"Le segment lésion '{lesion_seg.id}' n'a pas de maillage 3D réel "
                                  "(mesh_ref manquant ou fichier introuvable) — impossible de calculer "
                                  "une marge sans géométrie réelle.")

    tubular_segs = [s for s in segments if s.type == "structure_tubulaire"]
    critical_meshes = {}
    for s in tubular_segs:
        mesh_path = _resolve_mesh_path(s.mesh_ref)
        if mesh_path is not None:
            critical_meshes[s.label or s.id] = str(mesh_path)

    if not critical_meshes:
        raise HTTPException(422, "Aucune structure tubulaire/vasculaire segmentée avec un maillage 3D réel "
                                  f"pour le patient {patient_id} — impossible d'évaluer le risque d'invasion "
                                  "sans au moins une structure critique maillée.")

    from margin_safety_engine import evaluate_surgical_margins_from_meshes

    report = evaluate_surgical_margins_from_meshes(
        patient_id=patient_id,
        lesion_id=lesion_seg.id,
        lesion_mesh_path=str(lesion_mesh),
        critical_structures_mesh_paths=critical_meshes
    )

    write_audit(db, request, "Calcul des marges chirurgicales 3D", "volumetrie", user=current, patient_id=patient_id)
    return report


from pydantic import BaseModel
class GeometryComputeRequest(BaseModel):
    tumor_volume_ml: float = 20.0
    organ_volume_ml: float = 1450.0
    vessel_distance_mm: float | None = None
    margin_mm: float = 10.0
    # Champs optionnels pour le score de compromis (voir compute_resection_tradeoff_score) :
    # aucun n'est requis, le score se dégrade honnêtement (classe hépatique
    # "inconnue" traitée comme classe A par défaut) si absents — voir son
    # docstring pour la justification de cette hypothèse.
    is_cirrhotic: bool = False
    bsa_m2: float = 1.9  # BSA de référence adulte — voir _flr_threshold ci-dessus
    child_pugh_class: str | None = None

@router.post("/api/v2/geometry/compute")
async def compute_exact_geometry(req: GeometryComputeRequest):
    """
    Moteur géométrique analytique (sphère équivalente) pour les métriques de
    scénario du Mode Simulation.

    ATTENTION — honnêteté du calcul (voir aussi SURGSIM_RESEARCH_GUIDE.md) :
    ceci n'est PAS un calcul sur maillage triangulé exact. La tumeur est
    approximée par une sphère de volume équivalent, et le volume réséqué est
    celui de cette sphère dilatée de `margin_mm`. La distance à la structure
    vasculaire critique n'est jamais recalculée ici : c'est un fait anatomique
    fixe du cas, fourni en entrée (`vessel_distance_mm`), qui ne varie pas
    avec la marge choisie. Ce qui varie avec la marge, c'est de savoir si la
    marge demandée dépasse la place réellement disponible avant cette
    structure (`vessel_margin_deficit_mm`).

    Un moteur trimesh exact existe réellement dans ce dépôt
    (`backend/mesh_export.py::surface_to_surface_min_distance`, testé dans
    `backend/tests/test_mesh_distance.py`) mais il opère sur deux maillages
    triangulés (.glb) réels — non disponibles pour le catalogue de cas de
    simulation synthétiques actuel (CASE_LIBRARY, description texte sans
    mesh). Ne pas relabelliser cet endpoint comme "trimesh" tant que cette
    donnée n'existe pas réellement en entrée.
    """
    r_base_cm = ((3 * req.tumor_volume_ml) / (4 * 3.14159265)) ** (1 / 3) if req.tumor_volume_ml > 0 else 0.0
    r_margin_cm = r_base_cm + (req.margin_mm / 10.0)
    vol_resected = (4 / 3) * 3.14159265 * (r_margin_cm ** 3)
    remnant_vol = max(0.0, req.organ_volume_ml - vol_resected)
    flr_pct = round((remnant_vol / req.organ_volume_ml) * 100, 1) if req.organ_volume_ml > 0 else None

    vessel_margin_deficit_mm = None
    margin_exceeds_vessel = None
    if req.vessel_distance_mm is not None:
        vessel_margin_deficit_mm = round(max(0.0, req.margin_mm - req.vessel_distance_mm), 1)
        margin_exceeds_vessel = vessel_margin_deficit_mm > 0

    # Score de compromis (Scenario Graph) : seulement calculable si un FLR%
    # existe (organ_volume_ml > 0) — jamais de score sur une donnée absente.
    tradeoff = None
    if flr_pct is not None:
        from clinical_scores import compute_resection_tradeoff_score
        flr_threshold_pct = _flr_threshold(req.is_cirrhotic, req.bsa_m2)
        tradeoff = compute_resection_tradeoff_score(
            remnant_pct=flr_pct,
            flr_threshold_pct=round(flr_threshold_pct, 1),
            child_pugh_class=req.child_pugh_class,
            vessel_margin_deficit_mm=vessel_margin_deficit_mm or 0.0,
        )
        tradeoff["flr_threshold_pct"] = round(flr_threshold_pct, 1)

    return {
        "status": "success",
        "engine": "analytic-sphere-equivalent-v1",
        "is_exact_mesh": False,
        "resected_volume_ml": round(vol_resected, 1),
        "remnant_volume_ml": round(remnant_vol, 1),
        "flr_pct": flr_pct,
        "vessel_distance_mm": req.vessel_distance_mm,
        "vessel_margin_deficit_mm": vessel_margin_deficit_mm,
        "margin_exceeds_vessel_distance": margin_exceeds_vessel,
        "calculation_method": "Approximation analytique (sphère équivalente dilatée par la marge) — PAS un calcul de mesh triangulé exact.",
        "tradeoff": tradeoff,
    }
